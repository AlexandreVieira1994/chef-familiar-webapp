import { Card } from "@/components/card";
import { RecipePickerForm } from "@/components/recipe-picker-form";
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
        <p className="mt-2 text-neutral-600">
          Escolhe receitas e gera uma lista de compras ajustada ao inventário.
        </p>
      </div>
      <Card title="Gerar lista de compras por receitas">
        <RecipePickerForm recipes={preferred} action={generateShoppingListFromRecipes} />
      </Card>
      <Card title="Como funciona">
        <p className="text-sm text-neutral-600">
          A app soma os ingredientes das receitas escolhidas, compara com o inventário quando o ingrediente e a unidade coincidem, e grava apenas o que falta comprar.
        </p>
      </Card>
    </div>
  );
}
