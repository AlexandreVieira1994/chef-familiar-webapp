import { Card } from "@/components/card";
import { getSupabase } from "@/lib/supabase";
import { generateShoppingListFromRecipes } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Recipe = {
  id: string;
  code: string;
  name: string;
  status: string;
  category: string;
};

async function loadRecipes(): Promise<Recipe[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("recipes")
    .select("id, code, name, status, category")
    .order("status", { ascending: true })
    .order("code", { ascending: true });
  return data ?? [];
}

export default async function PlannerPage() {
  const recipes = await loadRecipes();
  const preferred = recipes.filter((recipe) => recipe.status !== "rejeitada");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Planeador</h1>
        <p className="mt-2 text-neutral-600">Escolhe receitas e gera uma lista de compras ajustada ao inventário.</p>
      </div>
      <Card title="Gerar lista de compras por receitas">
        <form action={generateShoppingListFromRecipes} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            {preferred.map((recipe) => (
              <label key={recipe.id} className="flex gap-3 rounded-lg border p-3 text-sm hover:bg-neutral-50">
                <input type="checkbox" name="recipe_id" value={recipe.id} className="mt-1" />
                <span>
                  <span className="block font-medium">{recipe.code} · {recipe.name}</span>
                  <span className="text-neutral-500">{recipe.category} · {recipe.status}</span>
                </span>
              </label>
            ))}
          </div>
          {preferred.length === 0 && <p className="text-sm text-neutral-500">Sem receitas disponíveis.</p>}
          <button className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white" type="submit">
            Gerar lista de compras
          </button>
        </form>
      </Card>
      <Card title="Como funciona">
        <p className="text-sm text-neutral-600">
          A app soma os ingredientes das receitas escolhidas, compara com o inventário quando o ingrediente e a unidade coincidem, e grava apenas o que falta comprar.
        </p>
      </Card>
    </div>
  );
}
