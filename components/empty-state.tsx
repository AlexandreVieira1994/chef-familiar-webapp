export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed bg-white p-6 text-sm text-neutral-600">
      <h3 className="mb-1 font-semibold text-neutral-900">{title}</h3>
      <p>{description}</p>
    </div>
  );
}
