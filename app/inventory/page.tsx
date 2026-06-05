import { Card } from "@/components/card";
import { supabase } from "@/lib/supabase";

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
