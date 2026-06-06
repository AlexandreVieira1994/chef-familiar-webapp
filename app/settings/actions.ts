"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

function text(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function saveFamilyRules(formData: FormData) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured");

  const rules = text(formData.get("rules"))
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 30);

  if (rules.length === 0) throw new Error("Escreve pelo menos uma regra.");

  const { error: deleteError } = await supabase.from("family_rules").delete().neq("rule_key", "__never__");
  if (deleteError) throw new Error(deleteError.message);

  const { error } = await supabase.from("family_rules").insert(
    rules.map((rule_value, index) => ({
      rule_key: `custom_${String(index + 1).padStart(2, "0")}`,
      rule_value
    }))
  );

  if (error) throw new Error(error.message);

  revalidatePath("/settings", "page");
  revalidatePath("/planner", "page");
  redirect("/settings");
}
