/**
 * Outbound proxy pool for diversifying IP addresses
 * Proxies are loaded from PROXY_LIST environment variable
 * Format: comma-separated list of proxy URLs
 * Example: http://user:pass@ip1:port,http://user:pass@ip2:port
 */

let proxies: string[] = [];
let currentIndex = 0;

function loadProxies(): string[] {
  if (proxies.length > 0) return proxies;

  const proxyList = process.env.PROXY_LIST || "";
  if (!proxyList) return [];

  proxies = proxyList
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return proxies;
}

/**
 * Get next proxy URL (round-robin rotation)
 * Returns undefined if no proxies configured (direct connection)
 */
export function getNextProxy(): string | undefined {
  const pool = loadProxies();
  if (pool.length === 0) return undefined;

  const proxy = pool[currentIndex % pool.length];
  currentIndex++;
  return proxy;
}

/**
 * Get proxy count for monitoring
 */
export function getProxyCount(): number {
  return loadProxies().length;
}
