import { NextRequest, NextResponse } from "next/server";
import { getNextProxyAsync } from "@/lib/proxy-pool";
import { proxyFetch } from "@/lib/proxy-fetch";
import { logRequest } from "@/lib/db";

const MAGNIFIC_BASE_URL = "https://api.freepik.com";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxy(request, await params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxy(request, await params);
}

async function handleProxy(
  request: NextRequest,
  params: { path: string[] }
) {
  const apiKey = request.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json(
      { error: "API key is required" },
      { status: 401 }
    );
  }

  const path = params.path.join("/");
  const targetUrl = `${MAGNIFIC_BASE_URL}/${path}`;

  try {
    const headers: Record<string, string> = {
      "x-freepik-api-key": apiKey,
    };

    const contentType = request.headers.get("content-type");
    if (contentType) {
      headers["Content-Type"] = contentType;
    }

    let body: string | undefined;

    if (request.method === "POST") {
      if (contentType?.includes("multipart/form-data")) {
        // For multipart — skip proxy (too complex), direct fetch
        const rawBody = await request.arrayBuffer();
        delete headers["Content-Type"];
        const response = await fetch(targetUrl, {
          method: request.method,
          headers,
          body: rawBody,
        });
        const responseData = await response.json().catch(() => null);
        return NextResponse.json(responseData ?? { error: "Empty response" }, { status: response.status });
      } else {
        body = await request.text();
      }
    }

    // Get outbound proxy (await to ensure Redis is loaded)
    const proxyUrl = await getNextProxyAsync();

    const startTime = Date.now();
    const { response, proxyUsed } = await proxyFetch(targetUrl, {
      method: request.method,
      headers,
      body,
      proxy: proxyUrl,
    });

    const responseText = await response.text();
    let responseData: unknown;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    // Log request (non-blocking)
    const feature = path.includes("mystic") ? "image-generation" :
      path.includes("image-to-video") ? "video-generation" :
      path.includes("image-upscaler") ? "upscaler" :
      path.includes("image-expand") ? "expand" :
      path.includes("image-relight") ? "relight" :
      path.includes("motion-control") ? "motion-control" :
      "other";

    if (request.method === "POST") {
      logRequest({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        provider: "magnific",
        feature,
        proxyUsed,
        status: response.status < 400 ? "success" : "failed",
        latency: Date.now() - startTime,
        error: response.status >= 400 ? `HTTP ${response.status}` : undefined,
      }).catch(() => {});
    }

    return NextResponse.json(responseData ?? { error: "Empty response" }, {
      status: response.status,
      headers: {
        "x-ratelimit-remaining": response.headers.get("x-ratelimit-remaining") ?? "",
        "x-ratelimit-limit": response.headers.get("x-ratelimit-limit") ?? "",
        "x-ratelimit-reset": response.headers.get("x-ratelimit-reset") ?? "",
        "retry-after": response.headers.get("retry-after") ?? "",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    const errMsg = (error as Error)?.message || "";
    if (errMsg.includes("Proxy") || errMsg.includes("tunnel") || errMsg.includes("407")) {
      return NextResponse.json(
        { error: "Proxy connection failed. Request dibatalkan untuk melindungi IP. Coba lagi nanti atau hubungi admin." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Failed to connect to Magnific API" },
      { status: 502 }
    );
  }
}
