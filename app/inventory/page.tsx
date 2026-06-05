import { Card } from "@/components/card";

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inventário</h1>
        <p className="mt-2 text-neutral-600">Entradas de ingredientes, quantidades restantes, validade e local de armazenamento.</p>
      </div>
      <Card title="Regra principal">
        <p className="text-sm text-neutral-600">Cada compra/entrada deve criar uma linha nova. Não consolidar ingredientes repetidos.</p>
      </Card>
      <Card title="Próximo passo">
        <p className="text-sm text-neutral-600">Depois de ligar a Supabase, esta página passa a ler a tabela de inventário.</p>
      </Card>
    </div>
  );
}
