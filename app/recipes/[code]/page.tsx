import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/card";
import { supabase } from "@/lib/supabase";
import { updateRecipeStatus } from "../actions";

type Recipe = {
  id: string;
  code: string;
  name: string;
  category: string;
  status: string;
  prep_time_min: number | null;
  cook_time_min: number | null;
  cost_level: string | null;
  blw_summary: string | null;
  separation_moment: string | null;
  notes: string | null;
};

type Ingredient = {
  id: string;
  ingredient_name: string;
  quantity: number | null;
  unit: string | null;
  category: string | null;
  blw_notes: string | null;
};

async function loadRecipe(code: string): Promise<{ recipe: Recipe; ingredients: Ingredient[] } | null> {
  if (!supabase) return null;

  const { data: recipe } = await supabase
    .from("recipes")
    .select("id, code, name, category, status, prep_time_min, cook_time_min, cost_level, blw_summary, separation_moment, notes")
    .eq("code", code)
    .single();

  if (!recipe) return null;

  const { data: ingredients } = await supabase
    .from("recipe_ingredients")
    .select("id, ingredient_name, quantity, unit, category, blw_notes")
    .eq("recipe_id", recipe.id)
    .order("ingredient_name", { ascending: true });

  return { recipe, ingredients: ingredients ?? [] };
}

export default async function RecipeDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const result = await loadRecipe(code);

  if (!result) notFound();

  const { recipe, ingredients } = result;
  const totalTime = (recipe.prep_time_min ?? 0) + (recipe.cook_time_min ?? 0);

  return (
    <div className="space-y-6">
      <Link href="/recipes" className="text-sm text-neutral-600 hover:text-neutral-900">← Voltar às receitas</Link>
      <div>
        <p className="font-mono text-sm text-neutral-500">{recipe.code}</p>
        <h1 className="text-3xl font-bold">{recipe.name}</h1>
        <p className="mt-2 text-neutral-600">{recipe.category} · {recipe.status} · {totalTime || "-"} min · custo {recipe.cost_level ?? "-"}</p>
      </div>

      <Card title="Ingredientes">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-neutral-500">
              <tr><th className="py-2 pr-4">Ingrediente</th><th className="py-2 pr-4">Quantidade</th><th className="py-2 pr-4">Categoria</th><th className="py-2 pr-4">BLW</th></tr>
            </thead>
            <tbody>
              {ingredients.map((ingredient) => (
                <tr key={ingredient.id} className="border-b last:border-0 align-top">
                  <td className="py-3 pr-4 font-medium">{ingredient.ingredient_name}</td>
                  <td className="py-3 pr-4">{ingredient.quantity ?? "-"} {ingredient.unit ?? ""}</td>
                  <td className="py-3 pr-4">{ingredient.category ?? "-"}</td>
                  <td className="py-3 pr-4 text-neutral-600">{ingredient.blw_notes ?? "-"}</td>
                </tr>
              ))}
              {ingredients.length === 0 && (
                <tr><td className="py-4 text-neutral-500" colSpan={4}>Sem ingredientes carregados. Corre o seed de ingredientes.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Adaptação BLW">
          <p className="text-sm text-neutral-700">{recipe.blw_summary ?? "Sem notas BLW."}</p>
        </Card>
        <Card title="Momento de separação">
          <p className="text-sm text-neutral-700">{recipe.separation_moment ?? "Separar porção da bebé antes de sal/temperos fortes."}</p>
        </Card>
      </div>

      <Card title="Notas">
        <p className="text-sm text-neutral-700">{recipe.notes ?? "Sem notas."}</p>
      </Card>

      <Card title="Avaliar receita">
        <form action={updateRecipeStatus} className="grid gap-3 md:grid-cols-4">
          <input type="hidden" name="recipe_id" value={recipe.id} />
          <input type="hidden" name="recipe_code" value={recipe.code} />
          <label className="space-y-1 text-sm md:col-span-1">
            <span className="font-medium">Estado</span>
            <select name="status" className="w-full rounded-lg border px-3 py-2" defaultValue={recipe.status}>
              <option value="por_testar">Por testar</option>
              <option value="aprovada">Aprovada</option>
              <option value="neutra">Neutra</option>
              <option value="a_melhorar">A melhorar</option>
              <option value="rejeitada">Rejeitada</option>
            </select>
          </label>
          <label className="space-y-1 text-sm md:col-span-3">
            <span className="font-medium">Notas</span>
            <input name="notes" className="w-full rounded-lg border px-3 py-2" placeholder="Ex: aprovada, mas reduzir tomate / bebé aceitou bem" />
          </label>
          <button className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white md:col-span-4" type="submit">
            Guardar avaliação
          </button>
        </form>
      </Card>
    </div>
  );
}
