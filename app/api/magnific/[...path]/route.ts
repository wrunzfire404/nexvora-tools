import { NextRequest, NextResponse } from "next/server";
import { getNextProxy } from "@/lib/proxy-pool";
import { proxyFetch } from "@/lib/proxy-fetch";

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

    // Get outbound proxy
    const proxyUrl = getNextProxy();

    const response = await proxyFetch(targetUrl, {
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
    return NextResponse.json(
      { error: "Failed to connect to Magnific API" },
      { status: 502 }
    );
  }
}
