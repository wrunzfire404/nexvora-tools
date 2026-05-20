import { Redis } from "@upstash/redis";

// Initialize Redis client
// Set KV_REST_API_URL and KV_REST_API_TOKEN in Vercel env vars
// Get these from: Vercel Dashboard → Storage → Create → Upstash Redis
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!url || !token) return null;

  redis = new Redis({ url, token });
  return redis;
}

// ============ PROXY SETTINGS ============

export async function getProxyEnabled(): Promise<boolean> {
  const r = getRedis();
  if (!r) return true; // default enabled if no Redis
  const enabled = await r.get<boolean>("nexvora:proxy-enabled");
  return enabled !== false; // default true
}

export async function setProxyEnabled(enabled: boolean): Promise<void> {
  const r = getRedis();
  if (!r) return;
  await r.set("nexvora:proxy-enabled", enabled);
}

// ============ PROXY MANAGEMENT ============

export async function getProxies(): Promise<string[]> {
  const r = getRedis();
  if (!r) {
    // No Redis — fallback to env variable
    const envList = process.env.PROXY_LIST || "";
    return envList.split(",").map((p) => p.trim()).filter(Boolean);
  }
  const proxies = await r.get<string[]>("nexvora:proxies");
  if (proxies && proxies.length > 0) {
    return proxies;
  }
  // Redis is available but empty — still fallback to env
  const envList = process.env.PROXY_LIST || "";
  return envList.split(",").map((p) => p.trim()).filter(Boolean);
}

export async function setProxies(proxies: string[]): Promise<void> {
  const r = getRedis();
  if (!r) return;
  await r.set("nexvora:proxies", proxies);
}

export async function addProxy(proxy: string): Promise<void> {
  const proxies = await getProxies();
  if (!proxies.includes(proxy)) {
    proxies.push(proxy);
    await setProxies(proxies);
  }
}

export async function removeProxy(index: number): Promise<void> {
  const proxies = await getProxies();
  proxies.splice(index, 1);
  await setProxies(proxies);
}

// ============ ANNOUNCEMENTS ============

export interface Announcement {
  id: string;
  message: string;
  type: "info" | "warning" | "error";
  active: boolean;
  createdAt: string;
}

export async function getAnnouncements(): Promise<Announcement[]> {
  const r = getRedis();
  if (!r) return [];
  const announcements = await r.get<Announcement[]>("nexvora:announcements");
  return announcements || [];
}

export async function setAnnouncements(announcements: Announcement[]): Promise<void> {
  const r = getRedis();
  if (!r) return;
  await r.set("nexvora:announcements", announcements);
}

export async function getActiveAnnouncements(): Promise<Announcement[]> {
  const announcements = await getAnnouncements();
  return announcements.filter((a) => a.active);
}

// ============ REQUEST LOGGING ============

export interface RequestLog {
  id: string;
  timestamp: string;
  provider: "magnific" | "leonardo";
  feature: string;
  model?: string;
  proxyUsed: string | null;
  status: "success" | "failed";
  latency: number;
  error?: string;
}

export async function logRequest(log: RequestLog): Promise<void> {
  const r = getRedis();
  if (!r) return;

  // Store in a list, keep max 200 entries
  const logs = await r.get<RequestLog[]>("nexvora:request-logs") || [];
  logs.unshift(log);
  if (logs.length > 200) logs.length = 200;
  await r.set("nexvora:request-logs", logs);

  // Increment counters
  const today = new Date().toISOString().slice(0, 10);
  const counterKey = `nexvora:counter:${today}`;
  const counters = await r.get<Record<string, number>>(counterKey) || {};
  counters[log.feature] = (counters[log.feature] || 0) + 1;
  counters["total"] = (counters["total"] || 0) + 1;
  await r.set(counterKey, counters, { ex: 86400 * 7 }); // expire after 7 days
}

export async function getRequestLogs(): Promise<RequestLog[]> {
  const r = getRedis();
  if (!r) return [];
  return await r.get<RequestLog[]>("nexvora:request-logs") || [];
}

export async function getTodayCounters(): Promise<Record<string, number>> {
  const r = getRedis();
  if (!r) return {};
  const today = new Date().toISOString().slice(0, 10);
  return await r.get<Record<string, number>>(`nexvora:counter:${today}`) || {};
}

export interface SystemStatus {
  magnific: "up" | "down" | "unknown";
  leonardo: "up" | "down" | "unknown";
  lastChecked: string;
}

export async function getSystemStatus(): Promise<SystemStatus> {
  const r = getRedis();
  if (!r) return { magnific: "unknown", leonardo: "unknown", lastChecked: "" };
  const status = await r.get<SystemStatus>("nexvora:system-status");
  return status || { magnific: "unknown", leonardo: "unknown", lastChecked: "" };
}

export async function setSystemStatus(status: SystemStatus): Promise<void> {
  const r = getRedis();
  if (!r) return;
  await r.set("nexvora:system-status", status);
}
