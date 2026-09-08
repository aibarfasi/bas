"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BasLogo } from "@/components/brand/BasLogo";
import { Button } from "@/components/ui/Button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
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
    <div className="flex min-h-dvh items-end justify-center bg-bas-canvas px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] text-bas-body sm:items-center">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-[12px] bg-bas-card p-5 sm:p-6"
      >
        <BasLogo className="h-8 w-auto" />
        <h1 className="mt-4 text-xl font-semibold text-bas-heading">Operator sign in</h1>
        <p className="mt-2 text-sm leading-6 text-bas-muted">
          Catalog, hires, proofs, and marketplace settings. Default local
          password is <span className="num text-bas-heading">bas-admin</span>{" "}
          unless <span className="num">ADMIN_PASSWORD</span> is set.
        </p>
        <label className="mt-5 block text-xs text-bas-muted">
          Password
          <span className="mt-1 flex gap-2">
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full rounded-[6px] border border-bas-hairline bg-bas-canvas px-3 text-base text-bas-heading sm:h-10 sm:text-sm"
              autoFocus
              autoComplete="current-password"
            />
            <button
              type="button"
              className="h-12 shrink-0 rounded-[6px] bg-bas-elevated px-3 text-xs sm:h-10"
              onClick={() => setShow((v) => !v)}
            >
              {show ? "Hide" : "Show"}
            </button>
          </span>
        </label>
        {error ? <p className="mt-3 text-sm text-bas-down">{error}</p> : null}
        <Button className="mt-5 w-full" disabled={busy}>
          {busy ? "Signing in…" : "Enter console"}
        </Button>
      </form>
    </div>
  );
}
