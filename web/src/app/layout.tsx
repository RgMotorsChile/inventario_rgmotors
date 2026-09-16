import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { InstallAccess } from "@/components/install-access";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Inventario RG · Jefatura",
  description: "Panel de jefatura: stock, rastro, alertas y Excel.",
  applicationName: "Inventario RG",
  appleWebApp: {
    capable: true,
    title: "Inventario RG",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: "/favicon.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#07080C",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className={inter.className}>
        {children}
        <InstallAccess />
      </body>
    </html>
  );
}
