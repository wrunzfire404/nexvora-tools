/**
 * Outbound proxy pool for diversifying IP addresses
 * Priority: Redis (Upstash) > PROXY_LIST env variable
 */

let cachedProxies: string[] | null = null;
let cacheTime = 0;
let currentIndex = 0;

const CACHE_TTL = 30000; // 30 seconds cache

/**
 * Load proxies — async, used for refresh
 */
export async function refreshProxyCache(): Promise<string[]> {
  try {
    const { getProxies } = await import("./db");
    const dbProxies = await getProxies();
    if (dbProxies.length > 0) {
      cachedProxies = dbProxies;
      cacheTime = Date.now();
      return dbProxies;
    }
  } catch {
    // Redis not available
  }

  // Fallback to env
  const proxyList = process.env.PROXY_LIST || "";
  const envProxies = proxyList.split(",").map((p) => p.trim()).filter(Boolean);
  cachedProxies = envProxies;
  cacheTime = Date.now();
  return envProxies;
}

/**
 * Get next proxy URL (round-robin rotation) — ASYNC version
 * Must be awaited to ensure Redis is loaded
 * Returns undefined if proxy disabled or no proxies
 */
export async function getNextProxyAsync(): Promise<string | undefined> {
  // Check if proxy is enabled
  try {
    const { getProxyEnabled } = await import("./db");
    const enabled = await getProxyEnabled();
    if (!enabled) return undefined;
  } catch {}

  // Force refresh if cache empty or expired
  if (!cachedProxies || cachedProxies.length === 0 || Date.now() - cacheTime > CACHE_TTL) {
    await refreshProxyCache();
  }

  if (!cachedProxies || cachedProxies.length === 0) return undefined;

  const proxy = cachedProxies[currentIndex % cachedProxies.length];
  currentIndex++;
  return proxy;
}

/**
 * Force refresh proxy cache
 */
export function invalidateProxyCache(): void {
  cachedProxies = null;
  cacheTime = 0;
}

/**
 * Get proxy count
 */
export function getProxyCount(): number {
  return cachedProxies?.length || 0;
}

// Pre-load on module init
refreshProxyCache().catch(() => {});
