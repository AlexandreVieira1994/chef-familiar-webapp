"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";

type ShoppingItem = {
  id: string;
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

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function estimateDays(category: string | null) {
  const value = (category ?? "").toLowerCase();
  if (value.includes("legume") || value.includes("peixe")) return 5;
  if (value.includes("fruta")) return 10;
  if (value.includes("ovo")) return 21;
  if (value.includes("leguminosa") || value.includes("cereal") || value.includes("hidrato")) return 365;
  return 14;
}

function estimateStorage(category: string | null) {
  const value = (category ?? "").toLowerCase();
  if (value.includes("legume") || value.includes("fruta") || value.includes("ovo") || value.includes("peixe")) return "Frigorífico";
  return "Despensa";
}

export async function markShoppingItemPurchased(formData: FormData) {
  if (!supabase) throw new Error("Supabase is not configured");

  const itemId = text(formData.get("item_id"));
  if (!itemId) throw new Error("Item inválido.");

  const { data: item, error: itemError } = await supabase
    .from("shopping_list_items")
    .select("id, ingredient_name, planned_quantity, planned_unit, category, purchased_status, notes")
    .eq("id", itemId)
    .single();

  if (itemError) throw new Error(itemError.message);
  if (!item) throw new Error("Item não encontrado.");

  const shoppingItem = item as ShoppingItem;
  const quantity = Number(shoppingItem.planned_quantity ?? 0);

  if (quantity <= 0 || !shoppingItem.planned_unit) {
    throw new Error("Quantidade inválida para adicionar ao inventário.");
  }

  if (shoppingItem.purchased_status === "comprado") {
    revalidatePath("/shopping", "page");
    redirect("/shopping");
  }

  const expiryDate = addDays(estimateDays(shoppingItem.category));
  const storageLocation = estimateStorage(shoppingItem.category);

  const { error: inventoryError } = await supabase.from("inventory_entries").insert({
    ingredient_name: shoppingItem.ingredient_name,
    quantity_initial: quantity,
    quantity_remaining: quantity,
    unit: shoppingItem.planned_unit,
    category: shoppingItem.category,
    source: "Lista de compras",
    expiry_date: expiryDate,
    storage_location: storageLocation,
    status: "disponivel",
    notes: shoppingItem.notes ? `Comprado via lista. ${shoppingItem.notes}` : "Comprado via lista de compras."
  });

  if (inventoryError) throw new Error(inventoryError.message);

  const { error: updateError } = await supabase
    .from("shopping_list_items")
    .update({ purchased_status: "comprado" })
    .eq("id", shoppingItem.id);

  if (updateError) throw new Error(updateError.message);

  revalidatePath("/shopping", "page");
  revalidatePath("/inventory", "page");
  redirect("/shopping");
}
