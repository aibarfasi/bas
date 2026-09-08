import { NextResponse } from "next/server";
import { hydrateFromSql } from "@/lib/admin/store";
import { putPayment } from "@/lib/x402/receipts";
import { isSignedPayment } from "@/lib/x402/typed";

function allowed(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  await hydrateFromSql();
  const body = (await req.json().catch(() => ({}))) as {
    endpoint?: string;
    payment?: string;
    recipient?: string;
    kind?: string;
  };
  if (!body.endpoint || !allowed(body.endpoint)) {
    return NextResponse.json({ error: "https x402 endpoint required" }, { status: 400 });
  }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8_000);
  try {
    const probe = await fetch(body.endpoint, {
      method: "GET",
      signal: ctrl.signal,
      headers: { accept: "application/json" },
      redirect: "manual",
    });
    const probeText = await probe.text();
    const probeBody = safeJson(probeText);
    if (!body.payment) {
      return NextResponse.json({
        ok: probe.status === 402,
        status: probe.status,
        face: probeBody,
        hint: probe.status === 402 ? "POST payment to continue" : "This endpoint did not return HTTP 402",
      });
    }
    const paid = await fetch(body.endpoint, {
      method: "POST",
      signal: ctrl.signal,
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify({ payment: body.payment, recipient: body.recipient }),
      redirect: "manual",
    });
    const paidText = await paid.text();
    const result = safeJson(paidText);
    const signed = isSignedPayment(body.payment);
    const receipt = putPayment({
      id: `x402_scan_${Date.now().toString(36)}`,
      kind: body.kind ?? "8004scan",
      network: "bsc-testnet",
      facilitator: "Binance x402 / B402",
      scheme: "exact",
      asset: "USDT",
      amountUsd: 0,
      payment: body.payment,
      recipient: body.recipient ?? "hirer",
      paidAt: Date.now(),
      demo: !signed,
      settled: paid.ok,
      resource: body.endpoint,
    });
    return NextResponse.json({
      ok: paid.ok,
      status: paid.status,
      face: probeBody,
      result,
      receipt,
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "x402 probe failed",
      },
      { status: 502 },
    );
  } finally {
    clearTimeout(t);
  }
}

function safeJson(text: string) {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text.slice(0, 800);
  }
}
