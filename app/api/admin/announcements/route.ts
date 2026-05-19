import { NextRequest, NextResponse } from "next/server";
import { getAnnouncements, setAnnouncements, type Announcement } from "@/lib/db";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "nexvora-admin-2024";

function checkAuth(request: NextRequest): boolean {
  const auth = request.headers.get("x-admin-key");
  return auth === ADMIN_PASSWORD;
}

// GET — get all announcements (public — no auth needed for active ones)
export async function GET(request: NextRequest) {
  const isAdmin = checkAuth(request);
  const announcements = await getAnnouncements();

  if (isAdmin) {
    return NextResponse.json({ announcements });
  }

  // Public: only return active ones
  return NextResponse.json({
    announcements: announcements.filter((a) => a.active),
  });
}

// POST — create/update announcement (admin only)
export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const announcements = await getAnnouncements();

  if (body.action === "add") {
    const newAnnouncement: Announcement = {
      id: crypto.randomUUID(),
      message: body.message || "",
      type: body.type || "info",
      active: true,
      createdAt: new Date().toISOString(),
    };
    announcements.unshift(newAnnouncement);
    await setAnnouncements(announcements);
    return NextResponse.json({ success: true, announcement: newAnnouncement });
  }

  if (body.action === "toggle" && body.id) {
    const idx = announcements.findIndex((a) => a.id === body.id);
    if (idx >= 0) {
      announcements[idx].active = !announcements[idx].active;
      await setAnnouncements(announcements);
    }
    return NextResponse.json({ success: true });
  }

  if (body.action === "delete" && body.id) {
    const filtered = announcements.filter((a) => a.id !== body.id);
    await setAnnouncements(filtered);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
