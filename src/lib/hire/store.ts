"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { HiredSession } from "@/lib/altana/sessions";

export type HireJob = {
  id: string;
  sessionId: string;
  agentId: string;
  agentName: string;
  rail: "x402" | "erc-8183";
  paidUsd: number;
  status: "funded" | "running" | "delivered";
  startedAt: number;
  deliveredAt: number | null;
  deliverable: {
    title: string;
    summary: string;
    outputs: { label: string; value: string }[];
    recipient: string;
    custody: string;
  };
};

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
        set({ sessions: [s, ...get().sessions.filter((x) => x.id !== s.id)] }),
      revokeSession: (id, sig) =>
        set({
          sessions: get().sessions.map((s) =>
            s.id === id
              ? {
                  ...s,
                  revokedAt: Math.floor(Date.now() / 1000),
                  revokeSig: sig ?? s.revokeSig,
                }
              : s,
          ),
        }),
      addJob: (j) => set({ jobs: [j, ...get().jobs.filter((x) => x.id !== j.id)] }),
      getSession: (id) => get().sessions.find((s) => s.id === id),
      getJobBySession: (sessionId) =>
        get().jobs.find((j) => j.sessionId === sessionId),
    }),
    { name: "bas-hire" },
  ),
);
