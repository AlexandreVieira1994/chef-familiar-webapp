"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";

const allowedStatuses = new Set(["aprovada", "neutra", "a_melhorar", "rejeitada", "por_testar"]);

function text(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export type RecipeStatusState = {
  ok: boolean;
  message: string;
};

export async function updateRecipeStatus(_previousState: RecipeStatusState, formData: FormData): Promise<RecipeStatusState> {
  if (!supabase) return { ok: false, message: "Supabase não configurada." };

  const recipeId = text(formData.get("recipe_id"));
  const recipeCode = text(formData.get("recipe_code"));
  const status = text(formData.get("status"));
  const notes = text(formData.get("notes"));

  if (!recipeId || !recipeCode || !allowedStatuses.has(status)) {
    return { ok: false, message: "Avaliação inválida." };
  }

  const { error: updateError } = await supabase
    .from("recipes")
    .update({ status })
    .eq("id", recipeId);

  if (updateError) return { ok: false, message: updateError.message };

  const { error: feedbackError } = await supabase.from("recipe_feedback").insert({
    recipe_id: recipeId,
    status,
    rating: null,
    notes: notes || null
  });

  if (feedbackError) return { ok: false, message: feedbackError.message };

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${recipeCode}`);

  return { ok: true, message: "Guardado." };
}
