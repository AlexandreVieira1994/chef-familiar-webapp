export type AutomaticInventoryStatus = "disponivel" | "expirado" | "sem_stock" | "removido";

type InventoryStatusInput = {
  expiry_date: string | null;
  quantity_remaining: number | null;
  status?: string | null;
};

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function isExpired(expiryDate: string | null, today = todayIsoDate()) {
  return Boolean(expiryDate && expiryDate < today);
}

export function getAutomaticInventoryStatus(entry: InventoryStatusInput): AutomaticInventoryStatus {
  if (entry.status === "removido") return "removido";
  if (Number(entry.quantity_remaining ?? 0) <= 0) return "sem_stock";
  if (isExpired(entry.expiry_date)) return "expirado";
  return "disponivel";
}

export function isInventoryEntryUsable(entry: InventoryStatusInput) {
  return getAutomaticInventoryStatus(entry) === "disponivel";
}

export function getPersistedInventoryStatus(quantityRemaining: number, expiryDate: string | null) {
  return isExpired(expiryDate) && quantityRemaining > 0 ? "expirado" : "disponivel";
}

export function inventoryStatusLabel(status: AutomaticInventoryStatus) {
  if (status === "disponivel") return "Disponível";
  if (status === "expirado") return "Expirado";
  if (status === "sem_stock") return "Sem stock";
  return "Removido";
}
