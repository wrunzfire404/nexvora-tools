import { ProxyAgent, fetch as undiciFetch, type RequestInit as UndiciRequestInit } from "undici";

/**
 * Fetch through a proxy using undici ProxyAgent
 * Returns { response, proxyUsed }
 * 
 * If proxy fails: throws error (does NOT fallback to direct)
 * Use regular fetch() for direct connections
 */
export async function proxyFetch(
  url: string,
  options: RequestInit & { proxy?: string } = {}
): Promise<{ response: Response; proxyUsed: string | null }> {
  const { proxy, ...fetchOptions } = options;

  if (!proxy) {
    const response = await fetch(url, fetchOptions);
    return { response, proxyUsed: null };
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

  // DO NOT fallback — if proxy fails, throw error
  const response = await undiciFetch(url, {
    ...(fetchOptions as UndiciRequestInit),
    dispatcher,
  });

  return { response: response as unknown as Response, proxyUsed: proxyUri };
}
