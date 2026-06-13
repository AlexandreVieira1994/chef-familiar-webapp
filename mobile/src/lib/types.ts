export type RecipeStatus =
  | 'por_testar'
  | 'aprovada'
  | 'neutra'
  | 'a_melhorar'
  | 'rejeitada';

export type RecipeSourceType = 'criada' | 'importada';

export type MealSlot = 'pequeno-almoco' | 'almoco' | 'lanche' | 'jantar';

export type ShoppingItemStatus = 'nao_comprado' | 'comprado';

export type InventoryStatus = 'disponivel' | 'removido' | 'sem_stock' | 'expirado';

export type Recipe = {
  id: string;
  code: string;
  name: string;
  category: string;
  dish_type: string;
  status: RecipeStatus;
  prep_time_min: number | null;
  cook_time_min: number | null;
  cost_level: string | null;
  notes: string | null;
  servings: number;
  feedback_notes: string | null;
  last_feedback_at: string | null;
  feedback_history: unknown[];
  image_url: string | null;
  source_type: RecipeSourceType;
  source_url: string | null;
  created_at: string;
};

export type Ingredient = {
  id: string;
  name: string;
  category: string | null;
  default_unit: string | null;
  created_at: string;
};

export type RecipeIngredient = {
  id: string;
  recipe_id: string;
  ingredient_id: string | null;
  ingredient_name: string;
  quantity: number | null;
  unit: string | null;
  category: string | null;
  optional: boolean;
  image_url: string | null;
  created_at: string;
};

export type RecipeStep = {
  id: string;
  recipe_id: string;
  position: number;
  description: string;
  created_at: string;
};

export type RecipeFeedback = {
  id: string;
  recipe_id: string;
  status: RecipeStatus;
  rating: number | null;
  notes: string | null;
  created_at: string;
};

export type InventoryEntry = {
  id: string;
  entry_date: string;
  ingredient_name: string;
  quantity_initial: number;
  quantity_remaining: number;
  unit: string;
  category: string | null;
  source: string | null;
  expiry_date: string | null;
  storage_location: string | null;
  status: string | null;
  notes: string | null;
  created_at: string;
};

export type ShoppingList = {
  id: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  created_at: string;
};

export type ShoppingListItem = {
  id: string;
  shopping_list_id: string | null;
  ingredient_name: string;
  planned_quantity: number | null;
  planned_unit: string | null;
  category: string | null;
  purchased_status: string;
  purchased_quantity: number | null;
  inventory_entry_id: string | null;
  notes: string | null;
  created_at: string;
};

export type FamilyRule = {
  id: string;
  rule_key: string;
  rule_value: string;
  created_at: string;
};

export type MealPlanEntry = {
  id: string;
  planned_date: string;
  meal_slot: MealSlot;
  recipe_id: string;
  servings_needed: number;
  notes: string | null;
  created_at: string;
};

export type MealPlanEntryWithRecipe = MealPlanEntry & {
  recipe: Pick<Recipe, 'id' | 'code' | 'name' | 'category' | 'dish_type' | 'status' | 'servings'> | null;
};

export type DashboardSummary = {
  recipesCount: number;
  inventoryActiveCount: number;
  shoppingPendingCount: number;
  rulesCount: number;
  upcomingMeals: MealPlanEntryWithRecipe[];
  lowStockEntries: InventoryEntry[];
};

export type AssistantActionType =
  | 'createInventoryEntry'
  | 'markShoppingItemPurchased'
  | 'createMealPlanEntry'
  | 'updateFamilyRule';

export type AssistantActionProposal<TPayload = unknown> = {
  intent: AssistantActionType;
  summary: string;
  affectedEntities: string[];
  payload: TPayload;
  expectedResult: string;
  requiresConfirmation: true;
};

export type RecipeUpsertInput = {
  id?: string;
  code: string;
  name: string;
  category: string;
  dish_type?: string;
  status: RecipeStatus;
  prep_time_min?: number | null;
  cook_time_min?: number | null;
  cost_level?: string | null;
  notes?: string | null;
  servings?: number;
  image_url?: string | null;
  source_type?: RecipeSourceType;
  source_url?: string | null;
};

export type RecipeIngredientInput = {
  id?: string;
  recipe_id: string;
  ingredient_id?: string | null;
  ingredient_name: string;
  quantity?: number | null;
  unit?: string | null;
  category?: string | null;
  optional?: boolean;
  image_url?: string | null;
};

export type RecipeStepInput = {
  id?: string;
  recipe_id: string;
  position: number;
  description: string;
};

export type InventoryEntryInput = {
  id?: string;
  entry_date: string;
  ingredient_name: string;
  quantity_initial: number;
  quantity_remaining: number;
  unit: string;
  category?: string | null;
  source?: string | null;
  expiry_date?: string | null;
  storage_location?: string | null;
  status?: string | null;
  notes?: string | null;
};

export type MealPlanEntryInput = {
  id?: string;
  planned_date: string;
  meal_slot: MealSlot;
  recipe_id: string;
  servings_needed?: number;
  notes?: string | null;
};

export type ShoppingListItemInput = {
  id?: string;
  shopping_list_id?: string | null;
  ingredient_name: string;
  planned_quantity?: number | null;
  planned_unit?: string | null;
  category?: string | null;
  purchased_status?: ShoppingItemStatus;
  purchased_quantity?: number | null;
  notes?: string | null;
};

export type FamilyRuleInput = {
  id?: string;
  rule_key: string;
  rule_value: string;
};
