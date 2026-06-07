"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { familyRulesText, loadFamilyRules } from "@/lib/family-rules";
import { getAssistantModel, getOpenAIClient } from "@/lib/ai/openai";
import { isInventoryEntryUsable } from "@/lib/inventory-status";
import { getSupabase } from "@/lib/supabase";

type RecipeIngredient = {
  recipe_id: string;
  ingredient_name: string;
  quantity: number | null;
  unit: string | null;
  category: string | null;
};

type InventoryEntry = {
  ingredient_name: string;
  quantity_remaining: number;
  unit: string;
  expiry_date: string | null;
  status: string | null;
};

type ShoppingRow = {
  ingredient_name: string;
  planned_quantity: number | null;
  planned_unit: string | null;
  category: string | null;
  purchased_status: string;
  notes: string | null;
};

type RecipeForPlan = {
  id: string;
  code: string;
  name?: string;
  status: string;
  category: string;
  cost_level?: string | null;
  prep_time_min?: number | null;
  cook_time_min?: number | null;
  notes?: string | null;
};

type RecipeIngredientForPlan = {
  recipe_id: string;
  ingredient_name: string;
};

type GeneratedRecipe = {
  name: string;
  category: string;
  prep_time_min: number;
  cook_time_min: number;
  cost_level: string;
  notes: string;
  ingredients: Array<{
    ingredient_name: string;
    quantity: number | null;
    unit: string | null;
    category: string | null;
  }>;
};

const mealSlots = ["pequeno_almoco", "almoco", "lanche", "jantar"];

function text(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function normalize(value: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function keyFor(name: string, unit: string | null) {
  return `${normalize(name)}|${normalize(unit)}`;
}

function isDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function addDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function limitedNumber(value: FormDataEntryValue | null, fallback: number, min: number, max: number) {
  const parsed = Number(text(value));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.trunc(parsed), min), max);
}

function chosenMealSlots(formData: FormData) {
  const selected = formData
    .getAll("meal_slot")
    .map((value) => text(value))
    .filter((value) => mealSlots.includes(value));

  return selected.length > 0 ? selected : ["almoco", "jantar"];
}

function statusRank(status: string) {
  if (status === "aprovada") return 0;
  if (status === "neutra") return 1;
  if (status === "a_melhorar") return 2;
  return 3;
}

function recipeStyleLabel(style: string) {
  if (style === "requintadas") return "mais requintadas";
  if (style === "arrojadas") return "mais arrojadas";
  if (style === "aproveitamento") return "focadas em aproveitar ingredientes a expirar";
  return "simples e praticas";
}

function styleRank(recipe: RecipeForPlan, style: string) {
  const textValue = `${recipe.name ?? ""} ${recipe.category} ${recipe.cost_level ?? ""} ${recipe.notes ?? ""}`.toLowerCase();
  const totalTime = Number(recipe.prep_time_min ?? 0) + Number(recipe.cook_time_min ?? 0);

  if (style === "simples") return totalTime <= 30 || textValue.includes("simples") || textValue.includes("rapida") ? 0 : 1;
  if (style === "requintadas") return textValue.includes("forno") || textValue.includes("gratin") || totalTime >= 35 ? 0 : 1;
  if (style === "arrojadas") return textValue.includes("estufado") || textValue.includes("mediterr") || textValue.includes("hamburg") ? 0 : 1;
  if (style === "aproveitamento") return textValue.includes("sobra") || textValue.includes("congel") || textValue.includes("quantidade") ? 0 : 1;
  return 0;
}

function isSoonExpiring(expiryDate: string | null, startDate: string) {
  if (!expiryDate) return false;
  return expiryDate >= startDate && expiryDate <= addDays(startDate, 7);
}

function fishLimitFromRules(rulesText: string) {
  const fishRule = rulesText.match(/peixe[^\d]*(\d+)/i);
  const parsed = fishRule ? Number(fishRule[1]) : 2;
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 2;
}

