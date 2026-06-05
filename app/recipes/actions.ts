"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";

const allowedStatuses = new Set(["aprovada", "neutra", "a_melhorar", "rejeitada", "por_testar"]);

function text(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function updateRecipeStatus(formData: FormData) {
  if (!supabase) throw new Error("Supabase is not configured");

  const recipeId = text(formData.get("recipe_id"));
  const recipeCode = text(formData.get("recipe_code"));
  const status = text(formData.get("status"));
  const notes = text(formData.get("notes"));

  if (!recipeId || !recipeCode || !allowedStatuses.has(status)) {
    throw new Error("Invalid recipe feedback");
  }

  const { error: updateError } = await supabase
    .from("recipes")
    .update({ status })
    .eq("id", recipeId);

  if (updateError) throw new Error(updateError.message);

  const { error: feedbackError } = await supabase.from("recipe_feedback").insert({
    recipe_id: recipeId,
    status,
    rating: null,
    notes: notes || null
  });

  if (feedbackError) throw new Error(feedbackError.message);

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${recipeCode}`);
}
