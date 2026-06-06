import { Card } from "@/components/card";
import {
  getAutomaticInventoryStatus,
  inventoryStatusLabel,
  isInventoryEntryUsable
} from "@/lib/inventory-status";
import { getSupabase } from "@/lib/supabase";
import { addInventoryEntry, addInventoryFromText, deleteInventoryEntry, updateInventoryEntry } from "./actions";

type InventoryEntry = {
  id: string;
  ingredient_name: string;
  quantity_initial: number;
  quantity_remaining: number;
  unit: string;
  category: string | null;
  expiry_date: string | null;
  storage_location: string | null;
  status: string | null;
  notes: string | null;
};

type IngredientGroup = {
  name: string;
  entries: InventoryEntry[];
};

async function loadInventory(): Promise<InventoryEntry[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("inventory_entries")
    .select("id, ingredient_name, quantity_initial, quantity_remaining, unit, category, expiry_date, storage_location, status, notes")
    .order("ingredient_name", { ascending: true })
    .order("expiry_date", { ascending: true });
  return data ?? [];
}

function normalizeIngredientName(name: string) {
  return name.trim().toLowerCase();
}

function groupByIngredient(entries: InventoryEntry[]): IngredientGroup[] {
  const groups = new Map<string, IngredientGroup>();

  for (const entry of entries) {
    const key = normalizeIngredientName(entry.ingredient_name);
    const group = groups.get(key);

    if (group) {
      group.entries.push(entry);
    } else {
      groups.set(key, { name: entry.ingredient_name, entries: [entry] });
    }
  }

  return Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name, "pt"));
}

function formatQuantity(quantity: number, unit: string) {
  return `${quantity} ${unit}`;
}

function formatDate(date: string | null) {
  if (!date) return "Sem validade";
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-PT");
}

function usableEntries(entries: InventoryEntry[]) {
  return entries.filter(isInventoryEntryUsable);
}

function expiredEntries(entries: InventoryEntry[]) {
  return entries.filter((entry) => getAutomaticInventoryStatus(entry) === "expirado");
}

function summarizeQuantities(entries: InventoryEntry[]) {
  const totals = new Map<string, number>();

  for (const entry of usableEntries(entries)) {
    totals.set(entry.unit, (totals.get(entry.unit) ?? 0) + Number(entry.quantity_remaining ?? 0));
  }

  if (totals.size === 0) return "Sem stock disponível";

  return Array.from(totals.entries())
    .map(([unit, quantity]) => `${quantity} ${unit}`)
    .join(" + ");
}

function earliestExpiry(entries: InventoryEntry[]) {
  const datedEntries = usableEntries(entries)
    .filter((entry) => entry.expiry_date)
    .sort((a, b) => String(a.expiry_date).localeCompare(String(b.expiry_date)));

  return datedEntries[0]?.expiry_date ?? null;
}

function groupStatus(entries: InventoryEntry[]) {
  if (usableEntries(entries).length > 0) return "disponivel";
  if (expiredEntries(entries).length > 0) return "expirado";
  return "sem_stock";
}

function statusBadgeClass(status: ReturnType<typeof getAutomaticInventoryStatus>) {
  if (status === "disponivel") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "expirado") return "border-red-200 bg-red-50 text-red-800";
  if (status === "sem_stock") return "border-neutral-200 bg-neutral-100 text-neutral-700";
  return "border-neutral-200 bg-neutral-50 text-neutral-500";
}

