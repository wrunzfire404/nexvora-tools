import { NextRequest, NextResponse } from "next/server";
import { logRequest } from "@/lib/db";

const LEONARDO_BASE_URL = "https://cloud.leonardo.ai/api/rest/v2/generations";

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-leonardo-key");

    if (!apiKey) {
      return NextResponse.json({ error: "Leonardo API key required" }, { status: 401 });
    }

    const body = await request.text();
    const startTime = Date.now();

    // Leonardo: always direct (proxy HTTPS tunnel not supported)
    const response = await fetch(LEONARDO_BASE_URL, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "authorization": `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body,
    });

    const data = await response.json();

    console.log("[Leonardo POST] Response:", JSON.stringify(data).slice(0, 500));

    // Parse model from body for logging
    let model = "unknown";
    try { model = JSON.parse(body)?.model || "unknown"; } catch {}

    // Log request (non-blocking)
    logRequest({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      provider: "leonardo",
      feature: data?.generate ? "image-generation" : "video-generation",
      model,
      proxyUsed: null, // Leonardo always direct
      status: response.ok ? "success" : "failed",
      latency: Date.now() - startTime,
      error: !response.ok ? `HTTP ${response.status}` : undefined,
    }).catch(() => {});

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error || data?.message || `Leonardo API error: ${response.status}` },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Leonardo API error:", error);
    return NextResponse.json({ error: "Failed to connect to Leonardo API" }, { status: 500 });
  }
}

// GET — poll generation status
export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-leonardo-key");
    const generationId = request.nextUrl.searchParams.get("id");

    if (!apiKey) {
      return NextResponse.json({ error: "Leonardo API key required" }, { status: 401 });
    }

    if (!generationId) {
      return NextResponse.json({ error: "Generation ID required" }, { status: 400 });
    }

    // Leonardo poll: always direct
    const response = await fetch(
      `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,
      {
        headers: {
          "accept": "application/json",
          "authorization": `Bearer ${apiKey}`,
        },
      }
    );

    const data = await response.json();

    // Log when COMPLETE to see video URL structure
    if (data?.generations_by_pk?.status === "COMPLETE") {
      const gen = data.generations_by_pk;
      console.log("[Leonardo POLL COMPLETE]", JSON.stringify({
        status: gen.status,
        motion: gen.motion,
        generated_images: gen.generated_images?.map((img: Record<string, unknown>) => ({ url: img.url, motionMP4URL: img.motionMP4URL })),
        motion_mp4_url: gen.motion_mp4_url,
      }));
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error || `Leonardo API error: ${response.status}` },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Leonardo poll error:", error);
    return NextResponse.json({ error: "Failed to poll Leonardo API" }, { status: 500 });
  }
}
