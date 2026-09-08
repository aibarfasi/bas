"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { makeEvent, normalizeSession, type HiredSession } from "@/lib/altana/sessions";
import type { HireJob } from "@/lib/hire/types";

export type { HireJob };

type HireState = {
  sessions: HiredSession[];
  jobs: HireJob[];
  upsertSession: (s: HiredSession) => void;
  revokeSession: (id: string, sig?: string | null) => void;
  addJob: (j: HireJob) => void;
  getSession: (id: string) => HiredSession | undefined;
  getJobBySession: (sessionId: string) => HireJob | undefined;
};

export const useHireStore = create<HireState>()(
  persist(
    (set, get) => ({
      sessions: [],
      jobs: [],
      upsertSession: (s) =>
        set({
          sessions: [normalizeSession(s), ...get().sessions.filter((x) => x.id !== s.id)],
        }),
      revokeSession: (id, sig) =>
        set({
          sessions: get().sessions.map((s) =>
            s.id === id
              ? normalizeSession({
                  ...s,
                  revokedAt: Math.floor(Date.now() / 1000),
                  revokeSig: sig ?? s.revokeSig,
                  events: [
                    ...s.events,
                    makeEvent("revoke", "Session revoked", sig ? "Signed kill switch" : "Demo revoke"),
                  ],
                })
              : s,
          ),
        }),
      addJob: (j) => set({ jobs: [j, ...get().jobs.filter((x) => x.id !== j.id)] }),
      getSession: (id) => {
        const found = get().sessions.find((s) => s.id === id);
        return found ? normalizeSession(found) : undefined;
      },
      getJobBySession: (sessionId) =>
        get().jobs.find((j) => j.sessionId === sessionId),
    }),
    { name: "bas-hire" },
  ),
);
