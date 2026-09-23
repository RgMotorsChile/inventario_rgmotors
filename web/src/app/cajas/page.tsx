import { CreateBoxForm } from "@/components/create-box-form";
import { EvidenceThumbs } from "@/components/evidence-thumbs";
import { Shell } from "@/components/shell";
import { requireManagement } from "@/lib/auth";
import { loadBoxEvidence, signEvidencePaths } from "@/lib/evidence";
import { when } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CajasPage() {
  const { db, profile } = await requireManagement();
  const [{ data: boxes }, { data: lines }, { data: items }] = await Promise.all([
    db.from("boxes").select("*").order("created_at", { ascending: false }),
    db.from("box_lines").select("*"),
    db.from("items").select("sku,name").order("name"),
  ]);

  const boxList = boxes ?? [];
  const evidence = await loadBoxEvidence(boxList.map((b) => b.id));
  const signed = await signEvidencePaths(evidence.map((e) => e.storage_path));
  const evidenceByBox = new Map<string, string[]>();
  for (const e of evidence) {
    if (!e.box_id) continue;
    const url = signed.get(e.storage_path);
    if (!url) continue;
    const list = evidenceByBox.get(e.box_id) ?? [];
    list.push(url);
    evidenceByBox.set(e.box_id, list);
  }

  return (
    <Shell path="/cajas" name={profile.full_name}>
      <h1>Cajas de proveedor</h1>
      <p className="lead">Jefatura carga el packing list. Bodega solo escanea el código y sube el stock.</p>
      <div className="card">
        <CreateBoxForm items={(items ?? []) as { sku: string; name: string }[]} />
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
              <th>Evidencia</th>
            </tr>
          </thead>
          <tbody>
            {boxList.map((b) => {
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
                  <td>
                    <EvidenceThumbs urls={evidenceByBox.get(b.id) ?? []} />
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
