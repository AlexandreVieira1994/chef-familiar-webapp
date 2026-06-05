import { Card } from "@/components/card";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Recipe = {
  id: string;
  code: string;
  name: string;
  category: string;
  status: string;
  cost_level: string | null;
};

async function loadRecipes(): Promise<Recipe[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("recipes").select("id, code, name, category, status, cost_level").order("code");
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
              <tr><th className="py-2 pr-4">ID</th><th className="py-2 pr-4">Receita</th><th className="py-2 pr-4">Tipo</th><th className="py-2 pr-4">Estado</th><th className="py-2 pr-4">Custo</th></tr>
            </thead>
            <tbody>
              {recipes.map((recipe) => (
                <tr key={recipe.id} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-mono text-xs">{recipe.code}</td>
                  <td className="py-3 pr-4 font-medium">{recipe.name}</td>
                  <td className="py-3 pr-4">{recipe.category}</td>
                  <td className="py-3 pr-4">{recipe.status}</td>
                  <td className="py-3 pr-4">{recipe.cost_level ?? "-"}</td>
                </tr>
              ))}
              {recipes.length === 0 && (
                <tr><td className="py-4 text-neutral-500" colSpan={5}>Sem receitas carregadas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
