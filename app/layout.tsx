import type { Metadata } from "next";
import "./globals.css";
import { AssistantBar } from "@/components/assistant-bar";
import { Navigation } from "@/components/navigation";

export const metadata: Metadata = {
  title: "Chef Familiar",
  description: "Planeamento alimentar familiar com BLW, inventário e lista de compras"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body>
        <div className="min-h-screen pb-44 md:pb-32">
          <Navigation />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          <AssistantBar />
        </div>
      </body>
    </html>
  );
}
