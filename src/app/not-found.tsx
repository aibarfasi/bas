import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold text-white">Not found</h1>
      <p className="mt-2 text-sm text-bas-muted">That agent or page is not in the catalog.</p>
      <Button href="/market" className="mt-6">
        Market
      </Button>
    </AppShell>
  );
}
