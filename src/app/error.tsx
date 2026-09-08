"use client";

import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold text-bas-heading">Something broke</h1>
      <p className="mt-2 max-w-lg text-sm text-bas-muted">
        {error.message || "The marketplace hit an unexpected error. The catalog is still on /market."}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => retry()}>
          Try again
        </Button>
        <Button href="/market">Market</Button>
        <Button href="/docs/judges" variant="secondary">
          Judge path
        </Button>
      </div>
    </AppShell>
  );
}
