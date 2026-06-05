"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";

type RecipeIngredient = {
  ingredient_name: string;
  quantity: number | null;
  unit: string | null;
  category: string | null;
};

type InventoryEntry = {
  ingredient_name: string;
  quantity_remaining: number;
  unit: string;
};

type ShoppingRow = {
  ingredient_name: string;
  planned_quantity: number | null;
  planned_unit: string | null;
  category: string | null;
  purchased_status: string;
  notes: string | null;
};

function text(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function normalize(value: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function keyFor(name: string, unit: string | null) {
  return `${normalize(name)}|${normalize(unit)}`;
}

export async function generateShoppingListFromRecipes(formData: FormData) {
  if (!supabase) throw new Error("Supabase is not configured");

  const recipeIds = formData.getAll("recipe_id").map((value) => text(value)).filter(Boolean);
  if (recipeIds.length === 0) throw new Error("Seleciona pelo menos uma receita.");

  const { data: ingredients, error: ingredientsError } = await supabase
    .from("recipe_ingredients")
    .select("ingredient_name, quantity, unit, category")
    .in("recipe_id", recipeIds);

  if (ingredientsError) throw new Error(ingredientsError.message);

  const { data: inventory, error: inventoryError } = await supabase
    .from("inventory_entries")
    .select("ingredient_name, quantity_remaining, unit")
    .eq("status", "disponivel");

  if (inventoryError) throw new Error(inventoryError.message);

  const totals = new Map<string, ShoppingRow>();

  for (const ingredient of (ingredients ?? []) as RecipeIngredient[]) {
    const key = keyFor(ingredient.ingredient_name, ingredient.unit);
    const current = totals.get(key);

    if (!current) {
      totals.set(key, {
        ingredient_name: ingredient.ingredient_name,
        planned_quantity: ingredient.quantity ?? null,
        planned_unit: ingredient.unit ?? null,
        category: ingredient.category ?? null,
        purchased_status: "nao_comprado",
        notes: null
      });
      continue;
    }

    if (current.planned_quantity !== null && ingredient.quantity !== null) {
      current.planned_quantity += ingredient.quantity;
    } else {
      current.planned_quantity = null;
      current.notes = "Quantidade não agregada automaticamente por falta de dados.";
    }
  }

  const inventoryTotals = new Map<string, number>();
  for (const entry of (inventory ?? []) as InventoryEntry[]) {
    const key = keyFor(entry.ingredient_name, entry.unit);
    inventoryTotals.set(key, (inventoryTotals.get(key) ?? 0) + Number(entry.quantity_remaining ?? 0));
  }

  const shoppingRows: ShoppingRow[] = [];

  for (const row of totals.values()) {
    if (row.planned_quantity === null || !row.planned_unit) {
      shoppingRows.push({ ...row, notes: row.notes ?? "Confirmar quantidade manualmente." });
      continue;
    }

    const available = inventoryTotals.get(keyFor(row.ingredient_name, row.planned_unit)) ?? 0;
    const missing = Math.max(row.planned_quantity - available, 0);

    if (missing <= 0) {
      continue;
    }

    shoppingRows.push({
      ...row,
      planned_quantity: missing,
      notes: available > 0 ? `Descontado inventário: ${available} ${row.planned_unit}.` : null
    });
  }

  const { data: list, error: listError } = await supabase
    .from("shopping_lists")
    .insert({ status: "ativa" })
    .select("id")
    .single();

  if (listError) throw new Error(listError.message);

  if (shoppingRows.length > 0) {
    const { error: itemsError } = await supabase
      .from("shopping_list_items")
      .insert(shoppingRows.map((row) => ({ ...row, shopping_list_id: list.id })));

    if (itemsError) throw new Error(itemsError.message);
  }

  revalidatePath("/shopping", "page");
  revalidatePath("/planner", "page");
  redirect("/shopping");
}
