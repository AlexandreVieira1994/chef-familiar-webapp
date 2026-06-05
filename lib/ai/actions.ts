import { buildInventoryEntry, normalizeUnit } from "@/lib/ai/inventory-utils";
import type { AssistantActionStatus, AssistantProposal } from "@/lib/ai/types";
import { getSupabase } from "@/lib/supabase";

type AssistantLogRow = {
  id: string;
  user_message: string;
  interpreted_intent: string;
  proposed_payload: AssistantProposal;
  status: AssistantActionStatus;
  result: unknown;
  error: string | null;
};

export async function createAssistantActionLog(userMessage: string, proposal: AssistantProposal) {
  const supabase = getSupabase();
  if (!supabase || proposal.kind === "answer") return null;

  const { data, error } = await supabase
    .from("assistant_action_logs")
    .insert({
      user_message: userMessage,
      interpreted_intent: proposal.kind,
      proposed_payload: proposal,
      status: "proposed"
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data?.id ?? null;
}

export async function updateAssistantActionLog(
  id: string,
  status: AssistantActionStatus,
  result: unknown = null,
  error: string | null = null
) {
  const supabase = getSupabase();
  if (!supabase) return;

  await supabase
    .from("assistant_action_logs")
    .update({ status, result, error })
    .eq("id", id);
}

async function loadAssistantActionLog(id: string): Promise<AssistantLogRow> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured");

  const { data, error } = await supabase
    .from("assistant_action_logs")
    .select("id, user_message, interpreted_intent, proposed_payload, status, result, error")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Proposta não encontrada.");

  return data as AssistantLogRow;
}

export async function executeAssistantProposal(logId: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured");

  const log = await loadAssistantActionLog(logId);
  if (log.status !== "proposed") {
    throw new Error("Esta proposta já não está pendente.");
  }

  await updateAssistantActionLog(logId, "approved");
  const proposal = log.proposed_payload;

  try {
    if (proposal.kind === "add_inventory_entries") {
      const entries = proposal.items.map((item) => buildInventoryEntry(
        item.ingredient_name,
        item.quantity,
        item.unit,
        item.category,
        item.expiry_date,
        item.storage_location,
        item.notes,
        "Assistente"
      ));

      const { data, error } = await supabase
        .from("inventory_entries")
        .insert(entries)
        .select("id, ingredient_name, quantity_initial, unit");

      if (error) throw new Error(error.message);

      await updateAssistantActionLog(logId, "executed", data ?? []);
      return { ok: true, message: "Inventário atualizado.", result: data ?? [] };
    }

    if (proposal.kind === "mark_shopping_item_purchased") {
      const { data: item, error: itemError } = await supabase
        .from("shopping_list_items")
        .select("id, ingredient_name, planned_quantity, planned_unit, category, purchased_status, notes")
        .eq("id", proposal.item_id)
        .single();

      if (itemError) throw new Error(itemError.message);
      if (!item) throw new Error("Item da lista não encontrado.");
      if (item.purchased_status === "comprado") {
        await updateAssistantActionLog(logId, "executed", { alreadyPurchased: true });
        return { ok: true, message: "Esse item já estava marcado como comprado.", result: item };
      }

      const purchasedQuantity = proposal.purchased_quantity ?? Number(item.planned_quantity ?? 0);
      const purchasedUnit = normalizeUnit(proposal.purchased_unit || item.planned_unit || "un");

      if (!Number.isFinite(purchasedQuantity) || purchasedQuantity <= 0) {
        throw new Error("Quantidade comprada inválida.");
      }

      const entry = buildInventoryEntry(
        item.ingredient_name,
        purchasedQuantity,
        purchasedUnit,
        item.category ?? "",
        "",
        "",
        item.notes ? `Comprado via assistente. ${item.notes}` : "Comprado via assistente.",
        "Assistente"
      );

      const { data: inventoryEntry, error: inventoryError } = await supabase
        .from("inventory_entries")
        .insert(entry)
        .select("id")
        .single();

      if (inventoryError) throw new Error(inventoryError.message);

      const { error: updateError } = await supabase
        .from("shopping_list_items")
        .update({
          purchased_status: "comprado",
          purchased_quantity: purchasedQuantity,
          inventory_entry_id: inventoryEntry?.id ?? null
        })
        .eq("id", item.id);

      if (updateError) throw new Error(updateError.message);

      const result = { shoppingItemId: item.id, inventoryEntryId: inventoryEntry?.id ?? null };
      await updateAssistantActionLog(logId, "executed", result);
      return { ok: true, message: "Item marcado como comprado e adicionado ao inventário.", result };
    }

    throw new Error("Esta resposta não tem ação executável.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido.";
    await updateAssistantActionLog(logId, "failed", null, message);
    throw error;
  }
}

export async function rejectAssistantProposal(logId: string) {
  const log = await loadAssistantActionLog(logId);
  if (log.status !== "proposed") {
    throw new Error("Esta proposta já não está pendente.");
  }

  await updateAssistantActionLog(logId, "rejected");
  return { ok: true, message: "Proposta cancelada." };
}
