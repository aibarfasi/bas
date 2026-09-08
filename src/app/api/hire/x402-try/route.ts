import { NextResponse } from "next/server";

function allowed(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    endpoint?: string;
    payment?: string;
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
      body: JSON.stringify({ payment: body.payment }),
      redirect: "manual",
    });
    const paidText = await paid.text();
    return NextResponse.json({
      ok: paid.ok,
      status: paid.status,
      face: probeBody,
      result: safeJson(paidText),
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
