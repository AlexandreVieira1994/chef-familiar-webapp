import { createAssistantActionLog } from "@/lib/ai/actions";
import { loadAssistantContext } from "@/lib/ai/context";
import { buildInventoryEntry } from "@/lib/ai/inventory-utils";
import { getAssistantModel, getOpenAIClient } from "@/lib/ai/openai";
import type { AssistantInventoryItem, AssistantProposal, AssistantResponse } from "@/lib/ai/types";

type AssistantContext = Awaited<ReturnType<typeof loadAssistantContext>>;

type RecipeForAssistantPlan = {
  id: string;
  code: string;
  name: string;
  category: string;
  status: string;
  notes?: string | null;
};

type AssistantChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function parseChatHistory(value: unknown): AssistantChatMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const role = record.role === "user" || record.role === "assistant" ? record.role : null;
      const content = asString(record.content).trim();
      if (!role || !content) return null;
      return { role, content };
    })
    .filter((item): item is AssistantChatMessage => Boolean(item))
    .slice(-8);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function nextWeekday(fromDate: string, targetWeekday: number) {
  const date = new Date(`${fromDate}T00:00:00`);
  const distance = (targetWeekday - date.getDay() + 7) % 7;
  return addDays(fromDate, distance);
}

function nextMonday(fromDate: string) {
  const date = new Date(`${fromDate}T00:00:00`);
  const distance = (1 - date.getDay() + 7) % 7 || 7;
  return addDays(fromDate, distance);
}

function statusRank(status: string) {
  if (status === "aprovada") return 0;
  if (status === "neutra") return 1;
  if (status === "a_melhorar") return 2;
  if (status === "por_testar") return 3;
  return 4;
}

function isPlanRequest(message: string) {
  return /plano|planeia|planeamento|ementa|refei[cç][oõ]es/i.test(message);
}

function isPlanActionRequest(message: string) {
  return isPlanRequest(message) && /faz|fazer|cria|criar|gera|gerar|planeia|monta|montar|prepara|preparar/i.test(message);
}

function isPlanChangeRequest(message: string, history: AssistantChatMessage[]) {
  const asksForChange = /altera|alterar|muda|mudar|troca|trocar|ajusta|ajustar|refaz|refazer|substitui|substituir|poe|põe|por|coloca|colocar|guarda|guardar|grava|gravar|regista|registrar|propoe|propõe|avanca|avança|sim/i.test(message);
  if (!asksForChange) return false;
  return history.some((item) => isPlanRequest(item.content) || /create_meal_plan|Proponho um plano|cozinha apenas/i.test(item.content));
}

function isInventoryActionRequest(message: string) {
  return /comprei|trouxe|adicionei|adicionar|regista|registrar|guarda|guardar/i.test(message)
    && !/plano|planeador|planejador|ementa|refei[cç][oõ]es/i.test(message);
}

function isMarkShoppingPurchasedRequest(message: string) {
  return /marca|marcar|comprei|comprado|comprada/i.test(message)
    && /lista|compra|compras|item|produto/i.test(message);
}

function selectedToolsForMessage(message: string) {
  if (isMarkShoppingPurchasedRequest(message)) {
    return {
      tools,
      tool_choice: {
        type: "function" as const,
        function: { name: "propose_mark_shopping_item_purchased" }
      }
    };
  }

  if (isInventoryActionRequest(message)) {
    return {
      tools,
      tool_choice: {
        type: "function" as const,
        function: { name: "propose_inventory_entries" }
      }
    };
  }

  return { tools: undefined, tool_choice: undefined };
}

function requestedDays(message: string) {
  const match = message.match(/(\d{1,2})\s*dias?/i);
  if (!match) return 7;
  const days = Number(match[1]);
  return Number.isFinite(days) ? Math.min(Math.max(Math.trunc(days), 1), 14) : 7;
}

function selectedMealSlots(message: string) {
  const slots: string[] = [];
  if (/pequeno[- ]?almo[cç]o/i.test(message)) slots.push("pequeno_almoco");
  if (/almo[cç]o/i.test(message)) slots.push("almoco");
  if (/lanche/i.test(message)) slots.push("lanche");
  if (/jantar/i.test(message)) slots.push("jantar");
  return slots.length > 0 ? Array.from(new Set(slots)) : ["jantar"];
}

