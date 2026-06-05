"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

const allowedStatuses = new Set(["aprovada", "neutra", "a_melhorar", "rejeitada", "por_testar"]);

function text(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export type RecipeStatusState = {
  ok: boolean;
  message: string;
};

type FeedbackHistoryItem = {
  status: string;
  notes: string | null;
  created_at: string;
};

async function saveRecipeStatus(formData: FormData): Promise<RecipeStatusState> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, message: "Supabase não configurada." };

  const recipeId = text(formData.get("recipe_id"));
  const recipeCode = text(formData.get("recipe_code"));
  const status = text(formData.get("status"));
  const notes = text(formData.get("notes"));
  const now = new Date().toISOString();

  if (!recipeId || !recipeCode || !allowedStatuses.has(status)) {
    return { ok: false, message: "Avaliação inválida." };
  }

  const { data: currentRecipe, error: readError } = await supabase
    .from("recipes")
    .select("feedback_history")
    .eq("id", recipeId)
    .single();

  if (readError) return { ok: false, message: readError.message };

  const currentHistory = Array.isArray(currentRecipe?.feedback_history)
    ? (currentRecipe.feedback_history as FeedbackHistoryItem[])
    : [];

  const newHistory: FeedbackHistoryItem[] = [
    { status, notes: notes || null, created_at: now },
    ...currentHistory
  ].slice(0, 20);

  const updatePayload: Record<string, unknown> = {
    status,
    last_feedback_at: now,
    feedback_history: newHistory
  };

  if (notes) updatePayload.feedback_notes = notes;

  const { error: updateError } = await supabase
    .from("recipes")
    .update(updatePayload)
    .eq("id", recipeId);

  if (updateError) return { ok: false, message: updateError.message };

  await supabase.from("recipe_feedback").insert({
    recipe_id: recipeId,
    status,
    rating: null,
    notes: notes || null,
    created_at: now
  });

  revalidatePath("/recipes", "page");
  revalidatePath(`/recipes/${recipeCode}`, "page");

  return { ok: true, message: "Guardado." };
}

export async function updateRecipeStatus(_previousState: RecipeStatusState, formData: FormData): Promise<RecipeStatusState> {
  return saveRecipeStatus(formData);
}

export async function updateRecipeStatusForm(formData: FormData) {
  const result = await saveRecipeStatus(formData);
  if (!result.ok) throw new Error(result.message);

  const returnTo = text(formData.get("return_to")) || "/recipes";
  redirect(returnTo);
}
