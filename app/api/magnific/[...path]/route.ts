import { NextRequest, NextResponse } from "next/server";

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

    let body: string | ArrayBuffer | null = null;

    if (request.method === "POST") {
      if (contentType?.includes("multipart/form-data")) {
        // For multipart, pass the raw body
        body = await request.arrayBuffer();
        // Remove content-type so fetch can set it with boundary
        delete headers["Content-Type"];
      } else {
        body = await request.text();
      }
    }

    console.log(`[Proxy] ${request.method} ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: body as BodyInit | null,
    });

    const responseText = await response.text();
    let responseData: unknown;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    console.log(`[Proxy] Response ${response.status}:`, JSON.stringify(responseData).slice(0, 500));

    return NextResponse.json(responseData ?? { error: "Empty response" }, {
      status: response.status,
      headers: {
        "x-ratelimit-remaining":
          response.headers.get("x-ratelimit-remaining") ?? "",
        "x-ratelimit-limit":
          response.headers.get("x-ratelimit-limit") ?? "",
        "x-ratelimit-reset":
          response.headers.get("x-ratelimit-reset") ?? "",
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
