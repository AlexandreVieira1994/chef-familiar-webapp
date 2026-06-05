import { Card } from "@/components/card";

export default function PlannerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Planeador</h1>
        <p className="mt-2 text-neutral-600">Gera planos alimentares com opções, recomendação do chef, lista de compras e adaptação BLW.</p>
      </div>
      <Card title="Gerador de plano">
        <form className="grid gap-4 md:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Número de dias</span>
            <input className="w-full rounded-lg border px-3 py-2" type="number" defaultValue={7} min={1} max={14} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Refeições</span>
            <select className="w-full rounded-lg border px-3 py-2" defaultValue="almoco_jantar">
              <option value="almoco_jantar">Almoço + jantar</option>
              <option value="jantar">Só jantar</option>
              <option value="almoco">Só almoço</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Usar inventário</span>
            <select className="w-full rounded-lg border px-3 py-2" defaultValue="sim">
              <option value="sim">Sim</option>
              <option value="nao">Não</option>
            </select>
          </label>
          <button className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white md:col-span-3" type="button">
            Gerar plano com IA
          </button>
        </form>
        <p className="mt-4 text-sm text-neutral-600">A ligação à IA será ativada depois de configurarmos a chave API na Vercel.</p>
      </Card>
    </div>
  );
}
