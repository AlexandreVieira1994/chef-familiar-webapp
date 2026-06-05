import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/card";
import { supabase } from "@/lib/supabase";
import { updateRecipeStatusForm } from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type HistoryItem = { status: string; notes: string | null; created_at: string };
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
  feedback_notes: string | null;
  feedback_history: HistoryItem[] | null;
};
type Ingredient = { id: string; ingredient_name: string; quantity: number | null; unit: string | null; category: string | null; blw_notes: string | null };

async function loadRecipe(code: string): Promise<{ recipe: Recipe; ingredients: Ingredient[] } | null> {
  if (!supabase) return null;
  const { data: recipe } = await supabase
    .from("recipes")
    .select("id, code, name, category, status, prep_time_min, cook_time_min, cost_level, blw_summary, separation_moment, notes, feedback_notes, feedback_history")
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
  const history = Array.isArray(recipe.feedback_history) ? recipe.feedback_history : [];
  const totalTime = (recipe.prep_time_min ?? 0) + (recipe.cook_time_min ?? 0);

  return (
    <div className="space-y-6">
      <Link href="/recipes" className="text-sm text-neutral-600 hover:text-neutral-900">← Voltar às receitas</Link>
      <div>
        <p className="font-mono text-sm text-neutral-500">{recipe.code}</p>
        <h1 className="text-3xl font-bold">{recipe.name}</h1>
        <p className="mt-2 text-neutral-600">{recipe.category} · {recipe.status} · {totalTime || "-"} min · custo {recipe.cost_level ?? "-"}</p>
      </div>

      <Card title="Avaliar receita">
        <form action={updateRecipeStatusForm} className="grid gap-3 md:grid-cols-4">
          <input type="hidden" name="recipe_id" value={recipe.id} />
          <input type="hidden" name="recipe_code" value={recipe.code} />
          <input type="hidden" name="return_to" value={`/recipes/${recipe.code}`} />
          <select name="status" className="rounded-lg border px-3 py-2 text-sm" defaultValue={recipe.status}>
            <option value="por_testar">Por testar</option>
            <option value="aprovada">Aprovada</option>
            <option value="neutra">Neutra</option>
            <option value="a_melhorar">A melhorar</option>
            <option value="rejeitada">Rejeitada</option>
          </select>
          <input name="notes" className="rounded-lg border px-3 py-2 text-sm md:col-span-2" placeholder="Notas" />
          <button className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white" type="submit">Guardar</button>
        </form>
        <p className="mt-3 rounded-lg bg-neutral-50 p-3 text-sm"><strong>Estado atual:</strong> {recipe.status}</p>
        <p className="mt-2 rounded-lg bg-neutral-50 p-3 text-sm"><strong>Última nota:</strong> {recipe.feedback_notes || "Sem nota guardada."}</p>
      </Card>

      <Card title="Histórico de feedback">
        <div className="space-y-2 text-sm">
          {history.map((item, index) => (
            <div key={`${item.created_at}-${index}`} className="rounded-lg border p-3">
              <div className="font-medium">{item.status} · {new Date(item.created_at).toLocaleString("pt-PT")}</div>
              <div className="text-neutral-600">{item.notes || "Sem nota."}</div>
            </div>
          ))}
          {history.length === 0 && <p className="text-neutral-500">Sem histórico de feedback.</p>}
        </div>
      </Card>

      <Card title="Ingredientes">
        <table className="w-full text-left text-sm">
          <tbody>{ingredients.map((i) => <tr key={i.id} className="border-b"><td className="py-2 font-medium">{i.ingredient_name}</td><td>{i.quantity ?? "-"} {i.unit ?? ""}</td><td>{i.blw_notes ?? "-"}</td></tr>)}</tbody>
        </table>
      </Card>

      <Card title="Adaptação BLW"><p className="text-sm text-neutral-700">{recipe.blw_summary ?? "Sem notas BLW."}</p></Card>
      <Card title="Momento de separação"><p className="text-sm text-neutral-700">{recipe.separation_moment ?? "Separar porção da bebé antes de sal/temperos fortes."}</p></Card>
      <Card title="Notas da receita"><p className="text-sm text-neutral-700">{recipe.notes ?? "Sem notas."}</p></Card>
    </div>
  );
}
