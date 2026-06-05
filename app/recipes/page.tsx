import Link from "next/link";
import { Card } from "@/components/card";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { updateRecipeStatusForm } from "./actions";

type Recipe = {
  id: string;
  code: string;
  name: string;
  category: string;
  status: string;
  cost_level: string | null;
  feedback_notes: string | null;
};

async function loadRecipes(): Promise<Recipe[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("recipes")
    .select("id, code, name, category, status, cost_level, feedback_notes")
    .order("code");
  return data ?? [];
}

export default async function RecipesPage() {
  const recipes = await loadRecipes();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Receitas</h1>
        <p className="mt-2 text-neutral-600">Base inicial de receitas familiares com adaptação BLW.</p>
      </div>
      {!isSupabaseConfigured() && (
        <Card title="Supabase ainda não configurada">
          <p className="text-sm text-neutral-600">Adiciona as variáveis da Supabase na Vercel para carregar dados reais.</p>
        </Card>
      )}
      <Card title="Receitas">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-neutral-500">
              <tr>
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Receita</th>
                <th className="py-2 pr-4">Tipo</th>
                <th className="py-2 pr-4">Custo</th>
                <th className="py-2 pr-4">Última nota</th>
                <th className="py-2 pr-4">Avaliação rápida</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map((recipe) => (
                <tr key={recipe.id} className="border-b last:border-0 hover:bg-neutral-50 align-top">
                  <td className="py-3 pr-4 font-mono text-xs">
                    <Link href={`/recipes/${recipe.code}`} className="underline-offset-2 hover:underline">{recipe.code}</Link>
                  </td>
                  <td className="py-3 pr-4 font-medium min-w-64">
                    <Link href={`/recipes/${recipe.code}`} className="underline-offset-2 hover:underline">{recipe.name}</Link>
                  </td>
                  <td className="py-3 pr-4">{recipe.category}</td>
                  <td className="py-3 pr-4">{recipe.cost_level ?? "-"}</td>
                  <td className="py-3 pr-4 max-w-64 text-neutral-600">{recipe.feedback_notes || "-"}</td>
                  <td className="py-3 pr-4 min-w-[420px]">
                    <form action={updateRecipeStatusForm} className="grid gap-2 md:grid-cols-[150px_1fr_auto]">
                      <input type="hidden" name="recipe_id" value={recipe.id} />
                      <input type="hidden" name="recipe_code" value={recipe.code} />
                      <select name="status" className="rounded-lg border px-2 py-2 text-sm" defaultValue={recipe.status}>
                        <option value="por_testar">Por testar</option>
                        <option value="aprovada">Aprovada</option>
                        <option value="neutra">Neutra</option>
                        <option value="a_melhorar">A melhorar</option>
                        <option value="rejeitada">Rejeitada</option>
                      </select>
                      <input name="notes" className="rounded-lg border px-2 py-2 text-sm" placeholder="Notas rápidas" />
                      <button className="rounded-lg bg-black px-3 py-2 text-sm font-medium text-white" type="submit">
                        Guardar
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {recipes.length === 0 && (
                <tr><td className="py-4 text-neutral-500" colSpan={6}>Sem receitas carregadas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
