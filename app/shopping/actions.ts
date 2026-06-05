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
  inventory_entry_id: string | null;
};

const allowedUnits = new Set(["g", "kg", "ml", "l", "L", "un", "uni", "unid", "embalagem", "embalagens", "lata", "latas"]);

function text(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: FormDataEntryValue | null) {
  const raw = text(value).replace(",", ".");
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeUnit(value: string) {
  const unit = value.trim();
  if (unit === "l") return "L";
  if (unit === "uni" || unit === "unid") return "un";
  if (unit === "embalagens") return "un";
  if (unit === "embalagem") return "un";
  if (unit === "lata" || unit === "latas") return "un";
  return unit;
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
    .select("id, ingredient_name, planned_quantity, planned_unit, category, purchased_status, notes, inventory_entry_id")
    .eq("id", itemId)
    .single();

  if (itemError) throw new Error(itemError.message);
  if (!item) throw new Error("Item não encontrado.");

  const shoppingItem = item as ShoppingItem;
  const requestedQuantity = Number(shoppingItem.planned_quantity ?? 0);
  const purchasedQuantity = numberValue(formData.get("purchased_quantity")) || requestedQuantity;
  const requestedUnit = text(formData.get("purchased_unit")) || shoppingItem.planned_unit || "un";
  const purchasedUnit = normalizeUnit(requestedUnit);

  if (purchasedQuantity <= 0 || !purchasedUnit || !allowedUnits.has(requestedUnit) && !allowedUnits.has(purchasedUnit)) {
    throw new Error("Quantidade ou unidade inválida para adicionar ao inventário.");
  }

  if (shoppingItem.purchased_status === "comprado") {
    revalidatePath("/shopping", "page");
    redirect("/shopping");
  }

  const expiryDate = addDays(estimateDays(shoppingItem.category));
  const storageLocation = estimateStorage(shoppingItem.category);
  const unitChangedNote = purchasedUnit !== shoppingItem.planned_unit ? ` Unidade comprada: ${purchasedQuantity} ${purchasedUnit}; unidade planeada: ${shoppingItem.planned_quantity ?? "-"} ${shoppingItem.planned_unit ?? "-"}.` : "";

  const { data: inventoryEntry, error: inventoryError } = await supabase
    .from("inventory_entries")
    .insert({
      ingredient_name: shoppingItem.ingredient_name,
      quantity_initial: purchasedQuantity,
      quantity_remaining: purchasedQuantity,
      unit: purchasedUnit,
      category: shoppingItem.category,
      source: "Lista de compras",
      expiry_date: expiryDate,
      storage_location: storageLocation,
      status: "disponivel",
      notes: shoppingItem.notes ? `Comprado via lista. ${shoppingItem.notes}${unitChangedNote}` : `Comprado via lista de compras.${unitChangedNote}`
    })
    .select("id")
    .single();

  if (inventoryError) throw new Error(inventoryError.message);
  if (!inventoryEntry) throw new Error("Não foi possível criar entrada no inventário.");

  const { error: updateError } = await supabase
    .from("shopping_list_items")
    .update({
      purchased_status: "comprado",
      purchased_quantity: purchasedQuantity,
      inventory_entry_id: inventoryEntry.id
    })
    .eq("id", shoppingItem.id);

  if (updateError) throw new Error(updateError.message);

  revalidatePath("/shopping", "page");
  revalidatePath("/inventory", "page");
  redirect("/shopping");
}

export async function undoShoppingItemPurchased(formData: FormData) {
  if (!supabase) throw new Error("Supabase is not configured");

  const itemId = text(formData.get("item_id"));
  if (!itemId) throw new Error("Item inválido.");

  const { data: item, error: itemError } = await supabase
    .from("shopping_list_items")
    .select("id, inventory_entry_id")
    .eq("id", itemId)
    .single();

  if (itemError) throw new Error(itemError.message);

  const inventoryEntryId = typeof item?.inventory_entry_id === "string" ? item.inventory_entry_id : "";

  if (inventoryEntryId) {
    const { error: inventoryError } = await supabase
      .from("inventory_entries")
      .update({ status: "anulado", quantity_remaining: 0, notes: "Entrada anulada ao desfazer compra na lista." })
      .eq("id", inventoryEntryId);

    if (inventoryError) throw new Error(inventoryError.message);
  }

  const { error: updateError } = await supabase
    .from("shopping_list_items")
    .update({ purchased_status: "nao_comprado", purchased_quantity: null, inventory_entry_id: null })
    .eq("id", itemId);

  if (updateError) throw new Error(updateError.message);

  revalidatePath("/shopping", "page");
  revalidatePath("/inventory", "page");
  redirect("/shopping");
}
