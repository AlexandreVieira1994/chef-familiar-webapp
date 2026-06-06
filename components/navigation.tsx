import Link from "next/link";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/recipes", label: "Receitas" },
  { href: "/planner", label: "Planeador" },
  { href: "/shopping", label: "Compras" },
  { href: "/inventory", label: "Inventário" },
  { href: "/settings", label: "Regras" }
];

export function Navigation() {
  return (
    <header className="sticky top-0 z-30 border-b border-[#dce5dc] bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="flex items-center gap-3 text-xl font-bold tracking-normal text-[#17211b]">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2f6b4f] text-sm font-black text-white shadow-sm">
            CF
          </span>
          <span>Chef Familiar</span>
        </Link>
        <nav className="flex gap-2 overflow-x-auto pb-1 text-sm md:flex-wrap md:overflow-visible md:pb-0">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap rounded-lg px-3 py-2 font-medium text-[#56645c] transition hover:bg-[#edf5ef] hover:text-[#17211b]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
