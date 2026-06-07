import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/card";
import { stableImageUrl } from "@/lib/image-url";
import { recipeStatusLabel } from "@/lib/recipe-status";
import { getSupabase } from "@/lib/supabase";
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
  notes: string | null;
  feedback_notes: string | null;
  feedback_history: HistoryItem[] | null;
  image_url: string | null;
};
type Ingredient = { id: string; ingredient_name: string; quantity: number | null; unit: string | null; category: string | null; image_url: string | null };

function preparationSteps(notes: string | null) {
  if (!notes) return [];
  return notes
    .split(/\r?\n/)
    .map((line) => line.replace(/^\d+[\).\s-]*/, "").trim())
    .filter(Boolean);
}

async function loadRecipe(code: string): Promise<{ recipe: Recipe; ingredients: Ingredient[] } | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data: recipe } = await supabase
    .from("recipes")
    .select("id, code, name, category, status, prep_time_min, cook_time_min, cost_level, notes, feedback_notes, feedback_history, image_url")
    .eq("code", code)
    .single();
  if (!recipe) return null;
  const { data: ingredients } = await supabase
    .from("recipe_ingredients")
    .select("id, ingredient_name, quantity, unit, category, image_url")
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
  const steps = preparationSteps(recipe.notes);
  const recipeImageUrl = stableImageUrl(recipe.image_url, recipe.code, "recipe");

  return (
    <div className="space-y-6">
      <Link href="/recipes" className="text-sm text-neutral-600 hover:text-neutral-900">Ã¢â€ Â Voltar ÃƒÂ s receitas</Link>
      <div>
        <p className="font-mono text-sm text-neutral-500">{recipe.code}</p>
        <h1 className="text-3xl font-bold">{recipe.name}</h1>
        <p className="mt-2 text-neutral-600">{recipe.category} Ã‚Â· {recipeStatusLabel(recipe.status)} Ã‚Â· {totalTime || "-"} min Ã‚Â· custo {recipe.cost_level ?? "-"}</p>
      </div>

      {recipeImageUrl && (
        <img
          src={recipeImageUrl}
          alt={recipe.name}
          className="h-72 w-full rounded-lg object-cover"
          loading="eager"
        />
      )}

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
        <p className="mt-3 rounded-lg bg-neutral-50 p-3 text-sm"><strong>Estado atual:</strong> {recipeStatusLabel(recipe.status)}</p>
        <p className="mt-2 rounded-lg bg-neutral-50 p-3 text-sm"><strong>ÃƒÅ¡ltima nota:</strong> {recipe.feedback_notes || "Sem nota guardada."}</p>
      </Card>

      <Card title="HistÃƒÂ³rico de feedback">
        <div className="space-y-2 text-sm">
          {history.map((item, index) => (
            <div key={`${item.created_at}-${index}`} className="rounded-lg border p-3">
              <div className="font-medium">{recipeStatusLabel(item.status)} Ã‚Â· {new Date(item.created_at).toLocaleString("pt-PT")}</div>
              <div className="text-neutral-600">{item.notes || "Sem nota."}</div>
            </div>
          ))}
          {history.length === 0 && <p className="text-neutral-500">Sem histÃƒÂ³rico de feedback.</p>}
        </div>
      </Card>

      <Card title="Ingredientes">
        <table className="w-full text-left text-sm">
          <tbody>
            {ingredients.map((i) => {
              const imageUrl = stableImageUrl(i.image_url, i.ingredient_name, "ingredient");

              return (
              <tr key={i.id} className="border-b align-middle">
                <td className="py-2 pr-3">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={i.ingredient_name}
                      className="h-12 w-16 rounded-lg object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-12 w-16 rounded-lg bg-neutral-100" aria-hidden="true" />
                  )}
                </td>
                <td className="py-2 font-medium">{i.ingredient_name}</td>
                <td>{i.quantity ?? "-"} {i.unit ?? ""}</td>
                <td>{i.category ?? "-"}</td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </Card>

      <Card title="Como fazer">
        {steps.length > 0 ? (
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-neutral-700">
            {steps.map((step, index) => <li key={`${index}-${step}`}>{step}</li>)}
          </ol>
        ) : (
          <p className="text-sm text-neutral-700">Sem passos guardados. Usa os ingredientes para preparar uma versao simples.</p>
        )}
      </Card>

      <Card title="Notas da receita"><p className="text-sm text-neutral-700">{recipe.notes ?? "Sem notas."}</p></Card>
    </div>
  );
}
