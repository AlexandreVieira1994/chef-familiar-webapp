import { getPersistedInventoryStatus } from "@/lib/inventory-status";

export type InventoryEstimate = {
  category: string;
  storage: string;
  days: number;
  note: string;
};

export type InventoryEntryInput = {
  ingredient_name: string;
  quantity_initial: number;
  quantity_remaining: number;
  unit: string;
  category: string;
  source: string;
  expiry_date: string;
  storage_location: string;
  status: string;
  notes: string;
};

const estimates: Array<{ words: string[]; value: InventoryEstimate }> = [
  { words: ["cenoura", "cenouras"], value: { category: "Legume", storage: "Frigorífico", days: 18, note: "Validade estimada automaticamente; usar antes se estiver cortada, marcada ou com manchas." } },
  { words: ["batata-doce", "batata doce"], value: { category: "Tubérculo", storage: "Despensa", days: 14, note: "Guardar em local fresco e seco; usar primeiro se tiver sinais de deterioracao." } },
  { words: ["batata", "batatas"], value: { category: "Tubérculo", storage: "Despensa", days: 28, note: "Guardar em local fresco, escuro e seco; afastar de cebolas." } },
  { words: ["cebola", "cebolas"], value: { category: "Legume", storage: "Despensa", days: 30, note: "Guardar em local seco e ventilado." } },
  { words: ["alho"], value: { category: "Legume", storage: "Despensa", days: 45, note: "Guardar seco e ventilado." } },
  { words: ["tomate", "tomates"], value: { category: "Legume/fruto", storage: "Despensa", days: 7, note: "Se estiver muito maduro, refrigerar e usar em breve." } },
  { words: ["alface"], value: { category: "Legume", storage: "Frigorífico", days: 5, note: "Folhas têm validade curta; usar em breve." } },
  { words: ["brócolos", "brocolos", "couve-flor", "couve flor"], value: { category: "Legume", storage: "Frigorífico", days: 5, note: "Usar em breve; também pode ser branqueado e congelado." } },
  { words: ["maçã", "maca", "maçãs", "macas"], value: { category: "Fruta", storage: "Frigorífico", days: 21, note: "Dura mais no frigorífico; manter longe de fruta muito madura." } },
  { words: ["banana", "bananas"], value: { category: "Fruta", storage: "Bancada", days: 5, note: "Quando amadurecer, pode congelar em rodelas para batidos ou bolos." } },
  { words: ["laranja", "laranjas", "tangerina", "tangerinas"], value: { category: "Fruta", storage: "Frigorífico", days: 21, note: "Boa fonte de vitamina C; útil com refeições ricas em ferro vegetal." } },
  { words: ["morango", "morangos"], value: { category: "Fruta", storage: "Frigorífico", days: 3, note: "Muito perecível; lavar apenas antes de usar." } },
  { words: ["lentilha", "lentilhas", "feijão seco", "feijao seco", "grão seco", "grao seco"], value: { category: "Leguminosa seca", storage: "Despensa", days: 365, note: "Validade longa se estiver seco e bem fechado." } },
  { words: ["feijão", "feijao", "grão", "grao", "ervilha", "ervilhas"], value: { category: "Leguminosa", storage: "Despensa", days: 365, note: "Se for enlatado/frasco fechado, validade longa; depois de aberto, guardar no frigorífico e usar em 2-3 dias." } },
  { words: ["arroz", "massa", "couscous", "aveia", "farinha"], value: { category: "Cereal/hidrato", storage: "Despensa", days: 365, note: "Guardar seco e bem fechado." } },
  { words: ["ovo", "ovos"], value: { category: "Ovos", storage: "Frigorífico", days: 21, note: "Servir sempre bem cozinhado." } },
  { words: ["pescada", "salmão", "salmao", "bacalhau"], value: { category: "Peixe", storage: "Frigorífico", days: 1, note: "Peixe fresco deve ser usado rapidamente; congelar se não for usado no dia seguinte." } },
  { words: ["bebida vegetal", "leite vegetal"], value: { category: "Alternativa vegetal", storage: "Despensa", days: 180, note: "Fechado dura bastante; depois de aberto, seguir embalagem e guardar no frigorífico." } }
];

export function normalizeUnit(value: string) {
  const unit = value.trim();
  if (unit === "l" || unit === "lt") return "L";
  if (unit === "gr") return "g";
  if (unit === "uni" || unit === "unid") return "un";
  if (["embalagem", "embalagens", "lata", "latas", "molho", "molhos"].includes(unit)) return "un";
  return unit || "un";
}

export function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function estimateIngredient(input: string): InventoryEstimate {
  const name = input.toLowerCase();
  const match = estimates.find((item) => item.words.some((word) => name.includes(word)));
  return match?.value ?? {
    category: "Outro",
    storage: "Despensa",
    days: 14,
    note: "Estimativa genérica automática; confirmar validade real pela embalagem/aspecto."
  };
}

export function buildInventoryEntry(
  ingredientName: string,
  quantity: number,
  unit: string,
  categoryInput = "",
  expiryInput = "",
  storageInput = "",
  notesInput = "",
  source = "App web"
): InventoryEntryInput {
  const estimate = estimateIngredient(ingredientName);
  const category = categoryInput || estimate.category;
  const storageLocation = storageInput || estimate.storage;
  const notes = notesInput ? `${notesInput} | ${estimate.note}` : estimate.note;
  const expiryDate = expiryInput || addDays(estimate.days);

  return {
    ingredient_name: ingredientName,
    quantity_initial: quantity,
    quantity_remaining: quantity,
    unit: normalizeUnit(unit),
    category,
    source,
    expiry_date: expiryDate,
    storage_location: storageLocation,
    status: getPersistedInventoryStatus(quantity, expiryDate),
    notes
  };
}
