"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/app/login/actions";
import { BrandLogo } from "@/components/brand-logo";

const links = [
  ["/", "Atención", "M12 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7V3Zm1 5v5l4 2-.8 1.6L11 14V8h2Z"],
  ["/inventario", "Inventario", "M4 5h7v7H4V5Zm9 0h7v7h-7V5ZM4 14h7v7H4v-7Zm9 0h7v7h-7v-7Z"],
  ["/unidades", "Patio", "M5 11 7 6h10l2 5v6h-2.2a2.2 2.2 0 0 1-4.2 0H11.4a2.2 2.2 0 0 1-4.2 0H5v-6Zm2.3-3 1 3h7.4l1-3H7.3Z"],
  ["/personas", "Personas", "M12 12a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 12 12Zm-7 8v-.8A5.2 5.2 0 0 1 10.2 14h3.6A5.2 5.2 0 0 1 19 19.2v.8Z"],
  ["/historial", "Historial", "M12 4a8 8 0 1 1-8 8H2l3.2-3.4L8.4 12H6a6 6 0 1 0 1.8-4.2L6.4 6.4A8 8 0 0 1 12 4Zm-1 4h2v5h4v2h-6V8Z"],
] as const;

export function Shell({
  name,
  children,
}: {
  name: string;
  path?: string;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const [going, setGoing] = useState<string | null>(null);

  useEffect(() => {
    setGoing(null);
  }, [path]);

  return (
    <div className="app">
      <aside className="side">
        <div className="side-head">
          <BrandLogo priority />
          <div className="side-user">
            <p className="eyebrow">Jefatura</p>
            <strong className="side-name">{name}</strong>
            <div className="muted side-place">Puerto Montt · Av. Cardonal</div>
          </div>
        </div>
        <nav>
          {links.map(([href, label, d]) => {
            const on = path === href;
            const busy = going === href && !on;
            return (
              <Link
                key={href}
                href={href}
                prefetch
                className={on ? "active" : busy ? "pending" : undefined}
                onClick={() => setGoing(href)}
              >
                <svg className="nav-ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d={d} />
                </svg>
                {label}
              </Link>
            );
          })}
        </nav>
        <form action={logout} className="side-logout">
          <button className="btn ghost" type="submit">
            Cerrar sesión
          </button>
        </form>
      </aside>
      <section className="main">{children}</section>
    </div>
  );
}