function safeJsonArray(value: string): GeneratedRecipe[] {
  const trimmed = value.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return Array.isArray(parsed) ? parsed as GeneratedRecipe[] : [];
  } catch {
    return [];
  }
}

async function nextRecipeCode() {
  const supabase = getSupabase();
  if (!supabase) return "AI001";

  const { data } = await supabase
    .from("recipes")
    .select("code")
    .like("code", "AI%")
    .order("code", { ascending: false })
    .limit(1)
    .maybeSingle();

  const current = typeof data?.code === "string" ? Number(data.code.replace(/\D/g, "")) : 0;
  return `AI${String((Number.isFinite(current) ? current : 0) + 1).padStart(3, "0")}`;
}

async function generateAndStoreRecipes(style: string, count: number, startDate: string) {
  const supabase = getSupabase();
  if (!supabase || count <= 0) return [] as RecipeForPlan[];

  const rules = await loadFamilyRules();
  const { data: inventory } = await supabase
    .from("inventory_entries")
    .select("ingredient_name, quantity_remaining, unit, expiry_date, status")
    .order("expiry_date", { ascending: true });

  const expiring = ((inventory ?? []) as InventoryEntry[])
    .filter(isInventoryEntryUsable)
    .filter((entry) => isSoonExpiring(entry.expiry_date, startDate))
    .slice(0, 8);

  const client = getOpenAIClient();
  const generated: GeneratedRecipe[] = [];

  if (client) {
    const completion = await client.chat.completions.create({
      model: getAssistantModel(),
      messages: [
        {
          role: "system",
          content: [
            "Cria receitas familiares em portugues europeu e devolve apenas JSON.",
            "Formato: objeto com a chave recipes, contendo objetos com name, category, prep_time_min, cook_time_min, cost_level, notes, ingredients.",
            "Em notes escreve passos numerados curtos e suficientes para cozinhar a receita.",
            `Regras obrigatorias:\n${familyRulesText(rules)}`,
            `Estilo pretendido: ${recipeStyleLabel(style)}.`,
            `Ingredientes a priorizar quando fizer sentido: ${expiring.map((item) => item.ingredient_name).join(", ") || "nenhum"}`
          ].join("\n")
        },
        { role: "user", content: `Gera ${count} receita(s) novas para inserir na base de dados.` }
      ],
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message.content ?? "";
    const parsed = safeJsonArray(content);
    if (parsed.length > 0) generated.push(...parsed);
    else {
      try {
        const objectParsed = JSON.parse(content) as { recipes?: GeneratedRecipe[] };
        if (Array.isArray(objectParsed.recipes)) generated.push(...objectParsed.recipes);
      } catch {}
    }
  }

  if (generated.length === 0 && expiring.length > 0) {
    generated.push({
      name: `Prato simples de ${expiring[0].ingredient_name}`,
      category: "Aproveitamento",
      prep_time_min: 10,
      cook_time_min: 20,
      cost_level: "baixo",
      notes: `1. Preparar ${expiring[0].ingredient_name} e legumes disponiveis.\n2. Cozinhar ate ficar no ponto.\n3. Ajustar temperos no fim.`,
      ingredients: expiring.slice(0, 3).map((item) => ({
        ingredient_name: item.ingredient_name,
        quantity: 1,
        unit: item.unit,
        category: null
      }))
    });
  }

  const inserted: RecipeForPlan[] = [];

  for (const recipe of generated.slice(0, count)) {
    const code = await nextRecipeCode();
    const { data: insertedRecipe, error } = await supabase
      .from("recipes")
      .insert({
        code,
        name: recipe.name,
        category: recipe.category,
        status: "por_testar",
        prep_time_min: recipe.prep_time_min,
        cook_time_min: recipe.cook_time_min,
        cost_level: recipe.cost_level,
        notes: recipe.notes
      })
      .select("id, code, name, status, category, cost_level, prep_time_min, cook_time_min, notes")
      .single();

    if (error || !insertedRecipe) continue;

    const ingredients = (recipe.ingredients ?? []).filter((item) => item.ingredient_name).map((item) => ({
      recipe_id: insertedRecipe.id,
      ingredient_name: item.ingredient_name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category
    }));

    if (ingredients.length > 0) {
      await supabase.from("recipe_ingredients").insert(ingredients);
    }

    inserted.push(insertedRecipe as RecipeForPlan);
  }

  return inserted;
}

async function createShoppingListFromRecipeIds(recipeIds: string[], startDate?: string, endDate?: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured");

  if (recipeIds.length === 0) throw new Error("Seleciona pelo menos uma receita.");

  const recipeCounts = new Map<string, number>();
  for (const recipeId of recipeIds) {
    recipeCounts.set(recipeId, (recipeCounts.get(recipeId) ?? 0) + 1);
  }

  const { data: ingredients, error: ingredientsError } = await supabase
    .from("recipe_ingredients")
    .select("recipe_id, ingredient_name, quantity, unit, category")
    .in("recipe_id", Array.from(recipeCounts.keys()));

  if (ingredientsError) throw new Error(ingredientsError.message);

  const { data: inventory, error: inventoryError } = await supabase
    .from("inventory_entries")
    .select("ingredient_name, quantity_remaining, unit, expiry_date, status");

  if (inventoryError) throw new Error(inventoryError.message);

  const totals = new Map<string, ShoppingRow>();

  for (const ingredient of (ingredients ?? []) as RecipeIngredient[]) {
    const multiplier = recipeCounts.get(ingredient.recipe_id) ?? 1;
    const key = keyFor(ingredient.ingredient_name, ingredient.unit);
    const current = totals.get(key);
    const quantity = ingredient.quantity === null ? null : Number(ingredient.quantity) * multiplier;

    if (!current) {
      totals.set(key, {
        ingredient_name: ingredient.ingredient_name,
        planned_quantity: quantity,
        planned_unit: ingredient.unit ?? null,
        category: ingredient.category ?? null,
        purchased_status: "nao_comprado",
        notes: null
      });
      continue;
    }

    if (current.planned_quantity !== null && quantity !== null) {
      current.planned_quantity += quantity;
    } else {
      current.planned_quantity = null;
      current.notes = "Quantidade nao agregada automaticamente por falta de dados.";
    }
  }

  const inventoryTotals = new Map<string, number>();
  for (const entry of ((inventory ?? []) as InventoryEntry[]).filter(isInventoryEntryUsable)) {
    const key = keyFor(entry.ingredient_name, entry.unit);
    inventoryTotals.set(key, (inventoryTotals.get(key) ?? 0) + Number(entry.quantity_remaining ?? 0));
  }

  const shoppingRows: ShoppingRow[] = [];

  for (const row of Array.from(totals.values())) {
    if (row.planned_quantity === null || !row.planned_unit) {
      shoppingRows.push({ ...row, notes: row.notes ?? "Confirmar quantidade manualmente." });
      continue;
    }

    const available = inventoryTotals.get(keyFor(row.ingredient_name, row.planned_unit)) ?? 0;
    const missing = Math.max(row.planned_quantity - available, 0);

    if (missing <= 0) continue;

    shoppingRows.push({
      ...row,
      planned_quantity: missing,
      notes: available > 0 ? `Descontado inventario: ${available} ${row.planned_unit}.` : null
    });
  }

  await supabase
    .from("shopping_lists")
    .update({ status: "substituida" })
    .eq("status", "ativa");

  const { data: list, error: listError } = await supabase
    .from("shopping_lists")
    .insert({ start_date: startDate ?? null, end_date: endDate ?? null, status: "ativa" })
    .select("id")
    .single();

  if (listError) throw new Error(listError.message);
  if (!list) throw new Error("Nao foi possivel criar a lista de compras.");

  if (shoppingRows.length > 0) {
    const { error: itemsError } = await supabase
      .from("shopping_list_items")
      .insert(shoppingRows.map((row) => ({ ...row, shopping_list_id: list.id })));

    if (itemsError) throw new Error(itemsError.message);
  }

  revalidatePath("/shopping", "page");
  revalidatePath("/planner", "page");
}

export async function generateShoppingListFromRecipes(formData: FormData) {
  const recipeIds = formData.getAll("recipe_id").map((value) => text(value)).filter(Boolean);
  await createShoppingListFromRecipeIds(recipeIds);
  redirect("/shopping");
}

export async function addMealPlanEntry(formData: FormData) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured");

  const plannedDate = text(formData.get("planned_date"));
  const mealSlot = text(formData.get("meal_slot"));
  const recipeId = text(formData.get("recipe_id"));
  const notes = text(formData.get("notes"));

  if (!isDate(plannedDate)) throw new Error("Data invalida.");
  if (!mealSlots.includes(mealSlot)) throw new Error("Momento do dia invalido.");
  if (!recipeId) throw new Error("Escolhe uma receita.");

  const { error } = await supabase.from("meal_plan_entries").insert({
    planned_date: plannedDate,
    meal_slot: mealSlot,
    recipe_id: recipeId,
    notes: notes || null
  });

  if (error) throw new Error(error.message);

  revalidatePath("/planner", "page");
  redirect("/planner");
}

export async function removeMealPlanEntry(formData: FormData) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured");

  const entryId = text(formData.get("entry_id"));
  if (!entryId) throw new Error("Entrada invalida.");

  const { error } = await supabase.from("meal_plan_entries").delete().eq("id", entryId);
  if (error) throw new Error(error.message);

  revalidatePath("/planner", "page");
  redirect("/planner");
}

