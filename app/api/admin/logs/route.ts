import { NextRequest, NextResponse } from "next/server";
import { getRequestLogs, getTodayCounters } from "@/lib/db";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "reza1254";

export async function GET(request: NextRequest) {
  const auth = request.headers.get("x-admin-key");
  if (auth !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [logs, counters] = await Promise.all([
    getRequestLogs(),
    getTodayCounters(),
  ]);

  return NextResponse.json({ logs, counters });
}
