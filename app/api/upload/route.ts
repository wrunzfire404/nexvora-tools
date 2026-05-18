import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (100MB max)
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 100MB)" }, { status: 400 });
    }

    // Try Vercel Blob first (production with token configured)
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { put } = await import("@vercel/blob");
        const blob = await put(file.name, file, { access: "public" });
        return NextResponse.json({ url: blob.url });
      } catch (e) {
        console.warn("Vercel Blob failed, trying catbox:", e);
      }
    }

    // Fallback: Upload to catbox.moe (free, supports images and videos up to 200MB)
    const catboxForm = new FormData();
    catboxForm.append("reqtype", "fileupload");
    catboxForm.append("fileToUpload", file);

    const catboxResponse = await fetch("https://catbox.moe/user/api.php", {
      method: "POST",
      body: catboxForm,
    });

    if (catboxResponse.ok) {
      const url = await catboxResponse.text();
      if (url.startsWith("https://")) {
        return NextResponse.json({ url: url.trim() });
      }
    }

    // If catbox fails, try litterbox (temporary, 1 hour)
    const litterboxForm = new FormData();
    litterboxForm.append("reqtype", "fileupload");
    litterboxForm.append("time", "1h");
    litterboxForm.append("fileToUpload", file);

    const litterboxResponse = await fetch("https://litterbox.catbox.moe/resources/internals/api.php", {
      method: "POST",
      body: litterboxForm,
    });

    if (litterboxResponse.ok) {
      const url = await litterboxResponse.text();
      if (url.startsWith("https://")) {
        return NextResponse.json({ url: url.trim() });
      }
    }

    return NextResponse.json(
      { error: "All upload methods failed. Please try again." },
      { status: 500 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
