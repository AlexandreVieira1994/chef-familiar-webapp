import { Card } from "@/components/card";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-neutral-600">Visão geral do plano familiar, inventário e próximas ações.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Plano atual">
          <p className="text-sm text-neutral-600">Ainda sem plano ativo. Gera o primeiro plano no Planeador.</p>
        </Card>
        <Card title="Alertas de validade">
          <p className="text-sm text-neutral-600">Ingredientes próximos da validade aparecerão aqui.</p>
        </Card>
        <Card title="Próxima ação">
          <p className="text-sm text-neutral-600">Adicionar receitas, atualizar inventário ou gerar lista de compras.</p>
        </Card>
      </div>
    </div>
  );
}