export default async function InventoryPage() {
  const allEntries = await loadInventory();
  const entries = allEntries.filter((entry) => entry.status !== "removido");
  const groups = groupByIngredient(entries);
  const availableEntries = entries.filter(isInventoryEntryUsable);
  const expiredCount = entries.filter((entry) => getAutomaticInventoryStatus(entry) === "expirado").length;
  const emptyCount = entries.filter((entry) => getAutomaticInventoryStatus(entry) === "sem_stock").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inventário</h1>
        <p className="mt-2 text-neutral-600">
          Ingredientes agrupados por nome. Abre um ingrediente para rever os lotes, quantidades e validades.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Ingredientes">
          <p className="text-2xl font-bold">{groups.length}</p>
          <p className="text-sm text-neutral-600">Ingredientes diferentes registados.</p>
        </Card>
        <Card title="Lotes disponíveis">
          <p className="text-2xl font-bold">{availableEntries.length}</p>
          <p className="text-sm text-neutral-600">Com stock e dentro da validade.</p>
        </Card>
        <Card title="A rever">
          <p className="text-2xl font-bold">{expiredCount + emptyCount}</p>
          <p className="text-sm text-neutral-600">{expiredCount} expirado(s), {emptyCount} sem stock.</p>
        </Card>
      </div>

      <Card title="Adicionar por texto">
        <form action={addInventoryFromText} className="space-y-3">
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Texto de compra</span>
            <textarea
              name="inventory_text"
              className="min-h-28 w-full rounded-lg border px-3 py-2"
              placeholder="Ex: Comprei 1 kg batata, 6 ovos, 500 g brócolos e 2 latas de grão"
              required
            />
          </label>
          <p className="text-xs text-neutral-500">Formato recomendado: quantidade + unidade + ingrediente, separados por vírgulas.</p>
          <button className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white" type="submit">
            Adicionar vários ingredientes
          </button>
        </form>
      </Card>

      <Card title="Adicionar entrada manual">
        <form action={addInventoryEntry} className="grid gap-4 md:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Ingrediente *</span>
            <input name="ingredient_name" className="w-full rounded-lg border px-3 py-2" placeholder="Ex: Cenoura" required />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Quantidade *</span>
            <input name="quantity_initial" type="number" step="0.01" min="0" className="w-full rounded-lg border px-3 py-2" placeholder="Ex: 500" required />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Unidade *</span>
            <input name="unit" className="w-full rounded-lg border px-3 py-2" placeholder="g, kg, un, L" required />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Categoria</span>
            <input name="category" className="w-full rounded-lg border px-3 py-2" placeholder="Legume, fruta, leguminosa..." />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Validade</span>
            <input name="expiry_date" type="date" className="w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Local</span>
            <input name="storage_location" className="w-full rounded-lg border px-3 py-2" placeholder="Frigorífico, despensa..." />
          </label>
          <label className="space-y-1 text-sm md:col-span-3">
            <span className="font-medium">Notas</span>
            <input name="notes" className="w-full rounded-lg border px-3 py-2" placeholder="Ex: comprado no Continente, biológico, aberto..." />
          </label>
          <button className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white md:col-span-3" type="submit">
            Adicionar ao inventário
          </button>
        </form>
      </Card>

      <Card title="Inventário atual">
        <div className="space-y-3">
          {groups.map((group) => {
            const currentGroupStatus = groupStatus(group.entries);
            const currentExpiry = earliestExpiry(group.entries);

            return (
              <details key={normalizeIngredientName(group.name)} className="group rounded-lg border bg-white" data-testid="inventory-ingredient-group">
                <summary className="grid cursor-pointer list-none gap-2 px-4 py-3 text-sm md:grid-cols-[1fr_180px_160px_130px_28px]" data-testid="inventory-ingredient-summary">
                  <span className="font-semibold">{group.name}</span>
                  <span className="text-neutral-700">{summarizeQuantities(group.entries)}</span>
                  <span className="text-neutral-600">Validade: {formatDate(currentExpiry)}</span>
                  <span className={`w-fit rounded-full border px-2 py-1 text-xs font-medium ${statusBadgeClass(currentGroupStatus)}`}>
                    {inventoryStatusLabel(currentGroupStatus)}
                  </span>
                  <span className="text-right text-neutral-400 transition group-open:rotate-90" aria-hidden="true">›</span>
                  <span className="text-xs text-neutral-500 md:col-span-5">
                    {group.entries.length} lote(s), {expiredEntries(group.entries).length} expirado(s)
                  </span>
                </summary>

                <div className="hidden gap-3 border-t bg-neutral-50 p-3 group-open:grid lg:grid-cols-2">
                  {group.entries.map((entry, index) => {
                    const entryStatus = getAutomaticInventoryStatus(entry);

                    return (
                      <article key={entry.id} className="rounded-lg border bg-white p-4 shadow-sm" data-testid="inventory-entry-row">
                        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">Lote {index + 1}</p>
                            <p className="text-xs text-neutral-500">
                              Inicial: {formatQuantity(entry.quantity_initial, entry.unit)} · Validade: {formatDate(entry.expiry_date)}
                            </p>
                          </div>
                          <span className={`rounded-full border px-2 py-1 text-xs font-medium ${statusBadgeClass(entryStatus)}`}>
                            {inventoryStatusLabel(entryStatus)}
                          </span>
                        </div>

                        <form id={`update-inventory-${entry.id}`} action={updateInventoryEntry} className="grid gap-3 sm:grid-cols-2" data-testid="inventory-entry-update-form">
                          <input type="hidden" name="entry_id" value={entry.id} />
                          <label className="space-y-1 text-xs font-medium text-neutral-600 sm:col-span-2">
                            Ingrediente
                            <input name="ingredient_name" className="w-full rounded-lg border px-3 py-2 text-sm font-medium text-neutral-900" defaultValue={entry.ingredient_name} required />
                          </label>
                          <label className="space-y-1 text-xs font-medium text-neutral-600">
                            Restante
                            <input name="quantity_remaining" type="number" step="0.01" min="0" className="w-full rounded-lg border px-3 py-2 text-sm text-neutral-900" defaultValue={entry.quantity_remaining} required />
                          </label>
                          <label className="space-y-1 text-xs font-medium text-neutral-600">
                            Unidade
                            <input name="unit" className="w-full rounded-lg border px-3 py-2 text-sm text-neutral-900" defaultValue={entry.unit} required />
                          </label>
                          <label className="space-y-1 text-xs font-medium text-neutral-600">
                            Categoria
                            <input name="category" className="w-full rounded-lg border px-3 py-2 text-sm text-neutral-900" defaultValue={entry.category ?? ""} />
                          </label>
                          <label className="space-y-1 text-xs font-medium text-neutral-600">
                            Validade
                            <input name="expiry_date" type="date" className="w-full rounded-lg border px-3 py-2 text-sm text-neutral-900" defaultValue={entry.expiry_date ?? ""} />
                          </label>
                          <label className="space-y-1 text-xs font-medium text-neutral-600 sm:col-span-2">
                            Local
                            <input name="storage_location" className="w-full rounded-lg border px-3 py-2 text-sm text-neutral-900" defaultValue={entry.storage_location ?? ""} />
                          </label>
                          <label className="space-y-1 text-xs font-medium text-neutral-600 sm:col-span-2">
                            Notas
                            <input name="notes" className="w-full rounded-lg border px-3 py-2 text-sm text-neutral-900" defaultValue={entry.notes ?? ""} />
                          </label>
                        </form>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <button form={`update-inventory-${entry.id}`} className="rounded-lg bg-black px-3 py-2 text-xs font-medium text-white" data-testid="inventory-entry-save" type="submit">
                            Guardar
                          </button>
                          <form action={deleteInventoryEntry} data-testid="inventory-entry-delete-form">
                            <input type="hidden" name="entry_id" value={entry.id} />
                            <button className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700" data-testid="inventory-entry-remove" type="submit">
                              Remover
                            </button>
                          </form>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </details>
            );
          })}
          {groups.length === 0 && (
            <p className="py-4 text-sm text-neutral-500">Sem entradas de inventário.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
