export const recipeStatusLabels: Record<string, string> = {
  por_testar: "Por testar",
  aprovada: "Aprovada",
  neutra: "Neutra",
  a_melhorar: "A melhorar",
  rejeitada: "Rejeitada"
};

export function recipeStatusLabel(status: string) {
  return recipeStatusLabels[status] ?? status;
}
