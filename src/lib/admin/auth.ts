import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const ADMIN_COOKIE = "bas_admin";
export const DEFAULT_ADMIN_PASSWORD = "bas-admin";

export function adminPassword() {
  return process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
}

export function adminSecret() {
  return process.env.ADMIN_SECRET || `bas-admin-secret:${adminPassword()}`;
}

export function usesDefaultPassword() {
  return !process.env.ADMIN_PASSWORD;
}

export function signAdminToken() {
  return createHmac("sha256", adminSecret()).update("ok").digest("hex");
}

export function tokenValid(token?: string | null) {
  if (!token) return false;
  const expected = signAdminToken();
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function isAdminAuthed() {
  const jar = await cookies();
  return tokenValid(jar.get(ADMIN_COOKIE)?.value);
}

export async function requireAdmin() {
  if (await isAdminAuthed()) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  };
}
