import { NextResponse } from "next/server";
import type { HiredSession } from "@/lib/altana/sessions";
import type { HireJob } from "@/lib/hire/types";
import {
  listHireJobs,
  listHireSessions,
  revokeHireSession,
  upsertHireJob,
  upsertHireSession,
} from "@/lib/ops/hires";

export async function GET() {
  return NextResponse.json({
    sessions: listHireSessions(),
    jobs: listHireJobs(),
  });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    session?: HiredSession;
    job?: HireJob;
    revoke?: { id: string; sig?: string | null };
  };
  if (body.revoke?.id) {
    const session = revokeHireSession(body.revoke.id, body.revoke.sig);
    return NextResponse.json({ session });
  }
  if (body.session) upsertHireSession(body.session);
  if (body.job) upsertHireJob(body.job);
  if (!body.session && !body.job) {
    return NextResponse.json({ error: "session, job, or revoke required" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
