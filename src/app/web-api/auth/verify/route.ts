import { NextResponse } from "next/server";
import { d1Query } from "@/lib/d1";

const COOKIE_NAME = "interview_me";
const MAX_USES = Number(process.env.MAX_CODE_USES || "5");

interface CodeRow {
  code: string;
  used_count: number;
}

export async function POST(req: Request) {
  const { code } = (await req.json()) as { code?: string };
  if (!code) {
    return NextResponse.json({ error: "Code required" }, { status: 400 });
  }

  // ── 1 query on the critical path ─────────────────────
  const rows = await d1Query<CodeRow>(
    "SELECT code, used_count FROM access_codes WHERE code = ?",
    [code],
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "Invalid code" }, { status: 401 });
  }

  if (rows[0].used_count >= MAX_USES) {
    return NextResponse.json({ error: "Code exhausted" }, { status: 401 });
  }

  // ── Set cookie, return immediately ───────────────────
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "1", {
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
