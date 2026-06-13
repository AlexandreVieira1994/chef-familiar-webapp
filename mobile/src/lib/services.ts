import { supabase } from '@/lib/supabase';
import {
  DashboardSummary,
  FamilyRule,
  FamilyRuleInput,
  Ingredient,
  InventoryEntry,
  InventoryEntryInput,
  MealPlanEntry,
  MealPlanEntryInput,
  MealPlanEntryWithRecipe,
  Recipe,
  RecipeFeedback,
  RecipeIngredientInput,
  RecipeIngredient,
  RecipeStatus,
  RecipeStep,
  RecipeStepInput,
  RecipeUpsertInput,
  ShoppingList,
  ShoppingListItem,
  ShoppingListItemInput,
} from '@/lib/types';

const recipeSelect =
  'id, code, name, category, dish_type, status, prep_time_min, cook_time_min, cost_level, notes, servings, feedback_notes, last_feedback_at, feedback_history, image_url, source_type, source_url, created_at';
const recipeIngredientSelect =
  'id, recipe_id, ingredient_id, ingredient_name, quantity, unit, category, optional, image_url, created_at';
const recipeStepSelect = 'id, recipe_id, position, description, created_at';
const recipeFeedbackSelect = 'id, recipe_id, status, rating, notes, created_at';
const mealPlanSelect = 'id, planned_date, meal_slot, recipe_id, servings_needed, notes, created_at';

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
        .select(recipeSelect)
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
        .select(recipeSelect)
        .eq('id', id)
        .maybeSingle(),
    )) ?? null
  );
}

export async function listIngredients() {
  const client = getClient();

  return (
    (await runQuery<Ingredient[]>(
      client
        .from('ingredients')
        .select('id, name, category, default_unit, created_at')
        .order('name', { ascending: true }),
    )) ?? []
  );
}

export async function listRecipeIngredients(recipeId: string) {
  const client = getClient();

  return (
    (await runQuery<RecipeIngredient[]>(
      client
        .from('recipe_ingredients')
        .select(recipeIngredientSelect)
        .eq('recipe_id', recipeId)
        .order('created_at', { ascending: true }),
    )) ?? []
  );
}

export async function listRecipeSteps(recipeId: string) {
  const client = getClient();

  return (
    (await runQuery<RecipeStep[]>(
      client
        .from('recipe_steps')
        .select(recipeStepSelect)
        .eq('recipe_id', recipeId)
        .order('position', { ascending: true }),
    )) ?? []
  );
}

export async function listRecipeFeedback(recipeId: string) {
  const client = getClient();

  return (
    (await runQuery<RecipeFeedback[]>(
      client
        .from('recipe_feedback')
        .select(recipeFeedbackSelect)
        .eq('recipe_id', recipeId)
        .order('created_at', { ascending: false }),
    )) ?? []
  );
}

export async function upsertRecipeIngredient(input: RecipeIngredientInput) {
  const client = getClient();
  const payload = {
    recipe_id: input.recipe_id,
    ingredient_id: input.ingredient_id ?? null,
    ingredient_name: input.ingredient_name.trim(),
    quantity: input.quantity ?? null,
    unit: input.unit ?? null,
    category: input.category ?? null,
    optional: input.optional ?? false,
    image_url: input.image_url ?? null,
  };

  if (input.id) {
    return runQuery<RecipeIngredient[]>(
      client
        .from('recipe_ingredients')
        .update(payload)
        .eq('id', input.id)
        .select(recipeIngredientSelect),
    );
  }

  return runQuery<RecipeIngredient[]>(
    client
      .from('recipe_ingredients')
      .insert(payload)
      .select(recipeIngredientSelect),
  );
}

export async function deleteRecipeIngredient(id: string) {
  const client = getClient();

  await runQuery<null>(client.from('recipe_ingredients').delete().eq('id', id));
}

export async function replaceRecipeSteps(recipeId: string, steps: RecipeStepInput[]) {
  const client = getClient();
  await runQuery<null>(client.from('recipe_steps').delete().eq('recipe_id', recipeId));

  const payload = steps
    .map((step, index) => ({
      recipe_id: recipeId,
      position: index + 1,
      description: step.description.trim(),
    }))
    .filter((step) => step.description.length > 0);

  if (payload.length === 0) return [];

  return runQuery<RecipeStep[]>(
    client
      .from('recipe_steps')
      .insert(payload)
      .select(recipeStepSelect),
  );
}

export async function replaceRecipeIngredients(recipeId: string, ingredients: RecipeIngredientInput[]) {
  const client = getClient();
  await runQuery<null>(client.from('recipe_ingredients').delete().eq('recipe_id', recipeId));

  const payload = ingredients
    .map((ingredient) => ({
      recipe_id: recipeId,
      ingredient_id: ingredient.ingredient_id ?? null,
      ingredient_name: ingredient.ingredient_name.trim(),
      quantity: ingredient.quantity ?? null,
      unit: ingredient.unit ?? null,
      category: ingredient.category ?? null,
      optional: ingredient.optional ?? false,
      image_url: ingredient.image_url ?? null,
    }))
    .filter((ingredient) => ingredient.ingredient_name.length > 0);

  if (payload.length === 0) return [];

  return runQuery<RecipeIngredient[]>(
    client
      .from('recipe_ingredients')
      .insert(payload)
      .select(recipeIngredientSelect),
  );
}

function getImageExtension(uri: string) {
  const cleanUri = uri.split('?')[0] ?? uri;
  const extension = cleanUri.split('.').pop()?.toLowerCase();

  if (extension && /^[a-z0-9]+$/.test(extension)) {
    return extension === 'jpeg' ? 'jpg' : extension;
  }

  return 'jpg';
}

