"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BasLogo } from "@/components/brand/BasLogo";
import { Button } from "@/components/ui/Button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Login failed");
      }
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bas-canvas px-4 text-bas-body">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-[12px] bg-bas-card p-6"
      >
        <BasLogo className="h-8 w-auto" />
        <h1 className="mt-4 text-xl font-semibold text-bas-heading">Operator sign in</h1>
        <p className="mt-2 text-sm text-bas-muted">
          Catalog, hires, proofs, and marketplace settings. Default local
          password is <span className="num text-bas-heading">bas-admin</span>{" "}
          unless <span className="num">ADMIN_PASSWORD</span> is set. After
          sign-in, press <span className="num">⌘K</span> to jump.
        </p>
        <label className="mt-5 block text-xs text-bas-muted">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 h-10 w-full rounded-[6px] border border-bas-hairline bg-bas-canvas px-3 text-sm text-bas-heading"
            autoFocus
          />
        </label>
        {error ? <p className="mt-3 text-sm text-bas-down">{error}</p> : null}
        <Button className="mt-5 w-full" disabled={busy}>
          {busy ? "Signing in…" : "Enter console"}
        </Button>
      </form>
    </div>
  );
}
