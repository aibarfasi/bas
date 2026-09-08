import "server-only";
import { loadPersistedHires, persistHires } from "@/lib/admin/store";
import type { HiredSession } from "@/lib/altana/sessions";
import type { HireJob } from "@/lib/hire/types";

type HireMirror = {
  sessions: HiredSession[];
  jobs: HireJob[];
};

const g = globalThis as typeof globalThis & { __basHires?: HireMirror };

function bucket(): HireMirror {
  if (!g.__basHires) g.__basHires = loadPersistedHires();
  return g.__basHires;
}

function flush() {
  const b = bucket();
  persistHires(b.sessions, b.jobs);
}

export function upsertHireSession(session: HiredSession) {
  const b = bucket();
  b.sessions = [session, ...b.sessions.filter((s) => s.id !== session.id)].slice(0, 120);
  flush();
  return session;
}

export function upsertHireJob(job: HireJob) {
  const b = bucket();
  b.jobs = [job, ...b.jobs.filter((j) => j.id !== job.id)].slice(0, 120);
  flush();
  return job;
}

export function listHireSessions() {
  return bucket().sessions;
}

export function listHireJobs() {
  return bucket().jobs;
}

export function getHireSession(id: string) {
  return bucket().sessions.find((s) => s.id === id) ?? null;
}

export function revokeHireSession(id: string, sig?: string | null) {
  const b = bucket();
  const now = Math.floor(Date.now() / 1000);
  b.sessions = b.sessions.map((s) =>
    s.id === id
      ? { ...s, revokedAt: now, revokeSig: sig ?? s.revokeSig }
      : s,
  );
  flush();
  return b.sessions.find((s) => s.id === id) ?? null;
}

export function hireStats() {
  const sessions = listHireSessions();
  const jobs = listHireJobs();
  const now = Math.floor(Date.now() / 1000);
  return {
    sessions: sessions.length,
    active: sessions.filter((s) => !s.revokedAt && s.expiry > now).length,
    revoked: sessions.filter((s) => Boolean(s.revokedAt)).length,
    jobs: jobs.length,
    volumeUsd: jobs.reduce((n, j) => n + (j.paidUsd || 0), 0),
  };
}