function asRecipeForPlan(value: unknown): RecipeForAssistantPlan | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id = asString(record.id);
  const code = asString(record.code);
  const name = asString(record.name);
  const category = asString(record.category);
  const status = asString(record.status);
  if (!id || !code || !name || !category) return null;
  return {
    id,
    code,
    name,
    category,
    status,
    notes: typeof record.notes === "string" ? record.notes : null
  };
}

function parseInventoryItems(value: unknown): AssistantInventoryItem[] {
  if (!Array.isArray(value)) return [];

  const items: AssistantInventoryItem[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const ingredientName = asString(record.ingredient_name).trim();
    const quantity = asNumber(record.quantity);
    const unit = asString(record.unit, "un").trim();

    if (!ingredientName || quantity <= 0) continue;

    const enriched = buildInventoryEntry(
      ingredientName,
      quantity,
      unit,
      asString(record.category),
      asString(record.expiry_date),
      asString(record.storage_location),
      asString(record.notes),
      "Assistente"
    );

    items.push({
      ingredient_name: enriched.ingredient_name,
      quantity,
      unit: enriched.unit,
      category: enriched.category,
      expiry_date: enriched.expiry_date,
      storage_location: enriched.storage_location,
      notes: enriched.notes
    });
  }

  return items;
}

function createBatchMealPlanProposal(message: string, context: AssistantContext, history: AssistantChatMessage[] = []): AssistantResponse | null {
  const isChangeRequest = isPlanChangeRequest(message, history);
  if (!isPlanActionRequest(message) && !isChangeRequest) return null;
  const planningContext = isChangeRequest ? `${history.map((item) => item.content).join("\n")}\n${message}` : message;

  if (/pr[oó]xima semana|semana que vem/i.test(planningContext) && /amanh[aã]/i.test(planningContext)) {
    return {
      message: "Consigo fazer esse plano, mas preciso de confirmar uma coisa: queres que o plano comece amanha por causa da pizza, ou que comece na proxima segunda-feira e a pizza fique fora do plano semanal?",
      requiresConfirmation: false,
      logId: null,
      proposal: { kind: "answer", summary: "Pedido de plano com data ambigua." }
    };
  }

  const recipes = context.recipes
    .map(asRecipeForPlan)
    .filter((recipe): recipe is RecipeForAssistantPlan => Boolean(recipe))
    .filter((recipe) => recipe.status !== "rejeitada")
    .sort((a, b) => statusRank(a.status) - statusRank(b.status) || a.code.localeCompare(b.code));

  if (recipes.length === 0) {
    return {
      message: "Não encontrei receitas disponíveis para criar um plano.",
      requiresConfirmation: false,
      logId: null,
      proposal: { kind: "answer", summary: "Sem receitas disponíveis." }
    };
  }

  const days = requestedDays(planningContext);
  const startDate = /pr[oó]xima semana|semana que vem/i.test(planningContext)
    ? nextMonday(today())
    : /domingo/i.test(planningContext)
      ? nextWeekday(today(), 0)
      : today();
  const endDate = addDays(startDate, days - 1);
  const slots = selectedMealSlots(planningContext);
  const replaceExisting = !/sem substituir|n[aã]o substitu/i.test(planningContext);
  const cookingOnlySundayWednesday = /domingo/i.test(planningContext) && /quarta/i.test(planningContext);
  const firstCookDay = startDate;
  const secondCookDay = nextWeekday(startDate, 3);

  const entries: Extract<AssistantProposal, { kind: "create_meal_plan" }>["entries"] = [];
  let cursor = 0;
  let fishCount = 0;

  for (let day = 0; day < days; day += 1) {
    const plannedDate = addDays(startDate, day);
    const cookDate = cookingOnlySundayWednesday && plannedDate >= secondCookDay ? secondCookDay : firstCookDay;
    const batchLabel = cookingOnlySundayWednesday
      ? `Cozinhar em lote no dia ${cookDate}; reaquecer/usar sobras neste dia.`
      : "Plano gerado pelo assistente.";

    for (const slot of slots) {
      let chosen = recipes[cursor % recipes.length];

      for (let attempts = 0; attempts < recipes.length; attempts += 1) {
        const candidate = recipes[(cursor + attempts) % recipes.length];
        const isFish = candidate.category.toLowerCase().includes("peixe");
        if (!isFish || fishCount < 2 || recipes.length <= 2) {
          chosen = candidate;
          cursor += attempts + 1;
          break;
        }
      }

      if (chosen.category.toLowerCase().includes("peixe")) fishCount += 1;

      entries.push({
        planned_date: plannedDate,
        meal_slot: slot,
        recipe_id: chosen.id,
        recipe_code: chosen.code,
        recipe_name: chosen.name,
        notes: batchLabel
      });
    }
  }

  const summary = cookingOnlySundayWednesday
    ? `Proponho um plano de ${days} dias, com cozinha apenas no domingo (${firstCookDay}) e na quarta (${secondCookDay}), respeitando o limite de peixe.`
    : `Proponho um plano de ${days} dias com ${entries.length} refeição(ões).`;

  return {
    message: summary,
    requiresConfirmation: false,
    logId: null,
    proposal: {
      kind: "create_meal_plan",
      summary,
      start_date: startDate,
      end_date: endDate,
      replace_existing: replaceExisting,
      entries
    }
  };
}

