import { Card } from "@/components/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Regras familiares</h1>
        <p className="mt-2 text-neutral-600">Preferências, restrições alimentares, BLW e limites semanais.</p>
      </div>
      <Card title="Regras iniciais">
        <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700">
          <li>Sem carne.</li>
          <li>Peixe no máximo 2 refeições por semana.</li>
          <li>Evitar leite e derivados tradicionais.</li>
          <li>Sem sal nem açúcar na preparação principal da bebé.</li>
          <li>Evitar comida indiana, picante e receitas gourmet complexas.</li>
          <li>Cogumelos, cebola, curgete, beringela e tofu só triturados, finos ou fáceis de remover.</li>
        </ul>
      </Card>
    </div>
  );
}
