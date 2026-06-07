"use client";

import { useActionState, useState } from "react";
import { updateRecipeStatus, type RecipeStatusState } from "@/app/recipes/actions";
import { recipeStatusLabel } from "@/lib/recipe-status";

const initialState: RecipeStatusState = { ok: false, message: "" };

export function RecipeFeedbackDropdown({
  recipeId,
  recipeCode,
  currentStatus
}: {
  recipeId: string;
  recipeCode: string;
  currentStatus: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateRecipeStatus, initialState);

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="min-w-36 rounded-lg border bg-white px-3 py-2 text-left text-sm hover:bg-neutral-50"
      >
        {recipeStatusLabel(currentStatus)} <span className="text-neutral-400">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border bg-white p-3 shadow-lg">
          <form action={formAction} className="space-y-3">
            <input type="hidden" name="recipe_id" value={recipeId} />
            <input type="hidden" name="recipe_code" value={recipeCode} />
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Estado</span>
              <select name="status" className="w-full rounded-lg border px-3 py-2" defaultValue={currentStatus}>
                <option value="por_testar">Por testar</option>
                <option value="aprovada">Aprovada</option>
                <option value="neutra">Neutra</option>
                <option value="a_melhorar">A melhorar</option>
                <option value="rejeitada">Rejeitada</option>
              </select>
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Notas</span>
              <textarea name="notes" className="min-h-20 w-full rounded-lg border px-3 py-2" placeholder="Ex: reduzir tomate; repetir formato" />
            </label>
            <div className="flex items-center justify-between gap-3">
              <button
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                type="submit"
                disabled={pending}
              >
                {pending ? "A guardar..." : "Guardar"}
              </button>
              {state.message && (
                <span className={state.ok ? "text-xs text-green-700" : "text-xs text-red-700"}>{state.message}</span>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
