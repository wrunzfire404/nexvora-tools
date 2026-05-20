import { ProxyAgent, fetch as undiciFetch } from "undici";

/**
 * Fetch through a proxy using undici (which actually supports proxies in fetch)
 * Native Node fetch does NOT support agent/proxy — this is the proper way.
 */
export async function proxyFetch(
  url: string,
  options: RequestInit & { proxy?: string } = {}
): Promise<Response> {
  const { proxy, ...fetchOptions } = options;

  if (!proxy) {
    // No proxy — direct fetch
    return fetch(url, fetchOptions);
  }

  // Parse proxy URL to get auth
  const proxyUrl = new URL(proxy.startsWith("http") ? proxy : `http://${proxy}`);
  
  const dispatcher = new ProxyAgent({
    uri: `${proxyUrl.protocol}//${proxyUrl.hostname}:${proxyUrl.port}`,
    token: proxyUrl.username && proxyUrl.password
      ? `Basic ${Buffer.from(`${proxyUrl.username}:${proxyUrl.password}`).toString("base64")}`
      : undefined,
  });

  const response = await undiciFetch(url, {
    ...fetchOptions,
    dispatcher,
  } as Parameters<typeof undiciFetch>[1]);

  // Convert undici Response to standard Response
  return response as unknown as Response;
}
