import { Card } from "@/components/card";
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

function summarizeQuantities(entries: InventoryEntry[]) {
  const totals = new Map<string, number>();

  for (const entry of entries) {
    if (entry.status !== "disponivel" || Number(entry.quantity_remaining) <= 0) continue;
    totals.set(entry.unit, (totals.get(entry.unit) ?? 0) + Number(entry.quantity_remaining ?? 0));
  }

  if (totals.size === 0) return "Sem stock disponível";

  return Array.from(totals.entries())
    .map(([unit, quantity]) => `${quantity} ${unit}`)
    .join(" + ");
}

function earliestExpiry(entries: InventoryEntry[]) {
  const datedEntries = entries
    .filter((entry) => entry.expiry_date)
    .sort((a, b) => String(a.expiry_date).localeCompare(String(b.expiry_date)));

  return datedEntries[0]?.expiry_date ?? "Sem validade";
}

function formatInitialQuantity(entry: InventoryEntry) {
  return `${entry.quantity_initial} ${entry.unit}`;
}

export default async function InventoryPage() {
  const allEntries = await loadInventory();
  const entries = allEntries.filter((entry) => entry.status !== "removido");
  const groups = groupByIngredient(entries);
  const availableEntries = entries.filter((entry) => entry.status === "disponivel" && Number(entry.quantity_remaining) > 0);
  const lowOrEmptyEntries = entries.filter((entry) => Number(entry.quantity_remaining) <= 0 || entry.status !== "disponivel");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inventário</h1>
        <p className="mt-2 text-neutral-600">Ingredientes agrupados por nome, com cada entrada/lote separado para controlar validade e quantidade.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Ingredientes">
          <p className="text-2xl font-bold">{groups.length}</p>
          <p className="text-sm text-neutral-600">Ingredientes diferentes registados.</p>
        </Card>
        <Card title="Entradas disponíveis">
          <p className="text-2xl font-bold">{availableEntries.length}</p>
          <p className="text-sm text-neutral-600">Lotes prontos a usar nas listas e planeamento.</p>
        </Card>
        <Card title="Sem stock ou inativas">
          <p className="text-2xl font-bold">{lowOrEmptyEntries.length}</p>
          <p className="text-sm text-neutral-600">Entradas a rever, arquivar ou remover.</p>
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
            <span className="font-medium">Validade aproximada</span>
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
          {groups.map((group) => (
            <details key={normalizeIngredientName(group.name)} className="rounded-lg border bg-white" data-testid="inventory-ingredient-group" open>
              <summary className="grid cursor-pointer gap-2 px-4 py-3 text-sm md:grid-cols-[1fr_180px_160px_120px]" data-testid="inventory-ingredient-summary">
                <span className="font-semibold">{group.name}</span>
                <span className="text-neutral-600">{summarizeQuantities(group.entries)}</span>
                <span className="text-neutral-600">Validade: {earliestExpiry(group.entries)}</span>
                <span className="text-neutral-500">{group.entries.length} entrada(s)</span>
              </summary>
              <div className="overflow-x-auto border-t">
                <table className="w-full min-w-[1180px] text-left text-sm">
                  <thead className="border-b bg-neutral-50 text-neutral-500">
                    <tr>
                      <th className="py-2 pl-4 pr-3">Entrada</th>
                      <th className="py-2 pr-3">Inicial</th>
                      <th className="py-2 pr-3">Restante</th>
                      <th className="py-2 pr-3">Unidade</th>
                      <th className="py-2 pr-3">Categoria</th>
                      <th className="py-2 pr-3">Validade</th>
                      <th className="py-2 pr-3">Local</th>
                      <th className="py-2 pr-3">Estado</th>
                      <th className="py-2 pr-3">Notas</th>
                      <th className="py-2 pr-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.entries.map((entry, index) => (
                      <tr key={entry.id} className="border-b last:border-0 align-top" data-testid="inventory-entry-row">
                        <td className="py-3 pl-4 pr-3">
                          <form id={`update-inventory-${entry.id}`} action={updateInventoryEntry} className="contents" data-testid="inventory-entry-update-form">
                            <input type="hidden" name="entry_id" value={entry.id} />
                            <input name="ingredient_name" className="w-40 rounded-lg border px-2 py-2 font-medium" defaultValue={entry.ingredient_name} required />
                          </form>
                          <p className="mt-1 text-xs text-neutral-500">Lote {index + 1}</p>
                        </td>
                        <td className="py-3 pr-3 text-neutral-500">{formatInitialQuantity(entry)}</td>
                        <td className="py-3 pr-3">
                          <input form={`update-inventory-${entry.id}`} name="quantity_remaining" type="number" step="0.01" min="0" className="w-24 rounded-lg border px-2 py-2" defaultValue={entry.quantity_remaining} required />
                        </td>
                        <td className="py-3 pr-3">
                          <input form={`update-inventory-${entry.id}`} name="unit" className="w-20 rounded-lg border px-2 py-2" defaultValue={entry.unit} required />
                        </td>
                        <td className="py-3 pr-3">
                          <input form={`update-inventory-${entry.id}`} name="category" className="w-32 rounded-lg border px-2 py-2" defaultValue={entry.category ?? ""} />
                        </td>
                        <td className="py-3 pr-3">
                          <input form={`update-inventory-${entry.id}`} name="expiry_date" type="date" className="w-36 rounded-lg border px-2 py-2" defaultValue={entry.expiry_date ?? ""} />
                        </td>
                        <td className="py-3 pr-3">
                          <input form={`update-inventory-${entry.id}`} name="storage_location" className="w-32 rounded-lg border px-2 py-2" defaultValue={entry.storage_location ?? ""} />
                        </td>
                        <td className="py-3 pr-3">
                          <select form={`update-inventory-${entry.id}`} name="status" className="w-32 rounded-lg border px-2 py-2" defaultValue={entry.status ?? "disponivel"}>
                            <option value="disponivel">Disponível</option>
                            <option value="baixo_stock">Baixo stock</option>
                            <option value="usado">Usado</option>
                            <option value="expirado">Expirado</option>
                            <option value="removido">Removido</option>
                          </select>
                        </td>
                        <td className="py-3 pr-3">
                          <input form={`update-inventory-${entry.id}`} name="notes" className="w-52 rounded-lg border px-2 py-2" defaultValue={entry.notes ?? ""} />
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex gap-2">
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ))}
          {groups.length === 0 && (
            <p className="py-4 text-sm text-neutral-500">Sem entradas de inventário.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
