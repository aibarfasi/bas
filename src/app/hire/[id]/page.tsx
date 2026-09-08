"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useSignTypedData } from "wagmi";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { WalletButton } from "@/components/wallet/WalletButton";
import type { MarketplaceAgent } from "@/lib/agents/types";
import { buildSession, grantTypedData } from "@/lib/altana/sessions";
import { useHireStore } from "@/lib/hire/store";
import { hireKind } from "@/lib/hire/kind";
import { parseHireId, publishedX402, shortAddr } from "@/lib/format";
import { categoryHirePath } from "@/lib/categories";
import { PANCAKE_ALLOWLIST } from "@/lib/pancake/allowlist";

const STEPS = ["Wallet", "Session", "Pay", "Work"] as const;

export default function HirePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const parsed = parseHireId(id);
  const router = useRouter();
  const { address, isConnected, chainId } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const upsertSession = useHireStore((s) => s.upsertSession);
  const addJob = useHireStore((s) => s.addJob);

  const [agent, setAgent] = useState<MarketplaceAgent | null>(null);
  const [step, setStep] = useState(0);
  const [cap, setCap] = useState("0.05");
  const [hours, setHours] = useState(24);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!parsed) return;
    fetch(`/api/agents/${parsed.chainId}/${parsed.tokenId}`)
      .then((r) => r.json())
      .then((d) => {
        const next = d.agent ?? null;
        setAgent(next);
        if (next) {
          setCap(next.policy?.spendCap ?? "0.05");
          setHours(next.policy?.expiryHours ?? 24);
        }
      })
      .catch(() => setAgent(null));
  }, [parsed?.chainId, parsed?.tokenId]);

  const policy = useMemo(() => {
    if (!agent) return null;
    const hireable = agent.hireable;
    return {
      wallet: agent.policy?.wallet ?? agent.agentWallet ?? agent.owner,
      allowlist: agent.policy?.allowlist ?? (hireable ? PANCAKE_ALLOWLIST : []),
      spendCap: hireable ? cap : "0",
      spendToken: agent.policy?.spendToken ?? "BNB",
      expiryHours: hours,
    };
  }, [agent, cap, hours]);

  if (!parsed) {
    return (
      <AppShell light>
        <p>Invalid hire id.</p>
      </AppShell>
    );
  }

  if (!agent || !policy) {
    return (
      <AppShell light>
        <p className="text-sm text-bas-muted">Loading agent…</p>
      </AppShell>
    );
  }

  const x402Url = publishedX402(agent);
  if (!agent.hireable && !x402Url) {
    return (
      <AppShell light>
        <h1 className="text-2xl font-semibold">No payable face on this record</h1>
        <p className="mt-2 max-w-xl text-sm text-bas-muted">
          This 8004scan agent does not publish x402. Hire the BAS seller in the
          same category — that path completes end to end, including demo mode.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button href={categoryHirePath(agent.category)}>Hire BAS seller</Button>
          <Button href="/market" variant="secondary">
            Back to market
          </Button>
        </div>
      </AppShell>
    );
  }

  const externalX402 = !agent.hireable && Boolean(x402Url);

  async function finish() {
    if (!agent || !policy) return;
    setBusy(true);
    setError(null);
    try {
      const demo = !isConnected || !address;
      let grantSig: string | null = null;
      const draft = buildSession({
        agentId: agent.id,
        agentName: agent.name,
        chainId: agent.chainId,
        tokenId: agent.tokenId,
        owner: address ?? "0x000000000000000000000000000000000000dEmo",
        policy,
        demo,
      });
      if (isConnected && address) {
        const typed = grantTypedData(chainId ?? agent.chainId, draft);
        grantSig = await signTypedDataAsync({
          domain: typed.domain,
          types: typed.types,
          primaryType: typed.primaryType,
          message: {
            ...typed.message,
            wallet: typed.message.wallet as `0x${string}`,
          },
        });
        draft.grantSig = grantSig;
      }

      const ledger = await fetch("/api/altana/receipts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "grant",
          sessionId: draft.id,
          agentId: draft.agentId,
          agentName: draft.agentName,
          wallet: draft.wallet,
          owner: draft.owner,
          spendCap: draft.spendCap,
          spendToken: draft.spendToken,
          expiry: draft.expiry,
          allowlist: draft.allowlist,
          grantSig: draft.grantSig,
          demo: draft.demo,
        }),
      }).then((r) => r.json());
      draft.ledgerId = ledger.receipt?.id ?? null;

      const kind = hireKind(agent);
      const x402Url = publishedX402(agent);
      let paid: {
        receipt?: { id?: string };
        result?: { title?: string; summary?: string; outputs?: { label: string; value: string }[] };
        error?: string;
        ok?: boolean;
        status?: number;
      };
      if (!agent.hireable && x402Url) {
        paid = await fetch("/api/hire/x402-try", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint: x402Url, payment: grantSig ?? "demo" }),
        }).then((r) => r.json());
        if (!paid.ok && paid.status !== 200) {
          throw new Error(
            paid.error ||
              `Published x402 returned ${paid.status ?? "an error"}. Hire the BAS seller in this category instead.`,
          );
        }
      } else {
        paid = await fetch(`/api/hire/faces/${kind}/x402`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            payment: grantSig ?? "demo",
            recipient: address ?? "hirer",
          }),
        }).then((r) => r.json());
      }
      draft.paymentId = paid.receipt?.id ?? null;
      upsertSession(draft);

      const result = paid.result as {
        title?: string;
        summary?: string;
        outputs?: { label: string; value: string }[];
      } | undefined;

      const outputs = Array.isArray(result?.outputs)
        ? result.outputs
        : [{ label: "Response", value: JSON.stringify(paid.result ?? paid).slice(0, 280) }];

      const job = {
        id: `job_${draft.id}`,
        sessionId: draft.id,
        agentId: agent.id,
        agentName: agent.name,
        rail: "x402" as const,
        paidUsd: agent.priceUsd ?? 0,
        status: "delivered" as const,
        startedAt: Date.now(),
        deliveredAt: Date.now(),
        deliverable: {
          title: result?.title ?? "x402 response",
          summary: result?.summary ?? (agent.hireable ? "Job delivered." : "Raw response from the agent's published x402 face."),
          outputs,
          recipient: address ?? "hirer (demo)",
          custody: "Agent never held user funds. Output recipient = you.",
          raw: paid.result ?? paid,
        },
      };
      addJob(job);
      fetch("/api/ops/hires", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ session: draft, job }),
      }).catch(() => null);
      router.push(`/session/${draft.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hire failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell light>
      <p className="text-xs text-bas-muted">Hire · transactional</p>
      <h1 className="mt-2 text-3xl font-semibold">Hire {agent.name}</h1>
      <p className="mt-2 max-w-xl text-sm text-bas-muted">
        {externalX402
          ? "This record publishes its own x402 face. We call that endpoint and show whatever it returns. For a guaranteed demo, hire the BAS seller in this category instead."
          : "Light canvas on purpose — this is the money step. Scope the session, pay x402, keep custody. After pay you land on the session page (revoke lives there)."}
      </p>
      {externalX402 ? (
        <Button href={categoryHirePath(agent.category)} variant="secondary" className="mt-3">
          Hire BAS seller instead
        </Button>
      ) : null}

      <ol className="mt-6 flex gap-2 text-xs">
        {STEPS.map((s, i) => (
          <li
            key={s}
            className={`rounded-[4px] px-2 py-1 ${
              i === step
                ? "bg-bas-primary text-bas-on-primary"
                : i < step
                  ? "bg-bas-surface-strong"
                  : "bg-bas-surface-soft text-bas-muted"
            }`}
          >
            {s}
          </li>
        ))}
      </ol>

      <div className="mt-6 max-w-xl rounded-[12px] bg-bas-card p-5">
        {step === 0 ? (
          <div>
            <h2 className="font-semibold">Connect or continue as judge</h2>
            <p className="mt-2 text-sm text-bas-muted">
              A connected wallet signs the Altana session (EIP-712). Judges can
              continue without a wallet — the journey must not dead-end.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <WalletButton light />
              <Button variant="secondary" onClick={() => setStep(1)}>
                Continue {isConnected ? "with wallet" : "as demo"}
              </Button>
            </div>
            {isConnected ? (
              <p className="num mt-3 text-xs text-bas-muted">{shortAddr(address)}</p>
            ) : null}
          </div>
        ) : null}

        {step === 1 ? (
          <div>
            <h2 className="font-semibold">Altana session</h2>
            <p className="mt-2 text-sm text-bas-muted">
              The agent may only call these contracts, only up to the cap, and
              only until expiry. Revoke is on the next screen.
            </p>
            <label className="mt-4 block text-xs text-bas-muted">
              Spend cap ({policy.spendToken})
              <input
                value={cap}
                onChange={(e) => setCap(e.target.value)}
                className="num mt-1 h-10 w-full rounded-[8px] border border-bas-hairline-light px-3"
              />
            </label>
            <label className="mt-3 block text-xs text-bas-muted">
              Expiry (hours)
              <input
                type="number"
                min={1}
                max={168}
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="num mt-1 h-10 w-full rounded-[8px] border border-bas-hairline-light px-3"
              />
            </label>
            <ul className="mt-4 space-y-1 text-sm">
              {policy.allowlist.length ? (
                policy.allowlist.map((a) => (
                  <li key={a.address} className="flex justify-between gap-3">
                    <span>{a.label}</span>
                    <span className="num text-bas-muted">{shortAddr(a.address)}</span>
                  </li>
                ))
              ) : (
                <li>Read-only. Empty allowlist — the agent cannot spend.</li>
              )}
            </ul>
            <Button className="mt-5" onClick={() => setStep(2)}>
              Confirm session
            </Button>
          </div>
        ) : null}

        {step === 2 ? (
          <div>
            <h2 className="font-semibold">Pay with x402</h2>
            <p className="mt-2 text-sm text-bas-muted">
              Facilitator: Binance x402 / B402. Price {agent.priceUsd ?? 0} USDT.
              Payment settles before work. ERC-8183 escrow is available on the
              same seller for longer jobs.
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-bas-muted">Rail</dt>
                <dd>x402</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-bas-muted">Amount</dt>
                <dd className="num">${(agent.priceUsd ?? 0).toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-bas-muted">Recipient of work</dt>
                <dd className="num">{shortAddr(address) || "you (demo)"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-bas-muted">Custody</dt>
                <dd>Never the agent</dd>
              </div>
            </dl>
            <Button className="mt-5" onClick={() => setStep(3)}>
              Authorize payment
            </Button>
          </div>
        ) : null}

        {step === 3 ? (
          <div>
            <h2 className="font-semibold">Run the job</h2>
            <p className="mt-2 text-sm text-bas-muted">
              Signs the session if a wallet is connected, pays the x402 face,
              then stores the deliverable on the session page.
            </p>
            {error ? <p className="mt-3 text-sm text-bas-down">{error}</p> : null}
            <Button className="mt-5" disabled={busy} onClick={finish}>
              {busy ? "Working…" : "Hire now"}
            </Button>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
