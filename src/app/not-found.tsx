import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold text-bas-heading">Not found</h1>
      <p className="mt-2 max-w-lg text-sm text-bas-muted">
        That agent or page is not in the catalog. The market and the 90-second judge path still work.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button href="/market">Market</Button>
        <Button href="/docs/judges" variant="secondary">
          Judge path
        </Button>
      </div>
    </AppShell>
  );
}
