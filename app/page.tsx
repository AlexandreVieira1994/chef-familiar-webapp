import Link from "next/link";
import { Card } from "@/components/card";
import { getSupabase } from "@/lib/supabase";

const steps = [
  {
    title: "1. Regista o que tens",
    text: "Atualiza o inventário por texto ou lote para a app saber o que já existe em casa.",
    href: "/inventory",
    action: "Abrir inventário"
  },
  {
    title: "2. Escolhe receitas",
    text: "Seleciona refeições compatíveis com as regras familiares e gera uma lista só com o que falta.",
    href: "/planner",
    action: "Planear semana"
  },
  {
    title: "3. Compra e confirma",
    text: "Marca itens comprados para eles entrarem no inventário automaticamente.",
    href: "/shopping",
    action: "Ver compras"
  }
];

const quickActions = [
  { label: "Adicionar ingredientes", href: "/inventory" },
  { label: "Avaliar receitas", href: "/recipes" },
  { label: "Rever regras", href: "/settings" }
];

type CalendarEntry = {
  id: string;
  planned_date: string;
  meal_slot: string;
  recipes: { code: string; name: string; category: string } | { code: string; name: string; category: string }[] | null;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDay(dateValue: string) {
  return new Date(`${dateValue}T00:00:00`).toLocaleDateString("pt-PT", {
    weekday: "short",
    day: "2-digit"
  });
}

function mealSlotLabel(value: string) {
  if (value === "pequeno_almoco") return "Pequeno-almoco";
  if (value === "almoco") return "Almoco";
  if (value === "lanche") return "Lanche";
  if (value === "jantar") return "Jantar";
  return value;
}

async function loadCalendarEntries() {
  const supabase = getSupabase();
  if (!supabase) return [] as CalendarEntry[];

  const startDate = today();
  const { data } = await supabase
    .from("meal_plan_entries")
    .select("id, planned_date, meal_slot, recipes(code, name, category)")
    .gte("planned_date", startDate)
    .lte("planned_date", addDays(startDate, 13))
    .order("planned_date", { ascending: true })
    .order("meal_slot", { ascending: true });

  return (data ?? []) as CalendarEntry[];
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const calendarEntries = await loadCalendarEntries();
  const entriesByDate = calendarEntries.reduce<Record<string, CalendarEntry[]>>((groups, entry) => {
    groups[entry.planned_date] = [...(groups[entry.planned_date] ?? []), entry];
    return groups;
  }, {});
  const calendarDays = Array.from({ length: 14 }, (_, index) => addDays(today(), index));

  return (
    <div className="space-y-8">
      <section className="grid gap-6 md:grid-cols-[minmax(0,1fr)_340px] md:items-stretch">
        <div className="rounded-lg border border-[#dce5dc] bg-white p-6 shadow-[0_18px_45px_rgba(33,48,38,0.07)] md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#b85c38]">Planeamento familiar</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight tracking-normal text-[#17211b] md:text-5xl">
            Cozinha semanal com inventário, regras familiares e compras no mesmo fluxo.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#647268]">
            Começa pelo que já tens em casa, escolhe receitas aprovadas e transforma o plano numa lista de compras
            prática para a família.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/planner"
              className="rounded-lg bg-[#2f6b4f] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#25563f]"
            >
              Criar plano
            </Link>
            <Link
              href="/inventory"
              className="rounded-lg border border-[#cdddcf] bg-white px-4 py-2.5 text-sm font-semibold text-[#17211b] transition hover:border-[#9dbfa4]"
            >
              Atualizar inventário
            </Link>
          </div>
        </div>

        <Card title="Atalhos" className="flex flex-col justify-between">
          <div className="space-y-3">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center justify-between rounded-lg border border-[#dfe8df] bg-white px-4 py-3 text-sm font-semibold text-[#17211b] transition hover:border-[#9dbfa4] hover:bg-[#f1f7f2]"
              >
                {action.label}
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-[#647268]">
            O assistente fixo no fundo também aceita frases naturais, como compras feitas ou perguntas sobre o que falta.
          </p>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {steps.map((step) => (
          <Card key={step.title} title={step.title}>
            <p className="min-h-20 text-sm leading-6 text-[#647268]">{step.text}</p>
            <Link
              href={step.href}
              className="mt-4 inline-flex rounded-lg border border-[#cdddcf] bg-white px-3 py-2 text-sm font-semibold text-[#17211b] transition hover:border-[#9dbfa4]"
            >
              {step.action}
            </Link>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card title="Plano atual">
          <p className="text-3xl font-bold text-[#17211b]">0</p>
          <p className="mt-1 text-sm text-[#647268]">Ainda sem plano ativo. Gera o primeiro plano no Planeador.</p>
        </Card>
        <Card title="Alertas de validade">
          <p className="text-3xl font-bold text-[#17211b]">0</p>
          <p className="mt-1 text-sm text-[#647268]">Ingredientes próximos da validade aparecerão aqui.</p>
        </Card>
        <Card title="Próxima ação">
          <p className="text-sm leading-6 text-[#647268]">
            Adiciona ingredientes ao inventário, escolhe receitas e gera a lista de compras.
          </p>
        </Card>
      </section>

      <Card title="Calendario de receitas">
        <div className="grid gap-3 md:grid-cols-7">
          {calendarDays.map((date) => {
            const entries = entriesByDate[date] ?? [];
            return (
              <section key={date} className="min-h-36 rounded-lg border border-[#dce5dc] bg-[#fbfdfb] p-3">
                <h3 className="text-xs font-semibold uppercase text-[#647268]">{formatDay(date)}</h3>
                <div className="mt-3 space-y-2">
                  {entries.map((entry) => {
                    const recipe = Array.isArray(entry.recipes) ? entry.recipes[0] : entry.recipes;
                    return (
                      <div key={entry.id} className="rounded-lg bg-white p-2 text-xs shadow-sm">
                        <p className="font-semibold text-[#2f6b4f]">{mealSlotLabel(entry.meal_slot)}</p>
                        {recipe ? (
                          <Link href={`/recipes/${recipe.code}`} className="mt-1 block font-medium text-[#17211b] underline-offset-2 hover:underline">
                            {recipe.name}
                          </Link>
                        ) : (
                          <p className="mt-1 text-neutral-500">Receita removida</p>
                        )}
                      </div>
                    );
                  })}
                  {entries.length === 0 && <p className="text-xs text-[#8a978e]">Sem receita</p>}
                </div>
              </section>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
