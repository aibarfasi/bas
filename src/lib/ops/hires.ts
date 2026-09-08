import "server-only";
import { getSettings, hydrateFromSql, loadPersistedHires, persistHires } from "@/lib/admin/store";
import { grantCommitment, revokeCommitment } from "@/lib/altana/hash";
import {
  makeEvent,
  normalizeSession,
  type HiredSession,
  type SessionEvent,
} from "@/lib/altana/sessions";
import type { HireJob } from "@/lib/hire/types";

type HireMirror = {
  sessions: HiredSession[];
  jobs: HireJob[];
};

const g = globalThis as typeof globalThis & { __basHires?: HireMirror };

function bucket(): HireMirror {
  if (!g.__basHires) {
    const loaded = loadPersistedHires();
    g.__basHires = {
      sessions: loaded.sessions.map(normalizeSession),
      jobs: loaded.jobs,
    };
  }
  return g.__basHires;
}

function flush() {
  const b = bucket();
  persistHires(b.sessions, b.jobs);
}

export async function hydrateHires() {
  await hydrateFromSql();
  const loaded = loadPersistedHires();
  if (!g.__basHires || (!g.__basHires.sessions.length && loaded.sessions.length)) {
    g.__basHires = {
      sessions: loaded.sessions.map(normalizeSession),
      jobs: loaded.jobs,
    };
  }
}

function withDeploy(session: HiredSession): HiredSession {
  const dep = getSettings().deployments[session.agentId];
  const next = normalizeSession({
    ...session,
    grantTx: session.grantTx ?? dep?.grantTx ?? null,
    revokeTx: session.revokeTx ?? dep?.revokeTx ?? null,
  });
  if (!next.grantHash) next.grantHash = grantCommitment(next);
  return next;
}

export function upsertHireSession(session: HiredSession) {
  const b = bucket();
  const next = withDeploy(session);
  b.sessions = [next, ...b.sessions.filter((s) => s.id !== next.id)].slice(0, 120);
  flush();
  return next;
}

export function upsertHireJob(job: HireJob) {
  const b = bucket();
  b.jobs = [job, ...b.jobs.filter((j) => j.id !== job.id)].slice(0, 120);
  flush();
  return job;
}

export function listHireSessions() {
  return bucket().sessions.map(normalizeSession);
}

export function listHireJobs() {
  return bucket().jobs;
}

export function getHireSession(id: string) {
  const found = bucket().sessions.find((s) => s.id === id);
  return found ? normalizeSession(found) : null;
}

export function getHireJob(sessionId: string) {
  return bucket().jobs.find((j) => j.sessionId === sessionId) ?? null;
}

export function patchHireSession(id: string, patch: Partial<HiredSession>) {
  const b = bucket();
  const cur = b.sessions.find((s) => s.id === id);
  if (!cur) return null;
  const next = withDeploy({ ...normalizeSession(cur), ...patch, id });
  b.sessions = b.sessions.map((s) => (s.id === id ? next : s));
  flush();
  return next;
}

export function appendSessionEvent(id: string, event: SessionEvent) {
  const cur = getHireSession(id);
  if (!cur) return null;
  return patchHireSession(id, { events: [...cur.events, event] });
}

export function revokeHireSession(id: string, sig?: string | null) {
  const cur = getHireSession(id);
  if (!cur) return null;
  const now = Math.floor(Date.now() / 1000);
  const next: HiredSession = {
    ...cur,
    revokedAt: now,
    revokeSig: sig ?? cur.revokeSig,
  };
  next.revokeHash = revokeCommitment(next);
  next.events = [
    ...next.events,
    makeEvent("revoke", "Session revoked", sig ? "Signed kill switch" : "Demo revoke"),
  ];
  return patchHireSession(id, next);
}

export function renewHireSession(id: string, hours: number) {
  const cur = getHireSession(id);
  if (!cur || cur.revokedAt || cur.disputedAt) return null;
  const add = Math.max(1, Math.min(168, hours)) * 3600;
  const base = Math.max(cur.expiry, Math.floor(Date.now() / 1000));
  return patchHireSession(id, {
    expiry: base + add,
    renewCount: cur.renewCount + 1,
    events: [
      ...cur.events,
      makeEvent("renew", "Session extended", `+${hours}h · expiry ${new Date((base + add) * 1000).toISOString()}`),
    ],
  });
}

export function topupHireSession(id: string, extraCap: string) {
  const cur = getHireSession(id);
  if (!cur || cur.revokedAt || cur.disputedAt) return null;
  const nextCap = (Number(cur.spendCap) + Number(extraCap)).toString();
  if (!Number.isFinite(Number(nextCap))) return null;
  return patchHireSession(id, {
    spendCap: nextCap,
    events: [
      ...cur.events,
      makeEvent("topup", "Cap raised", `${cur.spendCap} → ${nextCap} ${cur.spendToken}`),
    ],
  });
}

export function disputeHireSession(id: string, reason: string, sig?: string | null) {
  const cur = getHireSession(id);
  if (!cur) return null;
  const now = Math.floor(Date.now() / 1000);
  const next: HiredSession = {
    ...cur,
    disputedAt: now,
    disputeReason: reason,
    revokedAt: cur.revokedAt ?? now,
    revokeSig: sig ?? cur.revokeSig,
  };
  next.revokeHash = revokeCommitment(next);
  next.events = [
    ...next.events,
    makeEvent("dispute", "Dispute opened", reason),
    makeEvent("kill", "Kill switch", "Authority pulled. Agent cannot spend."),
  ];
  return patchHireSession(id, next);
}

export function hireStats() {
  const sessions = listHireSessions();
  const jobs = listHireJobs();
  const now = Math.floor(Date.now() / 1000);
  return {
    sessions: sessions.length,
    active: sessions.filter((s) => !s.revokedAt && !s.disputedAt && s.expiry > now).length,
    revoked: sessions.filter((s) => Boolean(s.revokedAt) && !s.disputedAt).length,
    disputed: sessions.filter((s) => Boolean(s.disputedAt)).length,
    jobs: jobs.length,
    volumeUsd: jobs.reduce((n, j) => n + (j.paidUsd || 0), 0),
  };
}
