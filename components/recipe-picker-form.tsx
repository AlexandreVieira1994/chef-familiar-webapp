"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { recipeStatusLabel } from "@/lib/recipe-status";

type Recipe = {
  id: string;
  code: string;
  name: string;
  status: string;
  category: string;
};

type RecipePickerFormProps = {
  recipes: Recipe[];
  action: (formData: FormData) => void | Promise<void>;
};

function SubmitButton({ canSubmit }: { canSubmit: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-600"
      type="submit"
      disabled={!canSubmit || pending}
    >
      {pending ? "A gerar..." : "Gerar lista de compras"}
    </button>
  );
}

export function RecipePickerForm({ recipes, action }: RecipePickerFormProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const canSubmit = selectedIds.length > 0;

  function toggleRecipe(recipeId: string, checked: boolean) {
    setSelectedIds((current) => {
      if (checked) return current.includes(recipeId) ? current : [...current, recipeId];
      return current.filter((id) => id !== recipeId);
    });
  }

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        {recipes.map((recipe) => (
          <label key={recipe.id} className="flex gap-3 rounded-lg border p-3 text-sm hover:bg-neutral-50">
            <input
              type="checkbox"
              name="recipe_id"
              value={recipe.id}
              checked={selected.has(recipe.id)}
              onChange={(event) => toggleRecipe(recipe.id, event.target.checked)}
              className="mt-1"
            />
            <span>
              <span className="block font-medium">{recipe.code} · {recipe.name}</span>
              <span className="text-neutral-500">{recipe.category} · {recipeStatusLabel(recipe.status)}</span>
            </span>
          </label>
        ))}
      </div>
      {recipes.length === 0 && <p className="text-sm text-neutral-500">Sem receitas disponíveis.</p>}
      {!canSubmit && recipes.length > 0 && (
        <p className="text-sm text-neutral-500">Seleciona pelo menos uma receita para gerar a lista.</p>
      )}
      <SubmitButton canSubmit={canSubmit} />
    </form>
  );
}
