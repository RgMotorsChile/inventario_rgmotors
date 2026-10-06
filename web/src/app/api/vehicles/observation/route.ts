import { NextResponse } from "next/server";
import { requireManagementApi } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/client";

const BUCKET = "vehicle-notes";
const TENANT = "rg-motors";
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  const session = await requireManagementApi();
  if (!session.ok) return session.response;

  const form = await req.formData();
  const vehicleId = String(form.get("vehicleId") ?? "").trim();
  const note = String(form.get("note") ?? "");
  const audio = form.get("audio");

  if (!vehicleId || !UUID.test(vehicleId)) {
    return NextResponse.json({ error: "Falta la unidad" }, { status: 400 });
  }

  const sb = createServerSupabase();
  const { data: current, error: loadError } = await sb
    .from("vehicles")
    .select("id,note_audio_path")
    .eq("id", vehicleId)
    .maybeSingle();
  if (loadError || !current) {
    return NextResponse.json({ error: "Unidad no encontrada" }, { status: 404 });
  }

  const clearAudio = !note.trim() && !(audio instanceof File && audio.size > 0);
  let audioPath: string | null = null;

  if (audio instanceof File && audio.size > 0) {
    const ext = audio.name.toLowerCase().endsWith(".ogg") ? "ogg" : "webm";
    audioPath = `${TENANT}/${vehicleId}/${Date.now()}.${ext}`;
    const { error } = await sb.storage.from(BUCKET).upload(audioPath, audio, {
      contentType: audio.type || "audio/webm",
      upsert: false,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const { data, error } = await sb.rpc("save_vehicle_observation", {
    p_vehicle_id: vehicleId,
    p_note: note,
    p_audio_path: audioPath,
    p_clear_audio: clearAudio,
  });
  if (error) {
    if (audioPath) {
      await sb.storage.from(BUCKET).remove([audioPath]);
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const staleAudio =
    (clearAudio && current.note_audio_path) ||
    (audioPath && current.note_audio_path && current.note_audio_path !== audioPath)
      ? String(current.note_audio_path)
      : null;
  if (staleAudio) {
    await sb.storage.from(BUCKET).remove([staleAudio]);
  }

  return NextResponse.json({
    ok: true,
    vehicle: data,
    savedBy: session.profile.full_name,
  });
}
