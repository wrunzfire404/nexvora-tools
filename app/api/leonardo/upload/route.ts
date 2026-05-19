import { NextRequest, NextResponse } from "next/server";

/**
 * Upload image to Leonardo AI platform
 * Step 1: Get presigned URL
 * Step 2: Upload to S3
 * Step 3: Return image ID
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-leonardo-key");
    if (!apiKey) {
      return NextResponse.json({ error: "Leonardo API key required" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";

    // Step 1: Get presigned URL from Leonardo
    const initResponse = await fetch("https://cloud.leonardo.ai/api/rest/v1/init-image", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "authorization": `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ extension }),
    });

    if (!initResponse.ok) {
      const err = await initResponse.json().catch(() => null);
      return NextResponse.json({ error: err?.error || "Failed to init upload" }, { status: 500 });
    }

    const initData = await initResponse.json();
    const { url: presignedUrl, fields, id: imageId } = initData?.uploadInitImage || {};

    if (!presignedUrl || !imageId) {
      return NextResponse.json({ error: "No presigned URL returned" }, { status: 500 });
    }

    // Step 2: Upload file to S3 using presigned URL
    const uploadForm = new FormData();
    // Add all fields from presigned response
    if (fields) {
      const parsedFields = typeof fields === "string" ? JSON.parse(fields) : fields;
      for (const [key, value] of Object.entries(parsedFields)) {
        uploadForm.append(key, value as string);
      }
    }
    uploadForm.append("file", file);

    const uploadResponse = await fetch(presignedUrl, {
      method: "POST",
      body: uploadForm,
    });

    if (!uploadResponse.ok && uploadResponse.status !== 204) {
      return NextResponse.json({ error: "Failed to upload to storage" }, { status: 500 });
    }

    // Return the image ID
    return NextResponse.json({ imageId, type: "UPLOADED" });
  } catch (error) {
    console.error("Leonardo upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
