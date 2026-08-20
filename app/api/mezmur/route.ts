// Handles writes to the mezmur table. Public reads go straight from the
// browser to Supabase's REST API using the anon key (safe, read-only via
// RLS — see lib/supabase.ts). Writes come through here so the admin
// password check and the privileged service-role key stay server-side.

import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

function baseHeaders() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
  };
}

function checkPassword(req: NextRequest): NextResponse | null {
  const password = req.headers.get("x-admin-password");
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

// GET isn't a supported write, but the password check runs before the
// method check — the admin page's "verify password" call relies on that:
// a wrong password still 401s, a right one falls through to a harmless
// 405, with no data touched either way.
export async function GET(req: NextRequest) {
  const unauthorized = checkPassword(req);
  if (unauthorized) return unauthorized;
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function POST(req: NextRequest) {
  const unauthorized = checkPassword(req);
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json().catch(() => ({}));
    const { title, topics, speed, language, length, lyrics, media_url } = body;
    if (
      !title ||
      !Array.isArray(topics) ||
      topics.length === 0 ||
      !speed ||
      !language ||
      !length ||
      !lyrics
    ) {
      return NextResponse.json(
        { error: "Missing required fields (topics must be a non-empty array)" },
        { status: 400 }
      );
    }
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/mezmur`, {
      method: "POST",
      headers: { ...baseHeaders(), Prefer: "return=representation" },
      body: JSON.stringify({ title, topics, speed, language, length, lyrics, media_url: media_url || null }),
    });
    const data = await resp.json();
    return NextResponse.json(data, { status: resp.ok ? 201 : resp.status });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const unauthorized = checkPassword(req);
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json().catch(() => ({}));
    const { id, ...fields } = body;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/mezmur?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { ...baseHeaders(), Prefer: "return=representation" },
      body: JSON.stringify(fields),
    });
    const data = await resp.json();
    return NextResponse.json(data, { status: resp.ok ? 200 : resp.status });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const unauthorized = checkPassword(req);
  if (unauthorized) return unauthorized;

  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/mezmur?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: baseHeaders(),
    });
    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      return NextResponse.json(data, { status: resp.status });
    }
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
