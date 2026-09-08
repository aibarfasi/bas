import { NextResponse } from "next/server";
import { isAdminAuthed, usesDefaultPassword } from "@/lib/admin/auth";

export async function GET() {
  const ok = await isAdminAuthed();
  if (!ok) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, defaultPassword: usesDefaultPassword() });
}
