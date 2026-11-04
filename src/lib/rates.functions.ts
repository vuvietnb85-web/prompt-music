import { createServerFn } from "@tanstack/react-start";

export const getUsdVnd = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=VND", {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { ok: false as const };
    const body = (await res.json()) as { rates?: { VND?: number } };
    const vnd = body.rates?.VND;
    if (!vnd) return { ok: false as const };
    return { ok: true as const, vnd };
  } catch {
    return { ok: false as const };
  }
});
