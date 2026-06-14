import { NextResponse } from "next/server";
import { d1Query } from "@/lib/d1";

interface RequestBody {
  name: string;
  email: string;
  reason: string;
}

export async function POST(req: Request) {
  const { name, email, reason } = (await req.json()) as RequestBody;

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email required" }, { status: 400 });
  }

  await d1Query(
    "INSERT INTO access_requests (name, email, reason) VALUES (?, ?, ?)",
    [name, email, reason || ""],
  );

  return NextResponse.json({ ok: true });
}
