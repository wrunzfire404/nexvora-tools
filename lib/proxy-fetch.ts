import { ProxyAgent, fetch as undiciFetch, type RequestInit as UndiciRequestInit } from "undici";

/**
 * Fetch through a proxy using undici ProxyAgent
 * Returns response + info about proxy used
 */
export async function proxyFetch(
  url: string,
  options: RequestInit & { proxy?: string } = {}
): Promise<Response & { __proxyUsed?: string | null }> {
  const { proxy, ...fetchOptions } = options;

  if (!proxy) {
    const res = fetch(url, fetchOptions) as Promise<Response & { __proxyUsed?: string | null }>;
    return res.then(r => { (r as Response & { __proxyUsed?: string | null }).__proxyUsed = null; return r; });
  }

  // Parse proxy - format: http://user:pass@host:port or user:pass@host:port
  let proxyUri: string;
  let proxyAuth: string | undefined;

  try {
    const fullProxy = proxy.startsWith("http") ? proxy : `http://${proxy}`;
    const parsed = new URL(fullProxy);
    proxyUri = `http://${parsed.hostname}:${parsed.port}`;

    if (parsed.username && parsed.password) {
      proxyAuth = `Basic ${Buffer.from(`${decodeURIComponent(parsed.username)}:${decodeURIComponent(parsed.password)}`).toString("base64")}`;
    }
  } catch {
    proxyUri = proxy.startsWith("http") ? proxy : `http://${proxy}`;
  }

  const dispatcher = new ProxyAgent({
    uri: proxyUri,
    token: proxyAuth,
  });

  try {
    const response = await undiciFetch(url, {
      ...(fetchOptions as UndiciRequestInit),
      dispatcher,
    });

    const res = response as unknown as Response & { __proxyUsed?: string | null };
    res.__proxyUsed = proxyUri;
    return res;
  } catch (err) {
    // If proxy fails, fallback to direct connection
    console.warn(`Proxy failed (${proxyUri}), using direct connection:`, (err as Error).message);
    const res = await fetch(url, fetchOptions) as Response & { __proxyUsed?: string | null };
    res.__proxyUsed = null;
    return res;
  }
}
