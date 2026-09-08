"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BasLogo } from "@/components/brand/BasLogo";
import { AppearanceToggles } from "@/components/theme/AppearanceToggles";
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
    <div className="relative flex min-h-dvh items-end justify-center bg-bas-canvas px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] text-bas-body sm:items-center">
      <div className="absolute top-4 right-4 flex items-center gap-2 sm:top-5 sm:right-5">
        <Link href="/" className="text-xs text-bas-muted hover:text-bas-heading">
          Market
        </Link>
        <AppearanceToggles />
      </div>
      <form
        onSubmit={submit}
        className="admin-panel w-full max-w-sm rounded-[12px] border border-bas-hairline bg-bas-surface-soft p-5 sm:p-6"
      >
        <BasLogo className="h-8 w-auto" />
        <h1 className="mt-4 text-xl font-semibold text-bas-heading">Operator sign in</h1>
        <p className="mt-2 text-sm leading-6 text-bas-muted">
          Catalog, hires, proofs, and marketplace settings. Default local password is{" "}
          <span className="num text-bas-heading">bas-admin</span> unless{" "}
          <span className="num">ADMIN_PASSWORD</span> is set.
        </p>
        <ul className="mt-4 space-y-1 text-xs text-bas-muted">
          <li>Sellers and catalog from 8004scan</li>
          <li>Hires, proofs, and Pancake allowlist</li>
          <li>Health, intake, and deploy map</li>
        </ul>
        <label className="mt-5 block text-xs text-bas-muted">
          Password
          <span className="mt-1 flex gap-2">
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="admin-field h-12 w-full px-3 text-base sm:h-10 sm:text-sm"
              autoFocus
              autoComplete="current-password"
            />
            <button
              type="button"
              className="bas-mac-chip shrink-0 border border-bas-hairline bg-bas-card text-bas-heading sm:h-8"
              onClick={() => setShow((v) => !v)}
            >
              {show ? "Hide" : "Show"}
            </button>
          </span>
        </label>
        {error ? (
          <p className="mt-3 rounded-[8px] border border-bas-down/40 bg-bas-down/10 px-3 py-2 text-sm text-bas-down">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="mt-5 w-full" disabled={busy || !password}>
          {busy ? "Signing in…" : "Enter console"}
        </Button>
      </form>
    </div>
  );
}
