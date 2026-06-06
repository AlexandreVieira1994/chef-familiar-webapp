import { getSupabase } from "@/lib/supabase";

export const defaultFamilyRules = [
  { rule_key: "family", rule_value: "2 adultos e 1 bebe de 6 meses em BLW" },
  { rule_key: "no_meat", rule_value: "Nao usar carne" },
  { rule_key: "fish_limit", rule_value: "Peixe no maximo 2 refeicoes por semana" },
  { rule_key: "dairy", rule_value: "Evitar leite e derivados tradicionais; preferir alternativas vegetais adequadas" },
  { rule_key: "blw_salt_sugar", rule_value: "Nunca adicionar sal ou acucar a preparacao principal da bebe" },
  { rule_key: "preferences", rule_value: "Evitar cogumelos, cebola, curgete, beringela e tofu visiveis; usar triturado ou removivel" }
];

export type FamilyRule = {
  rule_key: string;
  rule_value: string;
};

export async function loadFamilyRules(): Promise<FamilyRule[]> {
  const supabase = getSupabase();
  if (!supabase) return defaultFamilyRules;

  const { data, error } = await supabase
    .from("family_rules")
    .select("rule_key, rule_value")
    .order("rule_key", { ascending: true });

  if (error || !data || data.length === 0) return defaultFamilyRules;
  return data;
}

export function familyRulesText(rules: FamilyRule[]) {
  return rules.map((rule) => `- ${rule.rule_value}`).join("\n");
}
