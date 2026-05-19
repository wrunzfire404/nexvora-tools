/**
 * Outbound proxy pool for diversifying IP addresses
 * Loads from Redis (Upstash) if available, falls back to PROXY_LIST env variable
 */

let cachedProxies: string[] | null = null;
let cacheTime = 0;
let currentIndex = 0;

const CACHE_TTL = 60000; // 1 minute cache

async function loadProxies(): Promise<string[]> {
  // Return cache if fresh
  if (cachedProxies && Date.now() - cacheTime < CACHE_TTL) {
    return cachedProxies;
  }

  // Try Redis first
  try {
    const { getProxies } = await import("./db");
    const dbProxies = await getProxies();
    if (dbProxies.length > 0) {
      cachedProxies = dbProxies;
      cacheTime = Date.now();
      return dbProxies;
    }
  } catch {
    // Redis not available, fall through
  }

  // Fallback to env variable
  const proxyList = process.env.PROXY_LIST || "";
  const envProxies = proxyList.split(",").map((p) => p.trim()).filter(Boolean);
  cachedProxies = envProxies;
  cacheTime = Date.now();
  return envProxies;
}

/**
 * Get next proxy URL (round-robin rotation)
 * Returns undefined if no proxies configured (direct connection)
 */
export function getNextProxy(): string | undefined {
  // Synchronous — use cached list
  if (!cachedProxies || cachedProxies.length === 0) {
    // Try env directly as sync fallback
    const proxyList = process.env.PROXY_LIST || "";
    cachedProxies = proxyList.split(",").map((p) => p.trim()).filter(Boolean);
    if (cachedProxies.length === 0) return undefined;
  }

  const proxy = cachedProxies[currentIndex % cachedProxies.length];
  currentIndex++;
  return proxy;
}

/**
 * Force refresh proxy cache (call after add/remove)
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
loadProxies().catch(() => {});