function fallbackShoppingAnswer(context: Awaited<ReturnType<typeof loadAssistantContext>>): AssistantResponse {
  const pending = context.shoppingItems
    .filter((item) => {
      const row = item as { purchased_status?: string };
      return row.purchased_status !== "comprado";
    })
    .slice(0, 12);

  if (pending.length === 0) {
    return {
      message: "Não encontrei itens pendentes na lista de compras ativa.",
      requiresConfirmation: false,
      logId: null,
      proposal: { kind: "answer", summary: "Não há itens pendentes na lista ativa." }
    };
  }

  const summary = pending
    .map((item) => {
      const row = item as { ingredient_name?: string; planned_quantity?: number | null; planned_unit?: string | null };
      return `${row.ingredient_name ?? "Ingrediente"} (${row.planned_quantity ?? "-"} ${row.planned_unit ?? ""})`;
    })
    .join(", ");

  return {
    message: `Na lista ativa ainda faltam: ${summary}.`,
    requiresConfirmation: false,
    logId: null,
    proposal: { kind: "answer", summary }
  };
}

const tools = [
  {
    type: "function" as const,
    function: {
      name: "propose_inventory_entries",
      description: "Propõe adicionar ingredientes comprados ao inventário. Não executa a alteração.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          summary: { type: "string" },
          items: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                ingredient_name: { type: "string" },
                quantity: { type: "number" },
                unit: { type: "string" },
                category: { type: "string" },
                expiry_date: { type: "string" },
                storage_location: { type: "string" },
                notes: { type: "string" }
              },
              required: ["ingredient_name", "quantity", "unit"]
            }
          }
        },
        required: ["summary", "items"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "propose_mark_shopping_item_purchased",
      description: "Propõe marcar um item existente da lista de compras como comprado. Não executa a alteração.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          summary: { type: "string" },
          item_id: { type: "string" },
          purchased_quantity: { type: "number" },
          purchased_unit: { type: "string" }
        },
        required: ["summary", "item_id"]
      }
    }
  }
];

function buildSystemPrompt(context: Awaited<ReturnType<typeof loadAssistantContext>>, currentPath = "") {
  return [
    "Es o assistente geral do Chef Familiar. Funcionas como chat da app inteira, nao como assistente de uma unica pagina.",
    "Responde em portugues europeu, de forma curta, pratica e orientada para a tarefa do utilizador.",
    "Ajuda com receitas, inventario, compras, planeador, regras da familia, BLW, aproveitamento de sobras e navegacao conceptual da app.",
    "Usa o historico da conversa para entender pedidos como alterar, refazer, trocar, confirmar ou continuar.",
    "So cries propostas executaveis quando o utilizador pedir uma acao clara. Se for pergunta, conselho, comparacao ou explicacao, responde em texto.",
    "Nunca transformes uma confirmacao textual isolada em inventario ou compras. Confirmacoes de propostas sao tratadas pela interface.",
    "Acoes executaveis atuais: adicionar itens ao inventario, marcar compras como compradas, criar/alterar plano simples. Todas pedem confirmacao antes de gravar.",
    "Quando o utilizador disser que comprou/trouxe/adicionou ingredientes, usa a ferramenta propose_inventory_entries.",
    "Quando o utilizador pedir para marcar um item da lista como comprado, usa propose_mark_shopping_item_purchased e escolhe um item_id real do contexto.",
    "Se o utilizador pedir uma acao persistente que ainda nao exista como ferramenta, explica o que consegues fazer agora e oferece o melhor passo manual dentro da app.",
    `Pagina atual: ${currentPath || "desconhecida"}.`,
    "Contexto JSON:",
    JSON.stringify(context)
  ].join("\n");
}

