export type LiveResult = {
  live: boolean;
  reason: string;
  ms: number;
};

const cache = new Map<string, { at: number; result: LiveResult }>();
const TTL = 60_000;

export async function probeEndpoint(url: string): Promise<LiveResult> {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.at < TTL) return cached.result;
  const started = Date.now();
  if (url.startsWith("/")) {
    const result: LiveResult = {
      live: true,
      reason: "BAS seller face is served by this marketplace.",
      ms: 1,
    };
    cache.set(url, { at: Date.now(), result });
    return result;
  }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 4000);
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: ctrl.signal,
      redirect: "follow",
    });
    const result: LiveResult = {
      live: res.ok || res.status === 402 || res.status === 405,
      reason: `HTTP ${res.status} in ${Date.now() - started}ms`,
      ms: Date.now() - started,
    };
    cache.set(url, { at: Date.now(), result });
    return result;
  } catch (e) {
    const result: LiveResult = {
      live: false,
      reason: e instanceof Error ? e.message : "Probe failed",
      ms: Date.now() - started,
    };
    cache.set(url, { at: Date.now(), result });
    return result;
  } finally {
    clearTimeout(t);
  }
}
