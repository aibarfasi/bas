"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WatchSnapshot = {
  id: string;
  chainId: number;
  tokenId: string;
  name: string;
  hireable: boolean;
  x402: boolean;
  live: boolean | null;
  totalScore: number;
};

export type WatchAlert = {
  id: string;
  agentId: string;
  message: string;
  at: number;
};

type WatchState = {
  items: WatchSnapshot[];
  alerts: WatchAlert[];
  toggle: (item: WatchSnapshot) => void;
  has: (id: string) => boolean;
  ingest: (fresh: WatchSnapshot[]) => void;
  dismiss: (id: string) => void;
  clearAlerts: () => void;
};

function diff(prev: WatchSnapshot, next: WatchSnapshot): string[] {
  const out: string[] = [];
  if (prev.hireable !== next.hireable) {
    out.push(next.hireable ? `${next.name} is now hireable` : `${next.name} is no longer hireable`);
  }
  if (prev.x402 !== next.x402) {
    out.push(next.x402 ? `${next.name} published x402` : `${next.name} dropped x402`);
  }
  if (prev.live !== next.live) {
    out.push(`${next.name} liveness is now ${next.live == null ? "unknown" : next.live ? "live" : "down"}`);
  }
  if (Math.abs(prev.totalScore - next.totalScore) >= 1) {
    out.push(`${next.name} score ${prev.totalScore.toFixed(1)} → ${next.totalScore.toFixed(1)}`);
  }
  return out;
}

export const useWatchStore = create<WatchState>()(
  persist(
    (set, get) => ({
      items: [],
      alerts: [],
      toggle: (item) => {
        const cur = get().items;
        if (cur.some((x) => x.id === item.id)) {
          set({ items: cur.filter((x) => x.id !== item.id) });
          return;
        }
        set({ items: [item, ...cur].slice(0, 40) });
      },
      has: (id) => get().items.some((x) => x.id === id),
      ingest: (fresh) => {
        const items = get().items;
        if (!items.length) return;
        const byId = new Map(fresh.map((a) => [a.id, a]));
        const nextItems: WatchSnapshot[] = [];
        const alerts: WatchAlert[] = [];
        for (const prev of items) {
          const next = byId.get(prev.id) ?? prev;
          nextItems.push(next);
          for (const message of diff(prev, next)) {
            alerts.push({
              id: `wa_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              agentId: next.id,
              message,
              at: Date.now(),
            });
          }
        }
        set({
          items: nextItems,
          alerts: [...alerts, ...get().alerts].slice(0, 30),
        });
      },
      dismiss: (id) => set({ alerts: get().alerts.filter((a) => a.id !== id) }),
      clearAlerts: () => set({ alerts: [] }),
    }),
    { name: "bas-watch" },
  ),
);

export function toWatchSnapshot(agent: {
  id: string;
  chainId: number;
  tokenId: string;
  name: string;
  hireable: boolean;
  x402: boolean;
  live: boolean | null;
  totalScore: number;
}): WatchSnapshot {
  return {
    id: agent.id,
    chainId: agent.chainId,
    tokenId: agent.tokenId,
    name: agent.name,
    hireable: agent.hireable,
    x402: agent.x402,
    live: agent.live,
    totalScore: agent.totalScore,
  };
}
