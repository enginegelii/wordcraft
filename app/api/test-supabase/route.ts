import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json({
      ok: false,
      reason: "Env vars eksik",
      hasUrl: !!url,
      hasKey: !!key,
    });
  }

  try {
    const sb = createClient(url, key);
    const { data, error } = await sb.from("words").select("id").limit(1);
    return NextResponse.json({
      ok: !error,
      url: url.slice(0, 40) + "...",
      error: error?.message ?? null,
      wordCount: data?.length ?? 0,
    });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: String(e) });
  }
}
