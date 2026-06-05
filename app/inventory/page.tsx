import { Card } from "@/components/card";
import { supabase } from "@/lib/supabase";
import { addInventoryEntry } from "./actions";

type InventoryEntry = {
  id: string;
  ingredient_name: string;
  quantity_initial: number;
  quantity_remaining: number;
  unit: string;
  expiry_date: string | null;
  storage_location: string | null;
  status: string | null;
};

async function loadInventory(): Promise<InventoryEntry[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("inventory_entries")
    .select("id, ingredient_name, quantity_initial, quantity_remaining, unit, expiry_date, storage_location, status")
    .order("expiry_date", { ascending: true });
  return data ?? [];
}

export default async function InventoryPage() {
  const entries = await loadInventory();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inventário</h1>
        <p className="mt-2 text-neutral-600">Entradas de ingredientes, quantidades restantes, validade e local de armazenamento.</p>
      </div>
      <Card title="Adicionar entrada">
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
          <input type="hidden" name="source" value="App web" />
          <button className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white md:col-span-3" type="submit">
            Adicionar ao inventário
          </button>
        </form>
      </Card>
      <Card title="Regra principal">
        <p className="text-sm text-neutral-600">Cada compra/entrada deve criar uma linha nova. Não consolidar ingredientes repetidos.</p>
      </Card>
      <Card title="Inventário atual">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-neutral-500">
              <tr><th className="py-2 pr-4">Ingrediente</th><th className="py-2 pr-4">Restante</th><th className="py-2 pr-4">Validade</th><th className="py-2 pr-4">Local</th><th className="py-2 pr-4">Estado</th></tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-medium">{entry.ingredient_name}</td>
                  <td className="py-3 pr-4">{entry.quantity_remaining} {entry.unit}</td>
                  <td className="py-3 pr-4">{entry.expiry_date ?? "-"}</td>
                  <td className="py-3 pr-4">{entry.storage_location ?? "-"}</td>
                  <td className="py-3 pr-4">{entry.status ?? "-"}</td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr><td className="py-4 text-neutral-500" colSpan={5}>Sem entradas de inventário.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