function getImageContentType(extension: string) {
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  if (extension === 'heic') return 'image/heic';

  return 'image/jpeg';
}

export async function uploadRecipeImage(uri: string) {
  const client = getClient();
  const extension = getImageExtension(uri);
  const path = `recipes/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const response = await fetch(uri);

  if (!response.ok) {
    throw new Error('Não foi possível ler a imagem selecionada.');
  }

  const imageBlob = await response.blob();
  const { error } = await client.storage.from('recipe-images').upload(path, imageBlob, {
    contentType: getImageContentType(extension),
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = client.storage.from('recipe-images').getPublicUrl(path);

  return { path, publicUrl: data.publicUrl };
}

export async function deleteRecipeImage(path: string) {
  const client = getClient();
  const { error } = await client.storage.from('recipe-images').remove([path]);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateRecipeFeedback(id: string, status: RecipeStatus, notes: string | null) {
  const client = getClient();
  const feedbackEntry = {
    status,
    notes,
    created_at: new Date().toISOString(),
  };
  const recipe = await getRecipe(id);

  if (!recipe) {
    throw new Error('Receita não encontrada.');
  }

  await runQuery(
    client
      .from('recipe_feedback')
      .insert({
        recipe_id: id,
        status,
        notes,
      }),
  );

  return runQuery<Recipe[]>(
    client
      .from('recipes')
      .update({
        status,
        feedback_notes: notes,
        last_feedback_at: feedbackEntry.created_at,
        feedback_history: [...recipe.feedback_history, feedbackEntry],
      })
      .eq('id', id)
      .select(recipeSelect),
  );
}

export async function upsertRecipe(input: RecipeUpsertInput) {
  const client = getClient();
  const sourceType = input.source_type ?? 'criada';
  const sourceUrl = input.source_url?.trim() ? input.source_url.trim() : null;
  const payload = {
    code: input.code.trim(),
    name: input.name.trim(),
    category: input.category.trim(),
    dish_type: input.dish_type ?? 'Prato principal',
    status: input.status,
    prep_time_min: input.prep_time_min ?? null,
    cook_time_min: input.cook_time_min ?? null,
    cost_level: input.cost_level ?? null,
    notes: input.notes ?? null,
    servings: input.servings ?? 4,
    image_url: input.image_url ?? null,
    source_type: sourceType,
    source_url: sourceUrl,
  };

  if (input.id) {
    return runQuery<Recipe[]>(
      client.from('recipes').update(payload).eq('id', input.id).select(recipeSelect),
    );
  }

  return runQuery<Recipe[]>(
    client.from('recipes').insert(payload).select(recipeSelect),
  );
}

export async function createRecipeWithDetails({
  recipe,
  steps,
  ingredients,
  imageUri,
}: {
  recipe: RecipeUpsertInput;
  steps: RecipeStepInput[];
  ingredients: RecipeIngredientInput[];
  imageUri?: string | null;
}) {
  let uploadedImagePath: string | null = null;
  let createdRecipeId: string | null = null;

  try {
    let imageUrl = recipe.image_url ?? null;

    if (imageUri) {
      const uploaded = await uploadRecipeImage(imageUri);
      uploadedImagePath = uploaded.path;
      imageUrl = uploaded.publicUrl;
    }

    const [createdRecipe] =
      (await upsertRecipe({
        ...recipe,
        image_url: imageUrl,
        source_type: 'criada',
        source_url: null,
      })) ?? [];

    if (!createdRecipe) {
      throw new Error('Não foi possível criar a receita.');
    }

    createdRecipeId = createdRecipe.id;

    await replaceRecipeSteps(
      createdRecipe.id,
      steps.map((step, index) => ({
        ...step,
        recipe_id: createdRecipe.id,
        position: index + 1,
      })),
    );
    await replaceRecipeIngredients(
      createdRecipe.id,
      ingredients.map((ingredient) => ({
        ...ingredient,
        recipe_id: createdRecipe.id,
      })),
    );

    return createdRecipe;
  } catch (error) {
    const client = getClient();

    if (createdRecipeId) {
      await runQuery<null>(client.from('recipes').delete().eq('id', createdRecipeId)).catch(() => null);
    }

    if (uploadedImagePath) {
      await deleteRecipeImage(uploadedImagePath).catch(() => null);
    }

    throw error;
  }
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
        .select(mealPlanSelect)
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
          dish_type: recipesById.get(entry.recipe_id)!.dish_type,
          status: recipesById.get(entry.recipe_id)!.status,
          servings: recipesById.get(entry.recipe_id)!.servings,
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
    servings_needed: input.servings_needed ?? 4,
    notes: input.notes ?? null,
  };

  if (input.id) {
    const created =
      (await runQuery<MealPlanEntry[]>(
        client
          .from('meal_plan_entries')
          .insert(payload)
          .select(mealPlanSelect),
      )) ?? [];

    await runQuery<null>(client.from('meal_plan_entries').delete().eq('id', input.id));

    return created;
  }

  return runQuery<MealPlanEntry[]>(
    client
      .from('meal_plan_entries')
      .insert(payload)
      .select(mealPlanSelect),
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
  const activeLists =
    (await runQuery<ShoppingList[]>(
      client
        .from('shopping_lists')
        .select('id, start_date, end_date, status, created_at')
        .eq('status', 'ativa')
        .order('created_at', { ascending: false }),
    )) ?? [];

  const [activeList] = activeLists;

  if (activeList && activeLists.length > 1) {
    const staleListIds = activeLists.slice(1).map((list) => list.id);

    await runQuery(
      client.from('shopping_list_items').delete().in('shopping_list_id', staleListIds),
    );
    await runQuery(client.from('shopping_lists').delete().in('id', staleListIds));
  }

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
