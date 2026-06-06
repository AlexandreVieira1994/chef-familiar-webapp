export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[#cdddcf] bg-white p-6 text-sm text-[#647268]">
      <h3 className="mb-1 font-semibold text-[#17211b]">{title}</h3>
      <p>{description}</p>
    </div>
  );
}
