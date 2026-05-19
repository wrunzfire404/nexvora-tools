import { NextRequest, NextResponse } from "next/server";
import { getProxies, setProxies, addProxy, removeProxy } from "@/lib/db";
import { invalidateProxyCache } from "@/lib/proxy-pool";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "nexvora-admin-2024";

function checkAuth(request: NextRequest): boolean {
  const auth = request.headers.get("x-admin-key");
  return auth === ADMIN_PASSWORD;
}

// GET — list all proxies
export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const proxies = await getProxies();
  return NextResponse.json({ proxies, count: proxies.length });
}

// POST — add proxy or bulk import
export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (body.bulk && Array.isArray(body.proxies)) {
    // Bulk import
    const current = await getProxies();
    const newProxies = body.proxies.filter((p: string) => p.trim() && !current.includes(p.trim()));
    await setProxies([...current, ...newProxies.map((p: string) => p.trim())]);
    invalidateProxyCache();
    return NextResponse.json({ added: newProxies.length, total: current.length + newProxies.length });
  }

  if (body.proxy) {
    await addProxy(body.proxy.trim());
    invalidateProxyCache();
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}

// DELETE — remove proxy by index
export async function DELETE(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { index } = await request.json();
  if (typeof index !== "number") {
    return NextResponse.json({ error: "Index required" }, { status: 400 });
  }

  await removeProxy(index);
  invalidateProxyCache();
  return NextResponse.json({ success: true });
}
