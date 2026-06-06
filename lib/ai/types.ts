export type AssistantInventoryItem = {
  ingredient_name: string;
  quantity: number;
  unit: string;
  category?: string;
  expiry_date?: string;
  storage_location?: string;
  notes?: string;
};

export type AssistantProposal =
  | {
      kind: "add_inventory_entries";
      summary: string;
      items: AssistantInventoryItem[];
    }
  | {
      kind: "mark_shopping_item_purchased";
      summary: string;
      item_id: string;
      purchased_quantity?: number;
      purchased_unit?: string;
    }
  | {
      kind: "create_meal_plan";
      summary: string;
      start_date: string;
      end_date: string;
      replace_existing: boolean;
      entries: Array<{
        planned_date: string;
        meal_slot: string;
        recipe_id: string;
        recipe_code: string;
        recipe_name: string;
        notes: string;
      }>;
    }
  | {
      kind: "answer";
      summary: string;
    };

export type AssistantResponse = {
  message: string;
  requiresConfirmation: boolean;
  logId: string | null;
  proposal: AssistantProposal;
};

export type AssistantActionStatus = "proposed" | "approved" | "rejected" | "executed" | "failed";
