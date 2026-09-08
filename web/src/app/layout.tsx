import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RG Motors · Jefatura inventario",
  description: "Panel de jefatura: stock, rastro, alertas y Excel.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
