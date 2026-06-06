import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const TYPES = new Set(["paper", "project", "model", "news", "podcast"]);

function clampScore(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
}

// GET /api/feedback?item_type=paper&item_id=2606.02060  → 取这条已有反馈(给组件回显)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const item_type = searchParams.get("item_type");
  const item_id = searchParams.get("item_id");
  if (!item_type || !item_id) {
    return NextResponse.json({ error: "missing item_type/item_id" }, { status: 400 });
  }
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("feedback")
    .select("*")
    .eq("item_type", item_type)
    .eq("item_id", item_id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ feedback: data });
}

// POST /api/feedback  body: { item_type, item_id, item_title?, pick_score?, quality_score?, hide?, note? }
// 按 (item_type, item_id) upsert;只覆盖传入的字段,其余沿用已有值。
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const item_type = String(body.item_type ?? "");
  const item_id = String(body.item_id ?? "");
  if (!TYPES.has(item_type) || !item_id) {
    return NextResponse.json({ error: "bad item_type/item_id" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data: existing } = await admin
    .from("feedback")
    .select("*")
    .eq("item_type", item_type)
    .eq("item_id", item_id)
    .maybeSingle();

  const row = {
    item_type,
    item_id,
    item_title: body.item_title !== undefined ? String(body.item_title) : existing?.item_title ?? null,
    pick_score: body.pick_score !== undefined ? clampScore(body.pick_score) : existing?.pick_score ?? null,
    quality_score: body.quality_score !== undefined ? clampScore(body.quality_score) : existing?.quality_score ?? null,
    hide: body.hide !== undefined ? Boolean(body.hide) : existing?.hide ?? false,
    note: body.note !== undefined ? (body.note === "" ? null : String(body.note)) : existing?.note ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await admin
    .from("feedback")
    .upsert(row, { onConflict: "item_type,item_id" })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ feedback: data });
}
