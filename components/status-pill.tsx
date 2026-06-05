const labels: Record<string, string> = {
  por_testar: "Por testar",
  aprovada: "Aprovada",
  neutra: "Neutra",
  a_melhorar: "A melhorar",
  rejeitada: "Rejeitada"
};

export function StatusPill({ value }: { value: string }) {
  return (
    <span className="inline-flex rounded-full bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-700">
      {labels[value] ?? value}
    </span>
  );
}
