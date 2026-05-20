import { ProxyAgent, fetch as undiciFetch, type RequestInit as UndiciRequestInit } from "undici";
import { SocksProxyAgent } from "socks-proxy-agent";
import http from "http";
import https from "https";

/**
 * Fetch through a proxy (HTTP or SOCKS5)
 * 
 * Supported formats:
 * - HTTP:   http://user:pass@ip:port
 * - SOCKS5: socks5://user:pass@ip:port
 * - Raw:    user:pass@ip:port (defaults to HTTP)
 * 
 * Returns { response, proxyUsed }
 * If proxy fails: throws error (does NOT fallback)
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

  const fullProxy = proxy.startsWith("socks") || proxy.startsWith("http") ? proxy : `http://${proxy}`;
  const isSocks = fullProxy.startsWith("socks");

  if (isSocks) {
    // SOCKS5 proxy — use socks-proxy-agent with Node http/https request
    return fetchViaSocks(url, fullProxy, fetchOptions);
  } else {
    // HTTP proxy — use undici ProxyAgent
    return fetchViaHttp(url, fullProxy, fetchOptions);
  }
}

async function fetchViaHttp(
  url: string,
  proxy: string,
  fetchOptions: RequestInit
): Promise<{ response: Response; proxyUsed: string | null }> {
  let proxyUri: string;
  let proxyAuth: string | undefined;

  try {
    const parsed = new URL(proxy);
    proxyUri = `http://${parsed.hostname}:${parsed.port}`;
    if (parsed.username && parsed.password) {
      proxyAuth = `Basic ${Buffer.from(`${decodeURIComponent(parsed.username)}:${decodeURIComponent(parsed.password)}`).toString("base64")}`;
    }
  } catch {
    proxyUri = proxy;
  }

  const dispatcher = new ProxyAgent({ uri: proxyUri, token: proxyAuth });

  const response = await undiciFetch(url, {
    ...(fetchOptions as UndiciRequestInit),
    dispatcher,
  });

  return { response: response as unknown as Response, proxyUsed: proxyUri };
}

async function fetchViaSocks(
  url: string,
  proxy: string,
  fetchOptions: RequestInit
): Promise<{ response: Response; proxyUsed: string | null }> {
  const agent = new SocksProxyAgent(proxy);
  const parsedUrl = new URL(url);
  const isHttps = parsedUrl.protocol === "https:";

  return new Promise((resolve, reject) => {
    const reqOptions: http.RequestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: fetchOptions.method || "GET",
      headers: fetchOptions.headers as Record<string, string>,
      agent,
    };

    const lib = isHttps ? https : http;
    const req = lib.request(reqOptions, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const body = Buffer.concat(chunks).toString();
        const response = new Response(body, {
          status: res.statusCode || 200,
          headers: res.headers as Record<string, string>,
        });
        resolve({ response, proxyUsed: proxy.replace(/\/\/.*@/, "//***@") });
      });
    });

    req.on("error", reject);

    if (fetchOptions.body) {
      req.write(typeof fetchOptions.body === "string" ? fetchOptions.body : JSON.stringify(fetchOptions.body));
    }
    req.end();
  });
}
