import Link from "next/link";
import { Card } from "@/components/card";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  addMealPlanEntry,
  generateMealPlan,
  generateShoppingListFromPlan,
  removeMealPlanEntry
} from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Recipe = {
  id: string;
  code: string;
  name: string;
  status: string;
  category: string;
};

type PlanEntry = {
  id: string;
  planned_date: string;
  meal_slot: string;
  notes: string | null;
  recipes: Recipe | null;
};

type PlanEntryRow = Omit<PlanEntry, "recipes"> & {
  recipes: Recipe | Recipe[] | null;
};

const mealSlotOptions = [
  { value: "pequeno_almoco", label: "Pequeno-almoco" },
  { value: "almoco", label: "Almoco" },
  { value: "lanche", label: "Lanche" },
  { value: "jantar", label: "Jantar" }
];

const recipeStyleOptions = [
  { value: "simples", label: "Mais simples" },
  { value: "requintadas", label: "Mais requintadas" },
  { value: "arrojadas", label: "Mais arrojadas" },
  { value: "aproveitamento", label: "Aproveitar validade" }
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDate(dateValue: string) {
  return new Date(`${dateValue}T00:00:00`).toLocaleDateString("pt-PT", {
    weekday: "short",
    day: "2-digit",
    month: "short"
  });
}

function mealSlotLabel(value: string) {
  return mealSlotOptions.find((slot) => slot.value === value)?.label ?? value;
}

async function loadRecipes(): Promise<Recipe[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("recipes")
    .select("id, code, name, status, category")
    .neq("status", "rejeitada")
    .order("status", { ascending: true })
    .order("code", { ascending: true });
  return data ?? [];
}

async function loadPlanEntries(startDate: string, endDate: string): Promise<PlanEntry[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("meal_plan_entries")
    .select("id, planned_date, meal_slot, notes, recipes(id, code, name, status, category)")
    .gte("planned_date", startDate)
    .lte("planned_date", endDate)
    .order("planned_date", { ascending: true })
    .order("meal_slot", { ascending: true })
    .order("created_at", { ascending: true });
  return ((data ?? []) as PlanEntryRow[]).map((entry) => ({
    ...entry,
    recipes: Array.isArray(entry.recipes) ? entry.recipes[0] ?? null : entry.recipes
  }));
}

export default async function PlannerPage() {
  const startDate = today();
  const endDate = addDays(startDate, 13);
  const [recipes, planEntries] = await Promise.all([
    loadRecipes(),
    loadPlanEntries(startDate, endDate)
  ]);

  const entriesByDate = planEntries.reduce<Record<string, PlanEntry[]>>((groups, entry) => {
    groups[entry.planned_date] = [...(groups[entry.planned_date] ?? []), entry];
    return groups;
  }, {});

  const plannedDates = Array.from(new Set(planEntries.map((entry) => entry.planned_date)));
  const shoppingStartDate = planEntries[0]?.planned_date ?? startDate;
  const shoppingEndDate = planEntries[planEntries.length - 1]?.planned_date ?? addDays(startDate, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Planeador</h1>
          <p className="mt-2 max-w-2xl text-neutral-600">
            Organiza refeicoes por data e momento do dia, ou pede um plano automatico simples para os proximos dias.
          </p>
        </div>
        <form action={generateShoppingListFromPlan} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="start_date" value={shoppingStartDate} />
          <input type="hidden" name="end_date" value={shoppingEndDate} />
          <button
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-neutral-300"
            type="submit"
            disabled={planEntries.length === 0}
          >
            Gerar compras do plano
          </button>
        </form>
      </div>

      {!isSupabaseConfigured() && (
        <Card title="Supabase ainda nao configurada">
          <p className="text-sm text-neutral-600">Adiciona as variaveis da Supabase para guardar e carregar planos reais.</p>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-[#dce5dc] bg-white p-4">
          <p className="text-xs font-medium uppercase text-neutral-500">Refeicoes planeadas</p>
          <p className="mt-1 text-2xl font-bold">{planEntries.length}</p>
        </div>
        <div className="rounded-lg border border-[#dce5dc] bg-white p-4">
          <p className="text-xs font-medium uppercase text-neutral-500">Dias cobertos</p>
          <p className="mt-1 text-2xl font-bold">{plannedDates.length}</p>
        </div>
        <div className="rounded-lg border border-[#dce5dc] bg-white p-4">
          <p className="text-xs font-medium uppercase text-neutral-500">Receitas disponiveis</p>
          <p className="mt-1 text-2xl font-bold">{recipes.length}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Pedir plano automatico">
          <form action={generateMealPlan} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Data inicial
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  type="date"
                  name="start_date"
                  defaultValue={startDate}
                />
              </label>
              <label className="text-sm font-medium">
                Duracao
                <select name="days" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" defaultValue="7">
                  <option value="3">3 dias</option>
                  <option value="5">5 dias</option>
                  <option value="7">7 dias</option>
                  <option value="14">14 dias</option>
                </select>
              </label>
            </div>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Momentos do dia</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {mealSlotOptions.map((slot) => (
                  <label key={slot.value} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      name="meal_slot"
                      value={slot.value}
                      defaultChecked={slot.value === "almoco" || slot.value === "jantar"}
                    />
                    {slot.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="block text-sm font-medium">
              Tipo de receitas
              <select name="recipe_style" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" defaultValue="simples">
                {recipeStyleOptions.map((style) => (
                  <option key={style.value} value={style.value}>{style.label}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-neutral-600">
              <input type="checkbox" name="replace_existing" defaultChecked />
              Substituir plano existente nesse intervalo
            </label>
            <button className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white" type="submit">
              Gerar plano
            </button>
          </form>
        </Card>

        <Card title="Fazer do zero">
          <form action={addMealPlanEntry} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Data
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  type="date"
                  name="planned_date"
                  defaultValue={startDate}
                />
              </label>
              <label className="text-sm font-medium">
                Momento
                <select name="meal_slot" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" defaultValue="jantar">
                  {mealSlotOptions.map((slot) => (
                    <option key={slot.value} value={slot.value}>{slot.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block text-sm font-medium">
              Receita
              <select name="recipe_id" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" defaultValue="">
                <option value="" disabled>Escolher receita</option>
                {recipes.map((recipe) => (
                  <option key={recipe.id} value={recipe.id}>
                    {recipe.code} - {recipe.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Nota simples
              <input
                name="notes"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Ex.: fazer dose dupla, usar sobras, levar para marmita"
              />
            </label>
            <button className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white" type="submit">
              Adicionar ao plano
            </button>
          </form>
        </Card>
      </div>

      <Card title="Plano dos proximos dias">
        {planEntries.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Ainda nao ha refeicoes planeadas. Gera um plano automatico ou adiciona a primeira refeicao manualmente.
          </p>
        ) : (
          <div className="space-y-5">
            {Object.entries(entriesByDate).map(([date, entries]) => (
              <section key={date} className="border-b pb-4 last:border-0 last:pb-0">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-[#17211b]">{formatDate(date)}</h2>
                  <span className="rounded-lg bg-[#edf5ef] px-2 py-1 text-xs font-medium text-[#2f6b4f]">
                    {entries.length} refeicao{entries.length === 1 ? "" : "es"}
                  </span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {entries.map((entry) => (
                    <div key={entry.id} className="rounded-lg border border-[#dce5dc] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium uppercase text-neutral-500">{mealSlotLabel(entry.meal_slot)}</p>
                          {entry.recipes ? (
                            <Link
                              href={`/recipes/${entry.recipes.code}`}
                              className="mt-1 block font-medium underline-offset-2 hover:underline"
                            >
                              {entry.recipes.name}
                            </Link>
                          ) : (
                            <p className="mt-1 font-medium">Receita removida</p>
                          )}
                          {entry.recipes && (
                            <p className="text-xs text-neutral-500">{entry.recipes.code} - {entry.recipes.category}</p>
                          )}
                        </div>
                        <form action={removeMealPlanEntry}>
                          <input type="hidden" name="entry_id" value={entry.id} />
                          <button className="rounded-lg border px-2 py-1 text-xs font-medium text-neutral-600" type="submit">
                            Remover
                          </button>
                        </form>
                      </div>
                      {entry.notes && <p className="mt-3 text-sm text-neutral-600">{entry.notes}</p>}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