export async function createAssistantProposal(userMessage: string, rawHistory: unknown = [], currentPath = ""): Promise<AssistantResponse> {
  const message = userMessage.trim();
  if (!message) {
    return {
      message: "Escreve o que queres registar ou perguntar.",
      requiresConfirmation: false,
      logId: null,
      proposal: { kind: "answer", summary: "Mensagem vazia." }
    };
  }

  const context = await loadAssistantContext();
  const history = parseChatHistory(rawHistory);
  if (!context.configured) {
    return {
      message: "A Supabase ainda não está configurada. Posso ajudar quando as variáveis estiverem definidas na Vercel.",
      requiresConfirmation: false,
      logId: null,
      proposal: { kind: "answer", summary: "Supabase não configurada." }
    };
  }

  const mealPlanProposal = createBatchMealPlanProposal(message, context, history);
  if (mealPlanProposal?.proposal.kind === "create_meal_plan") {
    const logId = await createAssistantActionLog(message, mealPlanProposal.proposal);
    return {
      ...mealPlanProposal,
      requiresConfirmation: Boolean(logId),
      logId
    };
  }
  if (mealPlanProposal) return mealPlanProposal;

  if (/falta|comprar|lista/i.test(message) && !/comprei|trouxe|adicionei|marca/i.test(message)) {
    return fallbackShoppingAnswer(context);
  }

  const client = getOpenAIClient();
  if (!client) {
    return {
      message: "Falta configurar OPENAI_API_KEY na Vercel/localmente. A assinatura ChatGPT não substitui a chave da API.",
      requiresConfirmation: false,
      logId: null,
      proposal: { kind: "answer", summary: "OpenAI API key não configurada." }
    };
  }

  const toolConfig = selectedToolsForMessage(message);
  const completion = await client.chat.completions.create({
    model: getAssistantModel(),
    messages: [
      { role: "system", content: buildSystemPrompt(context, currentPath) },
      ...history.map((item) => ({ role: item.role, content: item.content })),
      { role: "user", content: message }
    ],
    ...(toolConfig.tools ? { tools: toolConfig.tools, tool_choice: toolConfig.tool_choice } : {})
  });

  const choice = completion.choices[0];
  const toolCall = choice?.message.tool_calls?.[0];

  if (!toolCall) {
    const summary = choice?.message.content?.trim() || "Não encontrei uma ação segura para propor.";
    return {
      message: summary,
      requiresConfirmation: false,
      logId: null,
      proposal: { kind: "answer", summary }
    };
  }

  const args = safeJsonParse(toolCall.function.arguments);
  let proposal: AssistantProposal;

  if (toolCall.function.name === "propose_inventory_entries") {
    const items = parseInventoryItems(args.items);
    if (items.length === 0) {
      return {
        message: "Não consegui identificar ingredientes com quantidade suficiente para adicionar ao inventário.",
        requiresConfirmation: false,
        logId: null,
        proposal: { kind: "answer", summary: "Sem ingredientes válidos." }
      };
    }

    proposal = {
      kind: "add_inventory_entries",
      summary: asString(args.summary, `Adicionar ${items.length} item(ns) ao inventário.`),
      items
    };
  } else if (toolCall.function.name === "propose_mark_shopping_item_purchased") {
    const itemId = asString(args.item_id);
    const knownItemIds = new Set(
      context.shoppingItems
        .map((item) => (item as { id?: unknown }).id)
        .filter((id): id is string => typeof id === "string")
    );

    if (!itemId || !knownItemIds.has(itemId)) {
      return {
        message: "Não consegui associar esse pedido a um item real da lista de compras ativa.",
        requiresConfirmation: false,
        logId: null,
        proposal: { kind: "answer", summary: "Item da lista não identificado." }
      };
    }

    proposal = {
      kind: "mark_shopping_item_purchased",
      summary: asString(args.summary, "Marcar item como comprado."),
      item_id: itemId,
      purchased_quantity: args.purchased_quantity === undefined ? undefined : asNumber(args.purchased_quantity),
      purchased_unit: args.purchased_unit === undefined ? undefined : asString(args.purchased_unit)
    };
  } else {
    const summary = "Não encontrei uma ação suportada para esta versão.";
    return {
      message: summary,
      requiresConfirmation: false,
      logId: null,
      proposal: { kind: "answer", summary }
    };
  }

  const logId = await createAssistantActionLog(message, proposal);
  return {
    message: proposal.summary,
    requiresConfirmation: Boolean(logId),
    logId,
    proposal
  };
}
