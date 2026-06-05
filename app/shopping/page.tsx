import { Card } from "@/components/card";

export default function ShoppingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Lista de Compras</h1>
        <p className="mt-2 text-neutral-600">Lista gerada a partir do plano alimentar e ajustada ao inventário.</p>
      </div>
      <Card title="Sem lista ativa">
        <p className="text-sm text-neutral-600">A lista será criada quando gerares o primeiro plano alimentar.</p>
      </Card>
    </div>
  );
}
