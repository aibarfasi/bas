"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { useToast } from "@/components/admin/Toast";
import { Button } from "@/components/ui/Button";
import { adminFetch } from "@/lib/admin/client";
import { PANCAKE_ALLOWLIST } from "@/lib/pancake/allowlist";
import { shortAddr } from "@/lib/format";

type Item = { label: string; address: string };

export default function AdminAllowlistPage() {
  const toast = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [label, setLabel] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const data = await adminFetch<{ allowlist: Item[] }>("/api/admin/allowlist");
    setItems(data.allowlist);
  }

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    await adminFetch("/api/admin/allowlist", {
      method: "POST",
      body: JSON.stringify({ label, address }),
    });
    setLabel("");
    setAddress("");
    toast("ok", "Contract added");
    await load();
  }

  async function remove(addr: string) {
    const baked = PANCAKE_ALLOWLIST.some((a) => a.address.toLowerCase() === addr.toLowerCase());
    if (baked) return;
    await adminFetch(`/api/admin/allowlist?address=${encodeURIComponent(addr)}`, {
      method: "DELETE",
    });
    toast("ok", "Contract removed");
    await load();
  }

  return (
    <div>
      <PageHeader
        title="Allowlist"
        desc="Contracts a hired agent may call. Pancake Smart Router, NFPM, and MasterChef stay pinned."
      />
      <form onSubmit={add} className="mt-5 flex flex-col gap-2 sm:flex-row">
        <input
          required
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label"
          className="h-10 rounded-[6px] border border-bas-hairline bg-bas-canvas px-3 text-sm sm:w-48"
        />
        <input
          required
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="0x…"
          className="h-10 flex-1 rounded-[6px] border border-bas-hairline bg-bas-canvas px-3 text-sm"
        />
        <Button>Add</Button>
      </form>
      {error ? <p className="mt-3 text-sm text-bas-down">{error}</p> : null}
      <ul className="mt-6 divide-y divide-bas-hairline rounded-[12px] bg-bas-card">
        {items.map((item) => {
          const pinned = PANCAKE_ALLOWLIST.some(
            (a) => a.address.toLowerCase() === item.address.toLowerCase(),
          );
          return (
            <li key={item.address} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <div className="text-bas-heading">{item.label}</div>
                <div className="num text-xs text-bas-muted">{shortAddr(item.address, 6)}</div>
              </div>
              {pinned ? (
                <span className="text-xs text-bas-muted">Pinned</span>
              ) : (
                <button type="button" className="text-xs text-bas-down" onClick={() => remove(item.address)}>
                  Remove
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
