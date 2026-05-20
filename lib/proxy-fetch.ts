import { ProxyAgent, fetch as undiciFetch, type RequestInit as UndiciRequestInit } from "undici";

/**
 * Fetch through a proxy using undici ProxyAgent
 */
export async function proxyFetch(
  url: string,
  options: RequestInit & { proxy?: string } = {}
): Promise<Response> {
  const { proxy, ...fetchOptions } = options;

  if (!proxy) {
    return fetch(url, fetchOptions);
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

    return response as unknown as Response;
  } catch (err) {
    // If proxy fails, fallback to direct connection
    console.warn(`Proxy failed (${proxyUri}), using direct connection:`, (err as Error).message);
    return fetch(url, fetchOptions);
  }
}
