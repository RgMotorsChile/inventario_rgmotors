import { createServerSupabase } from "@/lib/supabase/client";

const BUCKET = "box-evidence";
const SIGNED_TTL_SEC = 60 * 60; // 1 h

export type EvidenceRow = {
  id: string;
  storage_path: string;
  created_at?: string;
  box_id?: string;
  movement_id?: string | null;
  item_sku?: string;
};

/** Genera URLs firmadas para paths del bucket box-evidence. */
export async function signEvidencePaths(
  paths: string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const unique = [...new Set(paths.filter(Boolean))];
  if (unique.length === 0) return out;

  const sb = createServerSupabase();
  await Promise.all(
    unique.map(async (path) => {
      const { data, error } = await sb.storage
        .from(BUCKET)
        .createSignedUrl(path, SIGNED_TTL_SEC);
      if (!error && data?.signedUrl) out.set(path, data.signedUrl);
    }),
  );
  return out;
}

export async function loadReceivePhotos(movementIds: string[]): Promise<EvidenceRow[]> {
  if (movementIds.length === 0) return [];
  const sb = createServerSupabase();
  const { data } = await sb
    .from("receive_photos")
    .select("id, storage_path, created_at, movement_id, item_sku")
    .in("movement_id", movementIds)
    .order("created_at", { ascending: false });
  return (data as EvidenceRow[]) ?? [];
}
