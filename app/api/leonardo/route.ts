import { NextRequest, NextResponse } from "next/server";

const LEONARDO_BASE_URL = "https://cloud.leonardo.ai/api/rest/v2/generations";

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-leonardo-key");

    if (!apiKey) {
      return NextResponse.json({ error: "Leonardo API key required" }, { status: 401 });
    }

    const body = await request.json();

    const response = await fetch(LEONARDO_BASE_URL, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "authorization": `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

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

    // Poll uses v1 endpoint, not v2
    const response = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, {
      headers: {
        "accept": "application/json",
        "authorization": `Bearer ${apiKey}`,
      },
    });

    const data = await response.json();

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
