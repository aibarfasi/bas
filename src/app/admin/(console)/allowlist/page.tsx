"use client";

import { useEffect, useMemo, useState } from "react";
import { Confirm } from "@/components/admin/Confirm";
import { CopyText } from "@/components/admin/CopyText";
import { PageHeader } from "@/components/admin/PageHeader";
import { Chip, ChipRow, EmptyState, ResponsiveTable, SearchField, Skeleton, StatusBanner } from "@/components/admin/ResponsiveTable";
import { useToast } from "@/components/admin/Toast";
import { Button } from "@/components/ui/Button";
import { adminFetch } from "@/lib/admin/client";
import { downloadCsv } from "@/lib/admin/csv";
import { explorerAddress, shortAddr } from "@/lib/format";
import { PANCAKE_ALLOWLIST } from "@/lib/pancake/allowlist";

type Item = { label: string; address: string };
type Filter = "all" | "pinned" | "custom";

const ADDR_RE = /^0x[a-fA-F0-9]{40}$/;

function isPinned(addr: string) {
  return PANCAKE_ALLOWLIST.some((a) => a.address.toLowerCase() === addr.toLowerCase());
}

export default function AdminAllowlistPage() {
  const toast = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [label, setLabel] = useState("");
  const [address, setAddress] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [removeAddr, setRemoveAddr] = useState<Item | null>(null);

  async function load() {
    const data = await adminFetch<{ allowlist: Item[] }>("/api/admin/allowlist");
    setItems(data.allowlist);
    setLoading(false);
  }

  useEffect(() => {
    load().catch((e) => {
      setError(e instanceof Error ? e.message : "Failed");
      setLoading(false);
    });
  }, []);

  const counts = useMemo(() => {
    const pinned = items.filter((i) => isPinned(i.address)).length;
    return { all: items.length, pinned, custom: items.length - pinned };
  }, [items]);

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return items.filter((item) => {
      const pinned = isPinned(item.address);
      if (filter === "pinned" && !pinned) return false;
      if (filter === "custom" && pinned) return false;
      if (!n) return true;
      return `${item.label} ${item.address}`.toLowerCase().includes(n);
    });
  }, [items, q, filter]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const addr = address.trim();
    const name = label.trim();
    if (!ADDR_RE.test(addr)) {
      setFormError("Address must be a 0x… 40-byte hex value.");
      return;
    }
    if (items.some((i) => i.address.toLowerCase() === addr.toLowerCase())) {
      setFormError("That contract is already on the list.");
      return;
    }
    setBusy(true);
    try {
      await adminFetch("/api/admin/allowlist", {
        method: "POST",
        body: JSON.stringify({ label: name, address: addr }),
      });
      setLabel("");
      setAddress("");
      toast("ok", "Contract added");
      await load();
    } catch (err) {
      toast("err", err instanceof Error ? err.message : "Add failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(addr: string) {
    if (isPinned(addr)) return;
    setBusy(true);
    try {
      await adminFetch(`/api/admin/allowlist?address=${encodeURIComponent(addr)}`, {
        method: "DELETE",
      });
      toast("ok", "Contract removed");
      setRemoveAddr(null);
      await load();
    } catch (err) {
      toast("err", err instanceof Error ? err.message : "Remove failed");
    } finally {
      setBusy(false);
    }
  }

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "pinned", label: "Pinned" },
    { id: "custom", label: "Custom" },
  ];

  return (
    <div>
      <PageHeader
        title="Allowlist"
        desc="Contracts a hired agent may call. Pancake Smart Router, NFPM, and MasterChef stay pinned."
        actions={
          <Button
            variant="secondary"
            onClick={() =>
              downloadCsv(
                "bas-allowlist.csv",
                rows.map((i) => ({
                  label: i.label,
                  address: i.address,
                  pinned: isPinned(i.address),
                })),
              )
            }
          >
            Export CSV
          </Button>
        }
      />

      <StatusBanner
        tone="neutral"
        title={`${counts.pinned} pinned Pancake contracts · ${counts.custom} custom`}
        body="Pinned Smart Router, NFPM, and MasterChef stay on every hire. Custom targets merge on top."
      />

      <div className="mt-5 grid grid-cols-3 gap-3">
        {(
          [
            [counts.all, "Total"],
            [counts.pinned, "Pinned"],
            [counts.custom, "Custom"],
          ] as const
        ).map(([n, l]) => (
          <div key={l} className="rounded-[12px] border border-bas-hairline bg-bas-card px-3 py-3">
            <div className="num text-xl font-semibold text-bas-primary">{n}</div>
            <div className="mt-0.5 text-[11px] text-bas-muted">{l}</div>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => void add(e)}
        className="mt-5 rounded-[12px] border border-bas-hairline bg-bas-card p-4 sm:p-5"
      >
        <p className="text-sm font-semibold text-bas-heading">Add contract</p>
        <p className="mt-1 text-xs text-bas-muted">Custom targets are merged with the pinned Pancake set on every hire.</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            required
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label"
            className="admin-field h-12 px-3 text-base sm:h-10 sm:w-48 sm:text-sm"
          />
          <input
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x…"
            spellCheck={false}
            className="admin-field h-12 flex-1 px-3 font-mono text-base sm:h-10 sm:text-sm"
          />
          <Button type="submit" className="w-full sm:w-auto" disabled={busy}>
            {busy ? "Saving…" : "Add"}
          </Button>
        </div>
        {formError ? <p className="mt-3 text-sm text-bas-down">{formError}</p> : null}
      </form>

      <div className="mt-5 space-y-3">
        <SearchField value={q} onChange={setQ} placeholder="Search label or address" />
        <ChipRow>
          {filters.map((f) => (
            <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}{" "}
              <span className={`num ${filter === f.id ? "" : "text-bas-muted"}`}>{counts[f.id]}</span>
            </Chip>
          ))}
        </ChipRow>
      </div>

      {error ? <p className="mt-4 text-sm text-bas-down">{error}</p> : null}
      <p className="mt-4 text-xs text-bas-muted">
        Showing <span className="num">{rows.length}</span> of {items.length}
      </p>

      {loading ? (
        <Skeleton rows={4} />
      ) : (
        <ResponsiveTable
          rows={rows}
          rowKey={(i) => i.address}
          mobilePrimary={(i) => i.label}
          mobileSecondary={(i) => (
            <div className="flex flex-wrap items-center gap-2">
              {isPinned(i.address) ? (
                <span className="rounded-full border border-bas-primary/40 bg-bas-primary/10 px-2 py-0.5 text-[10px] text-bas-heading">
                  Pinned
                </span>
              ) : (
                <span className="text-[11px]">Custom</span>
              )}
              <CopyText value={i.address} label={shortAddr(i.address, 6)} />
            </div>
          )}
          mobileActions={(i) => (
            <>
              <Button size="sm" variant="secondary" href={explorerAddress(56, i.address)}>
                BscScan
              </Button>
              {isPinned(i.address) ? null : (
                <Button size="sm" variant="danger" onClick={() => setRemoveAddr(i)}>
                  Remove
                </Button>
              )}
            </>
          )}
          columns={[
            {
              label: "Contract",
              cell: (i) => (
                <>
                  <div className="font-medium text-bas-heading">{i.label}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <CopyText value={i.address} />
                    {isPinned(i.address) ? (
                      <span className="rounded-full border border-bas-primary/40 bg-bas-primary/10 px-2 py-0.5 text-[10px] font-medium text-bas-heading">
                        Pinned
                      </span>
                    ) : (
                      <span className="text-[11px] text-bas-muted">Custom</span>
                    )}
                  </div>
                </>
              ),
            },
            {
              label: "Address",
              cell: (i) => <span className="num text-xs text-bas-muted">{shortAddr(i.address, 6)}</span>,
            },
            {
              label: "",
              className: "text-right",
              cell: (i) => (
                <div className="flex justify-end gap-1.5">
                  <Button size="sm" variant="secondary" href={explorerAddress(56, i.address)}>
                    BscScan
                  </Button>
                  {isPinned(i.address) ? (
                    <span className="inline-flex h-8 items-center px-2 text-xs text-bas-muted">Locked</span>
                  ) : (
                    <Button size="sm" variant="danger" onClick={() => setRemoveAddr(i)}>
                      Remove
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
          empty={<EmptyState title="No contracts match" body="Clear search or switch filters." />}
        />
      )}

      {removeAddr ? (
        <Confirm
          title={`Remove ${removeAddr.label}?`}
          body="New hires will not include this contract. Existing sessions keep the allowlist they were granted."
          confirm="Remove"
          danger
          onCancel={() => setRemoveAddr(null)}
          onConfirm={() => void remove(removeAddr.address)}
        />
      ) : null}
    </div>
  );
}
