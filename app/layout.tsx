import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/components/navigation";

export const metadata: Metadata = {
  title: "Chef Familiar",
  description: "Planeamento alimentar familiar com BLW, inventário e lista de compras"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body>
        <div className="min-h-screen">
          <Navigation />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
