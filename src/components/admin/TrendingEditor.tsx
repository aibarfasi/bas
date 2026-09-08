"use client";

import { AdminSelect } from "@/components/admin/AdminSelect";
import { Button } from "@/components/ui/Button";
import type { MarketplaceAgent } from "@/lib/agents/types";
import { TRENDING_LIMIT, nextTrendingIds } from "@/lib/agents/trending";
import { categoryLabel } from "@/lib/categories";

export function TrendingEditor({
  ids,
  agents,
  onChange,
}: {
  ids: string[];
  agents: MarketplaceAgent[];
  onChange: (ids: string[]) => void;
}) {
  const byId = new Map(agents.map((a) => [a.id, a]));
  const selected = ids.map((id) => byId.get(id)).filter((a): a is MarketplaceAgent => Boolean(a));
  const unused = agents.filter((a) => !ids.includes(a.id));
  const addOptions = [{ id: "_add", label: "Add agent…" }, ...unused.map((a) => ({
    id: a.id,
    label: `${a.name} · ${categoryLabel(a.category)}`,
  }))];

  function move(id: string, dir: -1 | 1) {
    const i = ids.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return;
    const next = [...ids];
    const [row] = next.splice(i, 1);
    next.splice(j, 0, row);
    onChange(next);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-bas-heading">Home trending</h2>
          <p className="mt-1 text-sm text-bas-muted">
            Up to {TRENDING_LIMIT} agents on the home hero, in this order. First card is the large bento tile. Empty
            hides the grid.
          </p>
        </div>
        <span className="num text-xs text-bas-muted">
          {selected.length}/{TRENDING_LIMIT}
        </span>
      </div>

      <ol className="mt-4 space-y-2">
        {selected.map((a, i) => (
          <li
            key={a.id}
            className="flex items-center gap-3 rounded-[12px] border border-bas-hairline bg-bas-canvas px-3 py-2"
          >
            <span className="num w-5 text-xs text-bas-muted">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-bas-heading">{a.name}</div>
              <div className="text-[11px] text-bas-muted">{categoryLabel(a.category)}</div>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button size="sm" variant="ghost" disabled={i === 0} onClick={() => move(a.id, -1)}>
                Up
              </Button>
              <Button size="sm" variant="ghost" disabled={i === selected.length - 1} onClick={() => move(a.id, 1)}>
                Down
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onChange(nextTrendingIds(ids, a.id, false))}>
                Remove
              </Button>
            </div>
          </li>
        ))}
      </ol>

      {unused.length > 0 && selected.length < TRENDING_LIMIT ? (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <AdminSelect
            aria-label="Add trending agent"
            className="min-w-0 flex-1"
            value="_add"
            onChange={(id) => {
              if (id !== "_add") onChange(nextTrendingIds(ids, id, true));
            }}
            options={addOptions}
          />
          <p className="text-[11px] text-bas-muted">Pick a seller to add.</p>
        </div>
      ) : null}

      {selected.length >= TRENDING_LIMIT ? (
        <p className="mt-3 text-xs text-bas-muted">Full. Remove one or save and toggle from Sellers to rotate.</p>
      ) : null}
    </div>
  );
}
