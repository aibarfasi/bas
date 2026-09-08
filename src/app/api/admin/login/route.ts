import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminPassword,
  cookieOptions,
  signAdminToken,
  usesDefaultPassword,
} from "@/lib/admin/auth";

export async function GET() {
  return NextResponse.json({ defaultHint: usesDefaultPassword() });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { password?: string };
  if (!body.password || body.password !== adminPassword()) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, signAdminToken(), cookieOptions());
  return NextResponse.json({ ok: true });
}
