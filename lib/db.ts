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

// ============ SYSTEM STATUS ============

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
