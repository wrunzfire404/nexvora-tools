/**
 * Leonardo AI API client helper
 * Unified endpoint for all models — image gen, video gen, upscale
 */

const LEONARDO_API = "/api/leonardo";

export interface LeonardoGenerationResult {
  generationId: string;
  status: string;
  imageUrl?: string;
  videoUrl?: string;
  error?: string;
}

/**
 * Submit a generation request to Leonardo AI
 */
export async function leonardoGenerate(
  apiKey: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; generationId?: string; error?: string }> {
  const response = await fetch(LEONARDO_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-leonardo-key": apiKey },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    return { ok: false, error: data.error || `Error ${response.status}` };
  }

  // Leonardo returns generation ID in various formats
  const generationId =
    data?.generate?.generationId ||
    data?.sdGenerationJob?.generationId ||
    data?.generations_by_pk?.id ||
    data?.generationId ||
    data?.id;

  if (!generationId) {
    return { ok: false, error: "No generation ID returned" };
  }

  return { ok: true, generationId };
}

/**
 * Poll Leonardo generation until complete
 */
export async function leonardoPoll(
  apiKey: string,
  generationId: string,
  options: {
    interval?: number;
    timeout?: number;
    onStatusChange?: (status: string) => void;
  } = {}
): Promise<LeonardoGenerationResult> {
  const { interval = 5000, timeout = 900000, onStatusChange } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    await new Promise((r) => setTimeout(r, interval));

    const response = await fetch(`${LEONARDO_API}?id=${generationId}`, {
      headers: { "x-leonardo-key": apiKey },
    });

    if (!response.ok) continue;

    const data = await response.json();
    const gen = data?.generations_by_pk || data;
    const status = gen?.status;

    if (status) onStatusChange?.(status);

    if (status === "COMPLETE") {
      // Extract result URL
      const images = gen?.generated_images || [];
      const imageUrl = images[0]?.url;
      const videoUrl = gen?.motion_mp4_url || images[0]?.motionMP4URL || images[0]?.url;

      return {
        generationId,
        status: "COMPLETE",
        imageUrl: imageUrl || undefined,
        videoUrl: videoUrl || undefined,
      };
    }

    if (status === "FAILED") {
      return { generationId, status: "FAILED", error: "Generation failed" };
    }
  }

  return { generationId, status: "TIMEOUT", error: "Generation timed out" };
}

/**
 * Get Leonardo API key from localStorage
 */
export function getLeonardoKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("nexvora-leonardo-key") || "";
}


/**
 * Upload image to Leonardo AI and get image ID for use in generations
 */
export async function leonardoUploadImage(
  apiKey: string,
  file: File
): Promise<{ ok: boolean; imageId?: string; error?: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/leonardo/upload", {
    method: "POST",
    headers: { "x-leonardo-key": apiKey },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok || !data.imageId) {
    return { ok: false, error: data.error || "Upload failed" };
  }

  return { ok: true, imageId: data.imageId };
}
