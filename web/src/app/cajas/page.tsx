import { CreateBoxForm } from "@/components/create-box-form";
import { Shell } from "@/components/shell";
import { requireManagement } from "@/lib/auth";
import { when } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CajasPage() {
  const { supabase, profile } = await requireManagement();
  const [{ data: boxes }, { data: lines }, { data: items }] = await Promise.all([
    supabase.from("boxes").select("*").order("created_at", { ascending: false }),
    supabase.from("box_lines").select("*"),
    supabase.from("items").select("sku,name").order("name"),
  ]);

  return (
    <Shell path="/cajas" name={profile.full_name}>
      <h1>Cajas de proveedor</h1>
      <p className="lead">Jefatura carga el packing list. Bodega solo escanea el código y sube el stock.</p>
      <div className="card">
        <CreateBoxForm items={items ?? []} />
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Barcode</th>
              <th>Proveedor</th>
              <th>Líneas</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {(boxes ?? []).map((b) => {
              const qty = (lines ?? []).filter((l) => l.box_id === b.id).reduce((s, l) => s + l.qty, 0);
              return (
                <tr key={b.id}>
                  <td>{b.code}</td>
                  <td>{b.barcode}</td>
                  <td>
                    {b.supplier} · {b.guide}
                  </td>
                  <td>{qty} u.</td>
                  <td className={b.received_at ? "ok" : "warn"}>
                    {b.received_at ? `Ingresada ${when(b.received_at)}` : "Pendiente en bodega"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
