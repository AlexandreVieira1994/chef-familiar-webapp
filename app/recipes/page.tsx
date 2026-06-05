import { Card } from "@/components/card";

const recipes = [
  { id: "RF001", name: "Arroz de feijão com cenoura e couve", type: "Vegetariana" },
  { id: "RF002", name: "Massa com molho de abóbora e lentilhas", type: "Vegan" },
  { id: "RF003", name: "Bacalhau espiritual adaptado sem leite", type: "Peixe" },
  { id: "RF004", name: "Gratinado de batata, brócolos e grão", type: "Vegan" }
];

export default function RecipesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Receitas</h1>
        <p className="mt-2 text-neutral-600">Base inicial de receitas familiares com adaptação BLW.</p>
      </div>
      <Card title="Receitas iniciais">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-neutral-500">
              <tr><th className="py-2 pr-4">ID</th><th className="py-2 pr-4">Receita</th><th className="py-2 pr-4">Tipo</th><th className="py-2 pr-4">Estado</th></tr>
            </thead>
            <tbody>
              {recipes.map((recipe) => (
                <tr key={recipe.id} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-mono text-xs">{recipe.id}</td>
                  <td className="py-3 pr-4 font-medium">{recipe.name}</td>
                  <td className="py-3 pr-4">{recipe.type}</td>
                  <td className="py-3 pr-4">Por testar</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
