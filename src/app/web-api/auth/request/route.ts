import { NextResponse } from "next/server";
import { d1Query } from "@/lib/d1";
import { RATE_LIMIT, rateLimit, getClientIp } from "@/lib/rate-limit";

interface RequestBody {
  name: string;
  email: string;
  reason: string;
}

export async function POST(req: Request) {
  // ── Rate limit: 2/hr per IP ─────────────────────────
  const ip = getClientIp(req);
  if (!ip) {
    return NextResponse.json(
      { error: "Unable to identify client" },
      { status: 403 },
    );
  }
  const rl = rateLimit(`request:${ip}`, RATE_LIMIT.request.limit, RATE_LIMIT.request.windowSeconds);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": "3600" } },
    );
  }

  const { name, email, reason } = (await req.json()) as RequestBody;

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email required" }, { status: 400 });
  }

  try {
    await d1Query(
      "INSERT INTO access_requests (name, email, reason) VALUES (?, ?, ?)",
      [name, email, reason || ""],
    );
  } catch (err) {
    console.error("request: D1 insert failed", err);
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
