import { supabase } from '@/lib/supabase';
import {
  DashboardSummary,
  FamilyRule,
  FamilyRuleInput,
  InventoryEntry,
  InventoryEntryInput,
  MealPlanEntry,
  MealPlanEntryInput,
  MealPlanEntryWithRecipe,
  Recipe,
  RecipeIngredient,
  RecipeUpsertInput,
  ShoppingList,
  ShoppingListItem,
  ShoppingListItemInput,
} from '@/lib/types';

function getClient() {
  if (!supabase) {
    throw new Error('Supabase não configurada. Verifica EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  }

  return supabase;
}

async function runQuery<T>(promise: PromiseLike<{ data: T | null; error: { message: string } | null }>) {
  const { data, error } = await promise;

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function listRecipes() {
  const client = getClient();

  return (
    (await runQuery<Recipe[]>(
      client
        .from('recipes')
        .select(
          'id, code, name, category, status, prep_time_min, cook_time_min, cost_level, notes, feedback_notes, last_feedback_at, feedback_history, image_url, source_url, created_at',
        )
        .order('code', { ascending: true }),
    )) ?? []
  );
}

export async function getRecipe(id: string) {
  const client = getClient();

  return (
    (await runQuery<Recipe | null>(
      client
        .from('recipes')
        .select(
          'id, code, name, category, status, prep_time_min, cook_time_min, cost_level, notes, feedback_notes, last_feedback_at, feedback_history, image_url, source_url, created_at',
        )
        .eq('id', id)
        .maybeSingle(),
    )) ?? null
  );
}

export async function listRecipeIngredients(recipeId: string) {
  const client = getClient();

  return (
    (await runQuery<RecipeIngredient[]>(
      client
        .from('recipe_ingredients')
        .select('id, recipe_id, ingredient_name, quantity, unit, category, optional, image_url, created_at')
        .eq('recipe_id', recipeId)
        .order('created_at', { ascending: true }),
    )) ?? []
  );
}

export async function upsertRecipe(input: RecipeUpsertInput) {
  const client = getClient();
  const payload = {
    code: input.code.trim(),
    name: input.name.trim(),
    category: input.category.trim(),
    status: input.status,
    prep_time_min: input.prep_time_min ?? null,
    cook_time_min: input.cook_time_min ?? null,
    cost_level: input.cost_level ?? null,
    notes: input.notes ?? null,
    image_url: input.image_url ?? null,
    source_url: input.source_url.trim(),
  };

  if (input.id) {
    return runQuery<Recipe[]>(
      client.from('recipes').update(payload).eq('id', input.id).select(
        'id, code, name, category, status, prep_time_min, cook_time_min, cost_level, notes, feedback_notes, last_feedback_at, feedback_history, image_url, source_url, created_at',
      ),
    );
  }

  return runQuery<Recipe[]>(
    client.from('recipes').insert(payload).select(
      'id, code, name, category, status, prep_time_min, cook_time_min, cost_level, notes, feedback_notes, last_feedback_at, feedback_history, image_url, source_url, created_at',
    ),
  );
}

export async function listInventoryEntries() {
  const client = getClient();

  return (
    (await runQuery<InventoryEntry[]>(
      client
        .from('inventory_entries')
        .select(
          'id, entry_date, ingredient_name, quantity_initial, quantity_remaining, unit, category, source, expiry_date, storage_location, status, notes, created_at',
        )
        .order('expiry_date', { ascending: true, nullsFirst: false })
        .order('ingredient_name', { ascending: true }),
    )) ?? []
  );
}

export async function upsertInventoryEntry(input: InventoryEntryInput) {
  const client = getClient();
  const payload = {
    entry_date: input.entry_date,
    ingredient_name: input.ingredient_name.trim(),
    quantity_initial: input.quantity_initial,
    quantity_remaining: input.quantity_remaining,
    unit: input.unit.trim(),
    category: input.category ?? null,
    source: input.source ?? null,
    expiry_date: input.expiry_date ?? null,
    storage_location: input.storage_location ?? null,
    status: input.status ?? 'disponivel',
    notes: input.notes ?? null,
  };

  if (input.id) {
    return runQuery<InventoryEntry[]>(
      client.from('inventory_entries').update(payload).eq('id', input.id).select(
        'id, entry_date, ingredient_name, quantity_initial, quantity_remaining, unit, category, source, expiry_date, storage_location, status, notes, created_at',
      ),
    );
  }

  return runQuery<InventoryEntry[]>(
    client.from('inventory_entries').insert(payload).select(
      'id, entry_date, ingredient_name, quantity_initial, quantity_remaining, unit, category, source, expiry_date, storage_location, status, notes, created_at',
    ),
  );
}

export async function createInventoryEntry(input: InventoryEntryInput) {
  return upsertInventoryEntry(input);
}

export async function softDeleteInventoryEntry(entry: InventoryEntry) {
  const client = getClient();
  const notes = entry.notes ? `${entry.notes}\n\nRemovido na app.` : 'Removido na app.';

  return runQuery<InventoryEntry[]>(
    client
      .from('inventory_entries')
      .update({
        quantity_remaining: 0,
        status: 'removido',
        notes,
      })
      .eq('id', entry.id)
      .select(
        'id, entry_date, ingredient_name, quantity_initial, quantity_remaining, unit, category, source, expiry_date, storage_location, status, notes, created_at',
      ),
  );
}

export async function listFamilyRules() {
  const client = getClient();

  return (
    (await runQuery<FamilyRule[]>(
      client
        .from('family_rules')
        .select('id, rule_key, rule_value, created_at')
        .order('rule_key', { ascending: true }),
    )) ?? []
  );
}

export async function upsertFamilyRule(input: FamilyRuleInput) {
  const client = getClient();
  const payload = {
    rule_key: input.rule_key.trim(),
    rule_value: input.rule_value.trim(),
  };

  if (input.id) {
    return runQuery<FamilyRule[]>(
      client.from('family_rules').update(payload).eq('id', input.id).select('id, rule_key, rule_value, created_at'),
    );
  }

  return runQuery<FamilyRule[]>(
    client.from('family_rules').insert(payload).select('id, rule_key, rule_value, created_at'),
  );
}

export async function updateFamilyRule(input: FamilyRuleInput) {
  return upsertFamilyRule(input);
}

export async function deleteFamilyRule(id: string) {
  const client = getClient();

  await runQuery<null>(client.from('family_rules').delete().eq('id', id));
}

export async function listMealPlanEntries() {
  const client = getClient();
  const [entries, recipes] = await Promise.all([
    runQuery<MealPlanEntry[]>(
      client
        .from('meal_plan_entries')
        .select('id, planned_date, meal_slot, recipe_id, notes, created_at')
        .order('planned_date', { ascending: true })
        .order('meal_slot', { ascending: true }),
    ),
    listRecipes(),
  ]);

  const recipesById = new Map(recipes.map((recipe) => [recipe.id, recipe]));

  return (entries ?? []).map<MealPlanEntryWithRecipe>((entry) => ({
    ...entry,
    recipe: recipesById.get(entry.recipe_id)
      ? {
          id: recipesById.get(entry.recipe_id)!.id,
          code: recipesById.get(entry.recipe_id)!.code,
          name: recipesById.get(entry.recipe_id)!.name,
          category: recipesById.get(entry.recipe_id)!.category,
          status: recipesById.get(entry.recipe_id)!.status,
        }
      : null,
  }));
}

export async function upsertMealPlanEntry(input: MealPlanEntryInput) {
  const client = getClient();
  const payload = {
    planned_date: input.planned_date,
    meal_slot: input.meal_slot,
    recipe_id: input.recipe_id,
    notes: input.notes ?? null,
  };

  if (input.id) {
    const created =
      (await runQuery<MealPlanEntry[]>(
        client
          .from('meal_plan_entries')
          .insert(payload)
          .select('id, planned_date, meal_slot, recipe_id, notes, created_at'),
      )) ?? [];

    await runQuery<null>(client.from('meal_plan_entries').delete().eq('id', input.id));

    return created;
  }

  return runQuery<MealPlanEntry[]>(
    client
      .from('meal_plan_entries')
      .insert(payload)
      .select('id, planned_date, meal_slot, recipe_id, notes, created_at'),
  );
}

export async function createMealPlanEntry(input: MealPlanEntryInput) {
  return upsertMealPlanEntry(input);
}

export async function deleteMealPlanEntry(id: string) {
  const client = getClient();

  await runQuery<null>(client.from('meal_plan_entries').delete().eq('id', id));
}

export async function ensureActiveShoppingList() {
  const client = getClient();
  const activeList =
    (await runQuery<ShoppingList | null>(
      client
        .from('shopping_lists')
        .select('id, start_date, end_date, status, created_at')
        .eq('status', 'ativa')
        .order('created_at', { ascending: false })
        .maybeSingle(),
    )) ?? null;

  if (activeList) return activeList;

  const [created] =
    (await runQuery<ShoppingList[]>(
      client
        .from('shopping_lists')
        .insert({
          status: 'ativa',
          start_date: new Date().toISOString().slice(0, 10),
        })
        .select('id, start_date, end_date, status, created_at'),
    )) ?? [];

  if (!created) {
    throw new Error('Não foi possível criar uma lista de compras ativa.');
  }

  return created;
}

export async function getActiveShoppingList() {
  const client = getClient();
  const list = await ensureActiveShoppingList();
  const items =
    (await runQuery<ShoppingListItem[]>(
      client
        .from('shopping_list_items')
        .select(
          'id, shopping_list_id, ingredient_name, planned_quantity, planned_unit, category, purchased_status, purchased_quantity, inventory_entry_id, notes, created_at',
        )
        .eq('shopping_list_id', list.id)
        .order('created_at', { ascending: true }),
    )) ?? [];

  return { list, items };
}

export async function upsertShoppingListItem(input: ShoppingListItemInput) {
  const client = getClient();
  const activeList = input.shopping_list_id ? null : await ensureActiveShoppingList();
  const payload = {
    shopping_list_id: input.shopping_list_id ?? activeList?.id ?? null,
    ingredient_name: input.ingredient_name.trim(),
    planned_quantity: input.planned_quantity ?? null,
    planned_unit: input.planned_unit ?? null,
    category: input.category ?? null,
    purchased_status: input.purchased_status ?? 'nao_comprado',
    purchased_quantity: input.purchased_quantity ?? null,
    notes: input.notes ?? null,
  };

  if (input.id) {
    return runQuery<ShoppingListItem[]>(
      client
        .from('shopping_list_items')
        .update(payload)
        .eq('id', input.id)
        .select(
          'id, shopping_list_id, ingredient_name, planned_quantity, planned_unit, category, purchased_status, purchased_quantity, inventory_entry_id, notes, created_at',
        ),
    );
  }

  return runQuery<ShoppingListItem[]>(
    client
      .from('shopping_list_items')
      .insert(payload)
      .select(
        'id, shopping_list_id, ingredient_name, planned_quantity, planned_unit, category, purchased_status, purchased_quantity, inventory_entry_id, notes, created_at',
      ),
  );
}

export async function deleteShoppingListItem(id: string) {
  const client = getClient();

  await runQuery<null>(client.from('shopping_list_items').delete().eq('id', id));
}

export async function markShoppingItemPurchased(item: ShoppingListItem) {
  const client = getClient();
  const quantity = item.purchased_quantity ?? item.planned_quantity ?? 1;
  const unit = item.planned_unit ?? 'un';

  const [entry] =
    (await runQuery<InventoryEntry[]>(
      client
        .from('inventory_entries')
        .insert({
          entry_date: new Date().toISOString().slice(0, 10),
          ingredient_name: item.ingredient_name,
          quantity_initial: quantity,
          quantity_remaining: quantity,
          unit,
          category: item.category ?? null,
          source: 'shopping_list',
          status: 'disponivel',
          notes: item.notes ?? null,
        })
        .select(
          'id, entry_date, ingredient_name, quantity_initial, quantity_remaining, unit, category, source, expiry_date, storage_location, status, notes, created_at',
        ),
    )) ?? [];

  if (!entry) {
    throw new Error('Não foi possível criar a entrada de inventário da compra.');
  }

  await runQuery<ShoppingListItem[]>(
    client
      .from('shopping_list_items')
      .update({
        purchased_status: 'comprado',
        purchased_quantity: quantity,
        inventory_entry_id: entry.id,
      })
      .eq('id', item.id)
      .select(
        'id, shopping_list_id, ingredient_name, planned_quantity, planned_unit, category, purchased_status, purchased_quantity, inventory_entry_id, notes, created_at',
      ),
  );
}

export async function undoShoppingItemPurchase(item: ShoppingListItem) {
  const client = getClient();

  if (item.inventory_entry_id) {
    const existingEntry =
      (await runQuery<InventoryEntry | null>(
        client
          .from('inventory_entries')
          .select(
            'id, entry_date, ingredient_name, quantity_initial, quantity_remaining, unit, category, source, expiry_date, storage_location, status, notes, created_at',
          )
          .eq('id', item.inventory_entry_id)
          .maybeSingle(),
      )) ?? null;

    if (existingEntry) {
      await softDeleteInventoryEntry(existingEntry);
    }
  }

  await runQuery<ShoppingListItem[]>(
    client
      .from('shopping_list_items')
      .update({
        purchased_status: 'nao_comprado',
        purchased_quantity: null,
        inventory_entry_id: null,
      })
      .eq('id', item.id)
      .select(
        'id, shopping_list_id, ingredient_name, planned_quantity, planned_unit, category, purchased_status, purchased_quantity, inventory_entry_id, notes, created_at',
      ),
  );
}

export async function getDashboardSummary() {
  const [recipes, inventory, shopping, rules, upcomingMeals] = await Promise.all([
    listRecipes(),
    listInventoryEntries(),
    getActiveShoppingList(),
    listFamilyRules(),
    listMealPlanEntries(),
  ]);

  const inventoryActive = inventory.filter((entry) => entry.quantity_remaining > 0 && entry.status !== 'removido');
  const shoppingPending = shopping.items.filter((item) => item.purchased_status !== 'comprado');
  const lowStockEntries = inventoryActive
    .filter((entry) => entry.quantity_remaining <= entry.quantity_initial * 0.25)
    .slice(0, 4);

  return {
    recipesCount: recipes.length,
    inventoryActiveCount: inventoryActive.length,
    shoppingPendingCount: shoppingPending.length,
    rulesCount: rules.length,
    upcomingMeals: upcomingMeals.slice(0, 4),
    lowStockEntries,
  } satisfies DashboardSummary;
}

export async function logAssistantProposal(userMessage: string, proposal: unknown, interpretedIntent: string) {
  const client = getClient();

  await runQuery(
    client.from('assistant_action_logs').insert({
      user_message: userMessage,
      interpreted_intent: interpretedIntent,
      proposed_payload: proposal,
      status: 'proposed',
    }),
  );
}
