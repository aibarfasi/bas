import type { Category } from "@/lib/agents/types";
import { categoryLabel } from "@/lib/categories";

export function LiveBadge({ live }: { live: boolean | null }) {
  if (live === true) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-bas-up">
        <span className="h-1.5 w-1.5 rounded-full bg-bas-up" />
        Live
      </span>
    );
  }
  if (live === false) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-bas-down">
        <span className="h-1.5 w-1.5 rounded-full bg-bas-down" />
        Down
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-bas-muted">
      <span className="h-1.5 w-1.5 rounded-full bg-bas-muted" />
      Unknown
    </span>
  );
}

export function CategoryBadge({ cat }: { cat: Category }) {
  return (
    <span className="rounded-[4px] bg-bas-elevated px-2 py-0.5 text-[11px] font-medium tracking-[-0.01em] text-bas-body">
      {categoryLabel(cat)}
    </span>
  );
}

export function FeaturedBadge() {
  return (
    <span className="rounded-[4px] bg-bas-primary px-2 py-0.5 text-[11px] font-semibold tracking-[-0.01em] text-bas-on-primary">
      BAS
    </span>
  );
}
