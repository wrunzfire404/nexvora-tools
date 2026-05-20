import { NextRequest, NextResponse } from "next/server";
import { getProxies, setProxies, addProxy, removeProxy, getProxyEnabled, setProxyEnabled } from "@/lib/db";
import { invalidateProxyCache } from "@/lib/proxy-pool";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "reza1254";

function checkAuth(request: NextRequest): boolean {
  const auth = request.headers.get("x-admin-key");
  return auth === ADMIN_PASSWORD;
}

// GET — list all proxies + enabled status
export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [proxies, enabled] = await Promise.all([getProxies(), getProxyEnabled()]);
  return NextResponse.json({ proxies, count: proxies.length, enabled });
}

// POST — add proxy or bulk import
export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Toggle proxy on/off
  if (typeof body.enabled === "boolean") {
    await setProxyEnabled(body.enabled);
    return NextResponse.json({ success: true, enabled: body.enabled });
  }

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

// DELETE — remove proxy by index or all
export async function DELETE(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (body.all) {
    await setProxies([]);
    invalidateProxyCache();
    return NextResponse.json({ success: true, message: "All proxies deleted" });
  }

  if (typeof body.index !== "number") {
    return NextResponse.json({ error: "Index required" }, { status: 400 });
  }

  await removeProxy(body.index);
  invalidateProxyCache();
  return NextResponse.json({ success: true });
}
