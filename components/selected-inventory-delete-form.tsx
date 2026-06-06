"use client";

type SelectedInventoryDeleteFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  formId: string;
};

export function SelectedInventoryDeleteForm({ action, formId }: SelectedInventoryDeleteFormProps) {
  return (
    <form
      id={formId}
      action={action}
      onSubmit={(event) => {
        const formData = new FormData(event.currentTarget);
        const selectedCount = formData.getAll("entry_id").length;

        if (selectedCount === 0) {
          event.preventDefault();
          window.alert("Seleciona pelo menos um ingrediente/lote para eliminar.");
          return;
        }

        if (!window.confirm(`Eliminar ${selectedCount} ingrediente(s)/lote(s) selecionado(s)?`)) {
          event.preventDefault();
        }
      }}
      className="flex flex-wrap items-center gap-3"
    >
      <button className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700" type="submit">
        Eliminar selecionados
      </button>
      <span className="text-xs text-neutral-500">Marca os lotes abaixo e confirma antes de eliminar.</span>
    </form>
  );
}
