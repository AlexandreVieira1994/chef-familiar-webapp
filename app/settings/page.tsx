import { Card } from "@/components/card";
import { familyRulesText, loadFamilyRules } from "@/lib/family-rules";
import { isSupabaseConfigured } from "@/lib/supabase";
import { saveFamilyRules } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SettingsPage() {
  const rules = await loadFamilyRules();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Regras familiares</h1>
        <p className="mt-2 text-neutral-600">
          Preferencias, restricoes alimentares, BLW e limites semanais usados pelo assistente e pelo planeador automatico.
        </p>
      </div>

      {!isSupabaseConfigured() && (
        <Card title="Supabase ainda nao configurada">
          <p className="text-sm text-neutral-600">
            As regras podem ser revistas aqui, mas so ficam guardadas quando a Supabase estiver configurada.
          </p>
        </Card>
      )}

      <Card title="Regras usadas pela IA">
        <form action={saveFamilyRules} className="space-y-4">
          <label className="block text-sm font-medium">
            Uma regra por linha
            <textarea
              name="rules"
              className="mt-2 min-h-64 w-full rounded-lg border border-[#cdddcf] px-3 py-3 text-sm leading-6"
              defaultValue={familyRulesText(rules).replace(/^- /gm, "")}
            />
          </label>
          <button className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white" type="submit">
            Guardar regras
          </button>
        </form>
      </Card>
    </div>
  );
}
