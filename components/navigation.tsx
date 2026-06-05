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
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold">Chef Familiar</Link>
        <nav className="flex flex-wrap gap-3 text-sm">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-full px-3 py-1 hover:bg-neutral-100">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
