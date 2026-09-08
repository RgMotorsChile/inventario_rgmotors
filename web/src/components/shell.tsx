import Link from "next/link";
import { logout } from "@/app/login/actions";

const links = [
  ["/", "Métricas"],
  ["/stock", "Stock"],
  ["/rastro", "Rastro"],
  ["/movimientos", "Movimientos"],
  ["/catalogo", "Catálogo"],
  ["/unidades", "Unidades"],
  ["/trabajadores", "Trabajadores"],
  ["/cajas", "Cajas"],
  ["/equipo", "Equipo"],
] as const;

export function Shell({
  path,
  name,
  children,
}: {
  path: string;
  name: string;
  children: React.ReactNode;
}) {
  return (
    <div className="app">
      <aside className="side">
        <img className="logo" src="/logo.png" alt="RG Motors" />
        <div>
          <div className="label muted">{name}</div>
          <strong>Jefatura</strong>
        </div>
        <nav>
          {links.map(([href, label]) => (
            <Link key={href} href={href} className={path === href ? "active" : undefined}>
              {label}
            </Link>
          ))}
        </nav>
        <form action={logout} style={{ marginTop: "auto" }}>
          <button className="btn ghost" type="submit">
            Cerrar sesión
          </button>
        </form>
      </aside>
      <section className="main">{children}</section>
    </div>
  );
}
