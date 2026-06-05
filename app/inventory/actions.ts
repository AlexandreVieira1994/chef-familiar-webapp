"use server";

import { revalidatePath } from "next/cache";
import { buildInventoryEntry, normalizeUnit } from "@/lib/ai/inventory-utils";
import { getSupabase } from "@/lib/supabase";

function text(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: FormDataEntryValue | null) {
  const raw = text(value).replace(",", ".");
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

type ParsedItem = {
  ingredientName: string;
  quantity: number;
  unit: string;
};

function parseInventoryText(input: string): ParsedItem[] {
  const cleaned = input
    .replace(/\bcomprei\b/gi, "")
    .replace(/\btrouxe\b/gi, "")
    .replace(/\badicionei\b/gi, "")
    .replace(/\be\b/gi, ",")
    .replace(/\n/g, ",");

  return cleaned
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const match = part.match(/^(\d+(?:[\.,]\d+)?)\s*(kg|g|gr|un|uni|unid|l|lt|ml|lata|latas|embalagem|embalagens|molho|molhos)?\s+(.+)$/i);
      if (!match) return null;

      const quantity = Number(match[1].replace(",", "."));
      const unit = normalizeUnit((match[2] || "un").toLowerCase());
      const ingredientName = match[3].trim();

      if (!ingredientName || !Number.isFinite(quantity) || quantity <= 0) return null;
      return { ingredientName, quantity, unit };
    })
    .filter((item): item is ParsedItem => Boolean(item));
}

export async function addInventoryEntry(formData: FormData) {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }

  const ingredientName = text(formData.get("ingredient_name"));
  const quantity = numberValue(formData.get("quantity_initial"));
  const unit = text(formData.get("unit"));

  if (!ingredientName || quantity <= 0 || !unit) {
    throw new Error("Ingredient, quantity and unit are required");
  }

  const entry = buildInventoryEntry(
    ingredientName,
    quantity,
    unit,
    text(formData.get("category")),
    text(formData.get("expiry_date")),
    text(formData.get("storage_location")),
    text(formData.get("notes"))
  );

  const { error } = await supabase.from("inventory_entries").insert(entry);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/inventory");
}

export async function addInventoryFromText(formData: FormData) {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }

  const input = text(formData.get("inventory_text"));
  const parsed = parseInventoryText(input);

  if (parsed.length === 0) {
    throw new Error("No valid inventory items found");
  }

  const entries = parsed.map((item) => buildInventoryEntry(item.ingredientName, item.quantity, item.unit));
  const { error } = await supabase.from("inventory_entries").insert(entries);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/inventory");
}

export async function updateInventoryEntry(formData: FormData) {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }

  const entryId = text(formData.get("entry_id"));
  const ingredientName = text(formData.get("ingredient_name"));
  const quantityRemaining = numberValue(formData.get("quantity_remaining"));
  const unit = text(formData.get("unit"));
  const status = text(formData.get("status")) || "disponivel";

  if (!entryId || !ingredientName || quantityRemaining < 0 || !unit) {
    throw new Error("Entrada de inventário inválida.");
  }

  const { error } = await supabase
    .from("inventory_entries")
    .update({
      ingredient_name: ingredientName,
      quantity_remaining: quantityRemaining,
      unit: normalizeUnit(unit),
      category: text(formData.get("category")) || null,
      expiry_date: text(formData.get("expiry_date")) || null,
      storage_location: text(formData.get("storage_location")) || null,
      status,
      notes: text(formData.get("notes")) || null
    })
    .eq("id", entryId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/inventory");
}

export async function deleteInventoryEntry(formData: FormData) {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }

  const entryId = text(formData.get("entry_id"));
  if (!entryId) {
    throw new Error("Entrada de inventário inválida.");
  }

  const { data, error } = await supabase
    .from("inventory_entries")
    .update({
      quantity_remaining: 0,
      status: "removido",
      notes: "Entrada removida pela app."
    })
    .eq("id", entryId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Não foi possível remover a entrada.");
  }

  revalidatePath("/inventory");
}
