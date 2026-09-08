import { AppShell } from "@/components/shell/AppShell";

export default function MarketLoading() {
  return (
    <AppShell>
      <div className="h-8 w-40 rounded-[8px] bg-bas-card" />
      <p className="mt-3 text-sm text-bas-muted">Loading catalog…</p>
      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 rounded-[12px] bg-bas-card" />
        ))}
      </div>
    </AppShell>
  );
}
