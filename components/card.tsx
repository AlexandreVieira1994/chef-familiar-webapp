export function Card({
  title,
  children,
  className = ""
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-[#dce5dc] bg-white p-5 shadow-[0_14px_35px_rgba(33,48,38,0.06)] ${className}`}>
      <h2 className="mb-3 text-base font-semibold tracking-normal text-[#17211b]">{title}</h2>
      {children}
    </section>
  );
}
