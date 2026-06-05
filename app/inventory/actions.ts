"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";

function text(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: FormDataEntryValue | null) {
  const raw = text(value).replace(",", ".");
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function addInventoryEntry(formData: FormData) {
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }

  const ingredientName = text(formData.get("ingredient_name"));
  const quantity = numberValue(formData.get("quantity_initial"));
  const unit = text(formData.get("unit"));

  if (!ingredientName || quantity <= 0 || !unit) {
    throw new Error("Ingredient, quantity and unit are required");
  }

  const expiryDate = text(formData.get("expiry_date"));

  const { error } = await supabase.from("inventory_entries").insert({
    ingredient_name: ingredientName,
    quantity_initial: quantity,
    quantity_remaining: quantity,
    unit,
    category: text(formData.get("category")) || null,
    source: text(formData.get("source")) || "App web",
    expiry_date: expiryDate || null,
    storage_location: text(formData.get("storage_location")) || null,
    status: "disponivel",
    notes: text(formData.get("notes")) || null
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/inventory");
}
