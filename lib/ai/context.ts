import { getSupabase } from "@/lib/supabase";
import { isInventoryEntryUsable } from "@/lib/inventory-status";

export async function loadAssistantContext() {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      configured: false,
      familyRules: [],
      recipes: [],
      inventory: [],
      shoppingItems: []
    };
  }

  const [rulesResult, recipesResult, inventoryResult, listResult] = await Promise.all([
    supabase.from("family_rules").select("rule_key, rule_value").order("rule_key"),
    supabase
      .from("recipes")
      .select("id, code, name, category, status, feedback_notes, notes, source_url")
      .order("code"),
    supabase
      .from("inventory_entries")
      .select("id, ingredient_name, quantity_remaining, unit, category, expiry_date, storage_location, status")
      .order("expiry_date", { ascending: true }),
    supabase
      .from("shopping_lists")
      .select("id, created_at, status")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  let shoppingItems: unknown[] = [];
  if (listResult.data?.id) {
    const itemsResult = await supabase
      .from("shopping_list_items")
      .select("id, ingredient_name, planned_quantity, planned_unit, category, purchased_status, purchased_quantity, notes")
      .eq("shopping_list_id", listResult.data.id)
      .order("ingredient_name", { ascending: true });

    shoppingItems = itemsResult.data ?? [];
  }

  return {
    configured: true,
    familyRules: rulesResult.data ?? [],
    recipes: recipesResult.data ?? [],
    inventory: (inventoryResult.data ?? []).filter(isInventoryEntryUsable),
    activeShoppingList: listResult.data ?? null,
    shoppingItems
  };
}
