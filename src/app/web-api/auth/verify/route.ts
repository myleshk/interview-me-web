import { NextResponse } from "next/server";
import { d1Query } from "@/lib/d1";
import { RATE_LIMIT, rateLimit, getClientIp } from "@/lib/rate-limit";

const COOKIE_NAME = "interview_me";
const MAX_USES = Number(process.env.MAX_CODE_USES || "5");

interface CodeRow {
  code: string;
  used_count: number;
}

export async function POST(req: Request) {
  // ── Rate limit: 5/min per IP ────────────────────────
  const ip = getClientIp(req);
  if (!ip) {
    return NextResponse.json(
      { error: "Unable to identify client" },
      { status: 403 },
    );
  }
  const rl = rateLimit(`verify:${ip}`, RATE_LIMIT.verify.limit, RATE_LIMIT.verify.windowSeconds);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  const { code } = (await req.json()) as { code?: string };
  if (!code) {
    return NextResponse.json({ error: "Code required" }, { status: 400 });
  }

  // ── 1 query on the critical path ─────────────────────
  let rows: CodeRow[];
  try {
    rows = await d1Query<CodeRow>(
      "SELECT code, used_count FROM access_codes WHERE code = ?",
      [code],
    );
  } catch (err) {
    console.error("verify: D1 query failed", err);
    return NextResponse.json({ error: "Service unavailable" }, { status: 500 });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "Invalid code" }, { status: 401 });
  }

  if (rows[0].used_count >= MAX_USES) {
    return NextResponse.json({ error: "Code exhausted" }, { status: 401 });
  }

  // ── Set cookie, return immediately ───────────────────
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, crypto.randomUUID(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });

  // ── Fire-and-forget: log + update counter ────────────
  d1Query("INSERT INTO access_code_usage (code) VALUES (?)", [code]).catch(
    (err) => console.error("verify: failed to log usage", err),
  );
  d1Query(
    "UPDATE access_codes SET used_count = used_count + 1 WHERE code = ?",
    [code],
  ).catch((err) => console.error("verify: failed to update counter", err));

  return res;
}
