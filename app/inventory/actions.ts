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
  { words: ["batata", "batatas"], value: { category: "Tubérculo", storage: "Despensa", days: 28, note: "Guardar em local fresco, escuro e seco; afastar de cebolas." } },
  { words: ["batata-doce", "batata doce"], value: { category: "Tubérculo", storage: "Despensa", days: 14, note: "Guardar em local fresco e seco; usar primeiro se tiver zonas moles." } },
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

  const estimate = estimateIngredient(ingredientName);
  const expiryDate = text(formData.get("expiry_date"));
  const category = text(formData.get("category")) || estimate.category;
  const storageLocation = text(formData.get("storage_location")) || estimate.storage;
  const userNotes = text(formData.get("notes"));
  const notes = userNotes ? `${userNotes} | ${estimate.note}` : estimate.note;

  const { error } = await supabase.from("inventory_entries").insert({
    ingredient_name: ingredientName,
    quantity_initial: quantity,
    quantity_remaining: quantity,
    unit,
    category,
    source: text(formData.get("source")) || "App web",
    expiry_date: expiryDate || addDays(estimate.days),
    storage_location: storageLocation,
    status: "disponivel",
    notes
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/inventory");
}
