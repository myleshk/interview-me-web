import { NextResponse } from "next/server";
import { d1Query } from "@/lib/d1";

const COOKIE_NAME = "interview_me";

interface AccessCode {
  code: string;
  max_uses: number | null;
  used_count: number;
}

export async function POST(req: Request) {
  const { code } = (await req.json()) as { code?: string };
  if (!code) {
    return NextResponse.json({ error: "Code required" }, { status: 400 });
  }

  const rows = await d1Query<AccessCode>(
    "SELECT code, max_uses, used_count FROM access_codes WHERE code = ?",
    [code],
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "Invalid code" }, { status: 401 });
  }

  const entry = rows[0];

  // Check usage limit
  if (entry.max_uses !== null && entry.used_count >= entry.max_uses) {
    return NextResponse.json({ error: "Code expired" }, { status: 401 });
  }

  // Increment usage
  await d1Query(
    "UPDATE access_codes SET used_count = used_count + 1 WHERE code = ?",
    [code],
  );

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "1", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });

  return res;
}