export async function generateMealPlan(formData: FormData) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured");

  const startDate = text(formData.get("start_date")) || today();
  const days = limitedNumber(formData.get("days"), 7, 1, 14);
  const slots = chosenMealSlots(formData);
  const replaceExisting = formData.get("replace_existing") === "on";
  const recipeStyle = text(formData.get("recipe_style")) || "simples";

  if (!isDate(startDate)) throw new Error("Data inicial invalida.");

  const endDate = addDays(startDate, days - 1);
  const rulesText = familyRulesText(await loadFamilyRules());
  const weeklyFishLimit = fishLimitFromRules(rulesText);

  if (replaceExisting) {
    const { error: deleteError } = await supabase
      .from("meal_plan_entries")
      .delete()
      .gte("planned_date", startDate)
      .lte("planned_date", endDate)
      .in("meal_slot", slots);

    if (deleteError) throw new Error(deleteError.message);
  }

  const { data: recipes, error: recipesError } = await supabase
    .from("recipes")
    .select("id, code, name, status, category, cost_level, prep_time_min, cook_time_min, notes")
    .neq("status", "rejeitada")
    .order("status", { ascending: true })
    .order("code", { ascending: true });

  if (recipesError) throw new Error(recipesError.message);

  const neededMeals = days * slots.length;
  const generatedRecipes = neededMeals > (recipes?.length ?? 0)
    ? await generateAndStoreRecipes(recipeStyle, Math.min(4, neededMeals - (recipes?.length ?? 0)), startDate)
    : [];

  const allRecipes = [...((recipes ?? []) as RecipeForPlan[]), ...generatedRecipes];
  if (allRecipes.length === 0) throw new Error("Nao ha receitas disponiveis para gerar plano.");

  const [ingredientsResult, recentPlanResult, inventoryResult] = await Promise.all([
    supabase
      .from("recipe_ingredients")
      .select("recipe_id, ingredient_name")
      .in("recipe_id", allRecipes.map((recipe) => recipe.id)),
    supabase
      .from("meal_plan_entries")
      .select("recipe_id, planned_date")
      .gte("planned_date", addDays(startDate, -30))
      .lt("planned_date", startDate),
    supabase
      .from("inventory_entries")
      .select("ingredient_name, quantity_remaining, unit, expiry_date, status")
      .order("expiry_date", { ascending: true })
  ]);

  const recentRecipeIds = new Set((recentPlanResult.data ?? []).map((entry: { recipe_id: string | null }) => entry.recipe_id).filter(Boolean));
  const expiringIngredients = new Set(
    ((inventoryResult.data ?? []) as InventoryEntry[])
      .filter(isInventoryEntryUsable)
      .filter((entry) => isSoonExpiring(entry.expiry_date, startDate))
      .map((entry) => normalize(entry.ingredient_name))
  );
  const expiringMatches = new Map<string, number>();

  for (const ingredient of (ingredientsResult.data ?? []) as RecipeIngredientForPlan[]) {
    if (expiringIngredients.has(normalize(ingredient.ingredient_name))) {
      expiringMatches.set(ingredient.recipe_id, (expiringMatches.get(ingredient.recipe_id) ?? 0) + 1);
    }
  }

  const candidates = allRecipes
    .sort((a, b) => {
      const expiringScore = (expiringMatches.get(b.id) ?? 0) - (expiringMatches.get(a.id) ?? 0);
      if (expiringScore !== 0) return expiringScore;
      const recentScore = Number(recentRecipeIds.has(a.id)) - Number(recentRecipeIds.has(b.id));
      if (recentScore !== 0) return recentScore;
      return styleRank(a, recipeStyle) - styleRank(b, recipeStyle)
        || statusRank(a.status) - statusRank(b.status)
        || a.code.localeCompare(b.code);
    });

  const rows: Array<{ planned_date: string; meal_slot: string; recipe_id: string; notes: string }> = [];
  let cursor = 0;
  let fishCount = 0;

  for (let day = 0; day < days; day += 1) {
    const plannedDate = addDays(startDate, day);

    for (const slot of slots) {
      let chosen = candidates[cursor % candidates.length];
      let foundCandidate = false;

      for (let attempts = 0; attempts < candidates.length; attempts += 1) {
        const candidate = candidates[(cursor + attempts) % candidates.length];
        const isFish = candidate.category.toLowerCase().includes("peixe");
        if (!isFish || fishCount < weeklyFishLimit || candidates.length <= 2) {
          chosen = candidate;
          cursor += attempts + 1;
          foundCandidate = true;
          break;
        }
      }

      if (!foundCandidate) cursor += 1;
      if (chosen.category.toLowerCase().includes("peixe")) fishCount += 1;

      rows.push({
        planned_date: plannedDate,
        meal_slot: slot,
        recipe_id: chosen.id,
        notes: `Plano gerado automaticamente (${recipeStyleLabel(recipeStyle)}).`
      });
    }
  }

  const { error } = await supabase.from("meal_plan_entries").insert(rows);
  if (error) throw new Error(error.message);

  revalidatePath("/planner", "page");
  redirect("/planner");
}

export async function generateShoppingListFromPlan(formData: FormData) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured");

  const startDate = text(formData.get("start_date"));
  const endDate = text(formData.get("end_date"));

  if (!isDate(startDate) || !isDate(endDate)) throw new Error("Intervalo invalido.");

  const { data: entries, error } = await supabase
    .from("meal_plan_entries")
    .select("recipe_id")
    .gte("planned_date", startDate)
    .lte("planned_date", endDate)
    .order("planned_date", { ascending: true });

  if (error) throw new Error(error.message);

  const recipeIds = (entries ?? [])
    .map((entry: { recipe_id: string | null }) => entry.recipe_id)
    .filter((recipeId): recipeId is string => Boolean(recipeId));

  await createShoppingListFromRecipeIds(recipeIds, startDate, endDate);
  redirect("/shopping");
}
