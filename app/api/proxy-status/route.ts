import { NextResponse } from "next/server";
import { proxyFetch } from "@/lib/proxy-fetch";
import { getProxies } from "@/lib/db";

export async function GET() {
  // Load proxies from Redis first, fallback to env
  const proxies = await getProxies();

  if (proxies.length === 0) {
    return NextResponse.json({
      status: "no_proxy",
      message: "No proxies configured.",
      total: 0,
      alive: 0,
      results: [],
    });
  }

  // Test each proxy
  const results = await Promise.all(
    proxies.map(async (proxy, index) => {
      const start = Date.now();
      try {
        const response = await proxyFetch("https://httpbin.org/ip", {
          proxy,
          signal: AbortSignal.timeout(10000),
        });
        const data = await response.json() as { origin?: string };
        return {
          index,
          status: "alive" as const,
          ip: data.origin || "unknown",
          latency: Date.now() - start,
        };
      } catch (err) {
        return {
          index,
          status: "dead" as const,
          ip: null,
          latency: Date.now() - start,
          error: (err as Error).message?.substring(0, 50),
        };
      }
    })
  );

  const alive = results.filter((r) => r.status === "alive").length;

  return NextResponse.json({
    status: alive > 0 ? "ok" : "all_dead",
    message: `${alive}/${proxies.length} proxies alive`,
    total: proxies.length,
    alive,
    results,
  });
}
