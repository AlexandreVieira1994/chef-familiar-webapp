import { Card } from "@/components/card";
import { supabase } from "@/lib/supabase";

type ShoppingItem = {
  id: string;
  ingredient_name: string;
  planned_quantity: number | null;
  planned_unit: string | null;
  category: string | null;
  purchased_status: string;
  notes: string | null;
};

async function loadShoppingItems(): Promise<ShoppingItem[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("shopping_list_items")
    .select("id, ingredient_name, planned_quantity, planned_unit, category, purchased_status, notes")
    .order("ingredient_name", { ascending: true });
  return data ?? [];
}

export default async function ShoppingPage() {
  const items = await loadShoppingItems();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Lista de Compras</h1>
        <p className="mt-2 text-neutral-600">Lista gerada a partir do plano alimentar e ajustada ao inventário.</p>
      </div>
      <Card title="Compras">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-neutral-500">
              <tr><th className="py-2 pr-4">Ingrediente</th><th className="py-2 pr-4">Quantidade</th><th className="py-2 pr-4">Categoria</th><th className="py-2 pr-4">Estado</th><th className="py-2 pr-4">Notas</th></tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-medium">{item.ingredient_name}</td>
                  <td className="py-3 pr-4">{item.planned_quantity ?? "-"} {item.planned_unit ?? ""}</td>
                  <td className="py-3 pr-4">{item.category ?? "-"}</td>
                  <td className="py-3 pr-4">{item.purchased_status}</td>
                  <td className="py-3 pr-4">{item.notes ?? "-"}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td className="py-4 text-neutral-500" colSpan={5}>Sem lista de compras ativa.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
