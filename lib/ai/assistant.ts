import { createAssistantActionLog } from "@/lib/ai/actions";
import { loadAssistantContext } from "@/lib/ai/context";
import { buildInventoryEntry } from "@/lib/ai/inventory-utils";
import { getAssistantModel, getOpenAIClient } from "@/lib/ai/openai";
import type { AssistantInventoryItem, AssistantProposal, AssistantResponse } from "@/lib/ai/types";

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

function parseInventoryItems(value: unknown): AssistantInventoryItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const ingredientName = asString(record.ingredient_name).trim();
      const quantity = asNumber(record.quantity);
      const unit = asString(record.unit, "un").trim();

      if (!ingredientName || quantity <= 0) return null;

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

      return {
        ingredient_name: enriched.ingredient_name,
        quantity,
        unit: enriched.unit,
        category: enriched.category,
        expiry_date: enriched.expiry_date,
        storage_location: enriched.storage_location,
        notes: enriched.notes
      };
    })
    .filter((item): item is AssistantInventoryItem => Boolean(item));
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

function buildSystemPrompt(context: Awaited<ReturnType<typeof loadAssistantContext>>) {
  return [
    "És o assistente do Chef Familiar. Responde em português europeu, de forma curta e prática.",
    "A v1 é focada em inventário e lista de compras. Não inventes alterações persistentes.",
    "Quando o utilizador disser que comprou/trouxe/adicionou ingredientes, usa a ferramenta propose_inventory_entries.",
    "Quando o utilizador pedir para marcar um item da lista como comprado, usa propose_mark_shopping_item_purchased e escolhe um item_id real do contexto.",
    "Se estiveres apenas a responder a uma pergunta, não uses ferramentas.",
    "Todas as ferramentas são propostas: a app pedirá confirmação antes de executar.",
    "Contexto JSON:",
    JSON.stringify(context)
  ].join("\n");
}

export async function createAssistantProposal(userMessage: string): Promise<AssistantResponse> {
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
  if (!context.configured) {
    return {
      message: "A Supabase ainda não está configurada. Posso ajudar quando as variáveis estiverem definidas na Vercel.",
      requiresConfirmation: false,
      logId: null,
      proposal: { kind: "answer", summary: "Supabase não configurada." }
    };
  }

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

  const completion = await client.chat.completions.create({
    model: getAssistantModel(),
    messages: [
      { role: "system", content: buildSystemPrompt(context) },
      { role: "user", content: message }
    ],
    tools,
    tool_choice: "auto"
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
