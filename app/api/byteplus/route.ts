import { NextRequest, NextResponse } from "next/server";
import { logRequest } from "@/lib/db";

const BYTEPLUS_BASE_URL = "https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks";

/**
 * BytePlus ARK API (Seedance 2.0) proxy route
 * POST - Create video generation task
 * GET  - Poll task status
 */

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-byteplus-key");

    if (!apiKey) {
      return NextResponse.json({ error: "BytePlus API key required" }, { status: 401 });
    }

    const body = await request.text();
    const startTime = Date.now();

    const response = await fetch(BYTEPLUS_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body,
    });

    const data = await response.json();

    console.log("[BytePlus POST] Response:", JSON.stringify(data).slice(0, 500));

    // Parse model from body for logging
    let model = "unknown";
    try { model = JSON.parse(body)?.model || "unknown"; } catch {}

    // Log request (non-blocking)
    logRequest({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      provider: "leonardo", // reuse provider type for logging
      feature: "byteplus-video",
      model,
      proxyUsed: null,
      status: response.ok ? "success" : "failed",
      latency: Date.now() - startTime,
      error: !response.ok ? `HTTP ${response.status}` : undefined,
    }).catch(() => {});

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || data?.message || `BytePlus API error: ${response.status}` },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("BytePlus API error:", error);
    return NextResponse.json({ error: "Failed to connect to BytePlus API" }, { status: 500 });
  }
}

// GET — poll generation task status
export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-byteplus-key");
    const taskId = request.nextUrl.searchParams.get("id");

    if (!apiKey) {
      return NextResponse.json({ error: "BytePlus API key required" }, { status: 401 });
    }

    if (!taskId) {
      return NextResponse.json({ error: "Task ID required" }, { status: 400 });
    }

    const response = await fetch(`${BYTEPLUS_BASE_URL}/${taskId}`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    const data = await response.json();

    // Log when succeeded
    if (data?.status === "succeeded") {
      console.log("[BytePlus POLL COMPLETE]", JSON.stringify({
        id: data.id,
        status: data.status,
        video_url: data.content?.video_url?.slice(0, 100),
        usage: data.usage,
      }));
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || `BytePlus API error: ${response.status}` },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("BytePlus poll error:", error);
    return NextResponse.json({ error: "Failed to poll BytePlus API" }, { status: 500 });
  }
}
