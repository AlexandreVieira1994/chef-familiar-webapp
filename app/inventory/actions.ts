"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";

function text(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: FormDataEntryValue | null) {
  const raw = text(value).replace(",", ".");
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

type Estimate = {
  category: string;
  storage: string;
  days: number;
  note: string;
};

const estimates: Array<{ words: string[]; value: Estimate }> = [
  { words: ["cenoura", "cenouras"], value: { category: "Legume", storage: "Frigorífico", days: 18, note: "Validade estimada automaticamente; usar antes se estiver mole, cortada ou com manchas." } },
  { words: ["batata-doce", "batata doce"], value: { category: "Tubérculo", storage: "Despensa", days: 14, note: "Guardar em local fresco e seco; usar primeiro se tiver zonas moles." } },
  { words: ["batata", "batatas"], value: { category: "Tubérculo", storage: "Despensa", days: 28, note: "Guardar em local fresco, escuro e seco; afastar de cebolas." } },
  { words: ["cebola", "cebolas"], value: { category: "Legume", storage: "Despensa", days: 30, note: "Guardar em local seco e ventilado." } },
  { words: ["alho"], value: { category: "Legume", storage: "Despensa", days: 45, note: "Guardar seco e ventilado." } },
  { words: ["tomate", "tomates"], value: { category: "Legume/fruto", storage: "Despensa", days: 7, note: "Se estiver muito maduro, refrigerar e usar em breve." } },
  { words: ["alface"], value: { category: "Legume", storage: "Frigorífico", days: 5, note: "Folhas têm validade curta; usar em breve." } },
  { words: ["brócolos", "brocolos", "couve-flor", "couve flor"], value: { category: "Legume", storage: "Frigorífico", days: 5, note: "Usar em breve; também pode ser branqueado e congelado." } },
  { words: ["maçã", "maca", "maçãs", "macas"], value: { category: "Fruta", storage: "Frigorífico", days: 21, note: "Dura mais no frigorífico; separar de fruta muito madura." } },
  { words: ["banana", "bananas"], value: { category: "Fruta", storage: "Bancada", days: 5, note: "Quando amadurecer, pode congelar em rodelas para papas/smoothies." } },
  { words: ["laranja", "laranjas", "tangerina", "tangerinas"], value: { category: "Fruta", storage: "Frigorífico", days: 21, note: "Boa fonte de vitamina C; útil com refeições ricas em ferro vegetal." } },
  { words: ["morango", "morangos"], value: { category: "Fruta", storage: "Frigorífico", days: 3, note: "Muito perecível; lavar apenas antes de usar." } },
  { words: ["lentilha", "lentilhas", "feijão seco", "feijao seco", "grão seco", "grao seco"], value: { category: "Leguminosa seca", storage: "Despensa", days: 365, note: "Validade longa se estiver seco e bem fechado." } },
  { words: ["feijão", "feijao", "grão", "grao", "ervilha", "ervilhas"], value: { category: "Leguminosa", storage: "Despensa", days: 365, note: "Se for enlatado/frasco fechado, validade longa; depois de aberto, guardar no frigorífico e usar em 2-3 dias." } },
  { words: ["arroz", "massa", "couscous", "aveia", "farinha"], value: { category: "Cereal/hidrato", storage: "Despensa", days: 365, note: "Guardar seco e bem fechado." } },
  { words: ["ovo", "ovos"], value: { category: "Ovos", storage: "Frigorífico", days: 21, note: "Para bebé, servir sempre bem cozinhado." } },
  { words: ["pescada", "salmão", "salmao", "bacalhau"], value: { category: "Peixe", storage: "Frigorífico", days: 1, note: "Peixe fresco deve ser usado rapidamente; congelar se não for usado no dia seguinte." } },
  { words: ["bebida vegetal", "leite vegetal"], value: { category: "Alternativa vegetal", storage: "Despensa", days: 180, note: "Fechado dura bastante; depois de aberto, seguir embalagem e guardar no frigorífico." } }
];

function estimateIngredient(input: string): Estimate {
  const name = input.toLowerCase();
  const match = estimates.find((item) => item.words.some((word) => name.includes(word)));
  return match?.value ?? {
    category: "Outro",
    storage: "Despensa",
    days: 14,
    note: "Estimativa genérica automática; confirmar validade real pela embalagem/aspecto."
  };
}

function buildEntry(ingredientName: string, quantity: number, unit: string, categoryInput = "", expiryInput = "", storageInput = "", notesInput = "") {
  const estimate = estimateIngredient(ingredientName);
  const category = categoryInput || estimate.category;
  const storageLocation = storageInput || estimate.storage;
  const notes = notesInput ? `${notesInput} | ${estimate.note}` : estimate.note;

  return {
    ingredient_name: ingredientName,
    quantity_initial: quantity,
    quantity_remaining: quantity,
    unit,
    category,
    source: "App web",
    expiry_date: expiryInput || addDays(estimate.days),
    storage_location: storageLocation,
    status: "disponivel",
    notes
  };
}

type ParsedItem = {
  ingredientName: string;
  quantity: number;
  unit: string;
};

function parseInventoryText(input: string): ParsedItem[] {
  const cleaned = input
    .replace(/\bcomprei\b/gi, "")
    .replace(/\btrouxe\b/gi, "")
    .replace(/\badicionei\b/gi, "")
    .replace(/\be\b/gi, ",")
    .replace(/\n/g, ",");

  return cleaned
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const match = part.match(/^(\d+(?:[\.,]\d+)?)\s*(kg|g|gr|un|uni|unid|l|lt|ml|lata|latas|embalagem|embalagens|molho|molhos)?\s+(.+)$/i);
      if (!match) return null;

      const quantity = Number(match[1].replace(",", "."));
      const rawUnit = (match[2] || "un").toLowerCase();
      const ingredientName = match[3].trim();
      const unitMap: Record<string, string> = {
        gr: "g",
        uni: "un",
        unid: "un",
        lt: "L",
        lata: "un",
        latas: "un",
        embalagem: "un",
        embalagens: "un",
        molho: "un",
        molhos: "un"
      };
      const unit = unitMap[rawUnit] ?? rawUnit;

      if (!ingredientName || !Number.isFinite(quantity) || quantity <= 0) return null;
      return { ingredientName, quantity, unit };
    })
    .filter((item): item is ParsedItem => Boolean(item));
}

export async function addInventoryEntry(formData: FormData) {
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }

  const ingredientName = text(formData.get("ingredient_name"));
  const quantity = numberValue(formData.get("quantity_initial"));
  const unit = text(formData.get("unit"));

  if (!ingredientName || quantity <= 0 || !unit) {
    throw new Error("Ingredient, quantity and unit are required");
  }

  const entry = buildEntry(
    ingredientName,
    quantity,
    unit,
    text(formData.get("category")),
    text(formData.get("expiry_date")),
    text(formData.get("storage_location")),
    text(formData.get("notes"))
  );

  const { error } = await supabase.from("inventory_entries").insert(entry);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/inventory");
}

export async function addInventoryFromText(formData: FormData) {
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }

  const input = text(formData.get("inventory_text"));
  const parsed = parseInventoryText(input);

  if (parsed.length === 0) {
    throw new Error("No valid inventory items found");
  }

  const entries = parsed.map((item) => buildEntry(item.ingredientName, item.quantity, item.unit));
  const { error } = await supabase.from("inventory_entries").insert(entries);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/inventory");
}
