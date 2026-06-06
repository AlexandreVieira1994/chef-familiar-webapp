import { Card } from "@/components/card";
import { getSupabase } from "@/lib/supabase";
import { markShoppingItemPurchased, undoShoppingItemPurchased } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ShoppingList = {
  id: string;
  created_at: string;
  status: string;
};

type ShoppingItem = {
  id: string;
  ingredient_name: string;
  planned_quantity: number | null;
  planned_unit: string | null;
  category: string | null;
  purchased_status: string;
  purchased_quantity: number | null;
  notes: string | null;
};

function defaultUnit(unit: string | null) {
  return unit?.trim() || "un";
}

function unitOptions(unit: string | null) {
  const options = ["g", "kg", "ml", "L", "un"];
  const value = defaultUnit(unit);
  return options.includes(value) ? options : [value, ...options];
}

function statusLabel(status: string) {
  if (status === "comprado") return "Comprado";
  if (status === "nao_comprado") return "Não comprado";
  return status;
}

async function loadLatestShoppingList(): Promise<{ list: ShoppingList | null; items: ShoppingItem[] }> {
  const supabase = getSupabase();
  if (!supabase) return { list: null, items: [] };

  const { data: list } = await supabase
    .from("shopping_lists")
    .select("id, created_at, status")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!list) return { list: null, items: [] };

  const { data: items } = await supabase
    .from("shopping_list_items")
    .select("id, ingredient_name, planned_quantity, planned_unit, category, purchased_status, purchased_quantity, notes")
    .eq("shopping_list_id", list.id)
    .order("ingredient_name", { ascending: true });

  return { list, items: items ?? [] };
}

export default async function ShoppingPage() {
  const { list, items } = await loadLatestShoppingList();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Lista de Compras</h1>
        <p className="mt-2 text-neutral-600">Lista gerada a partir das receitas escolhidas e ajustada ao inventário.</p>
      </div>
      <Card title="Lista ativa">
        {list && (
          <p className="mb-4 text-sm text-neutral-500">
            Criada em {new Date(list.created_at).toLocaleString("pt-PT")} · Estado: {list.status}
          </p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-neutral-500">
              <tr>
                <th className="py-2 pr-4">Ingrediente</th>
                <th className="py-2 pr-4">Quantidade a comprar</th>
                <th className="py-2 pr-4">Categoria</th>
                <th className="py-2 pr-4">Estado</th>
                <th className="py-2 pr-4">Notas</th>
                <th className="py-2 pr-4">Ação</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b last:border-0 align-top">
                  <td className="py-3 pr-4 font-medium">{item.ingredient_name}</td>
                  <td className="py-3 pr-4">{item.planned_quantity ?? "-"} {item.planned_unit ?? ""}</td>
                  <td className="py-3 pr-4">{item.category ?? "-"}</td>
                  <td className="py-3 pr-4">
                    {statusLabel(item.purchased_status)}
                    {item.purchased_status === "comprado" && item.purchased_quantity !== null && (
                      <span className="block text-xs text-neutral-500">Comprado: {item.purchased_quantity}</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">{item.notes ?? "-"}</td>
                  <td className="py-3 pr-4 min-w-[360px]">
                    {item.purchased_status === "comprado" ? (
                      <form action={undoShoppingItemPurchased} className="flex items-center gap-2">
                        <span className="rounded-lg bg-neutral-100 px-3 py-2 text-xs text-neutral-600">No inventário</span>
                        <input type="hidden" name="item_id" value={item.id} />
                        <button className="rounded-lg border px-3 py-2 text-xs font-medium" type="submit">
                          Desfazer
                        </button>
                      </form>
                    ) : (
                      <form action={markShoppingItemPurchased} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="item_id" value={item.id} />
                        <input
                          name="purchased_quantity"
                          className="w-24 rounded-lg border px-2 py-2 text-xs"
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={item.planned_quantity ?? undefined}
                          aria-label="Quantidade comprada"
                        />
                        <select
                          name="purchased_unit"
                          className="rounded-lg border px-2 py-2 text-xs"
                          defaultValue={defaultUnit(item.planned_unit)}
                          aria-label="Unidade comprada"
                        >
                          {unitOptions(item.planned_unit).map((unit) => (
                            <option key={unit} value={unit}>{unit}</option>
                          ))}
                        </select>
                        <button className="rounded-lg bg-black px-3 py-2 text-xs font-medium text-white" type="submit">
                          Marcar comprado
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
              {!list && (
                <tr><td className="py-4 text-neutral-500" colSpan={6}>Ainda não existe lista de compras.</td></tr>
              )}
              {list && items.length === 0 && (
                <tr><td className="py-4 text-neutral-500" colSpan={6}>Nada a comprar. O inventário cobre as receitas selecionadas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
