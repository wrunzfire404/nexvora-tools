import { getTaskStatus } from "./api-client";

export interface PollOptions {
  taskId: string;
  endpoint: string;
  apiKey: string;
  interval: number;
  timeout: number;
  onStatusChange?: (status: string) => void;
  onComplete: (result: { url?: string; urls?: string[] }) => void;
  onError: (error: string) => void;
}

/**
 * Extract result URL(s) from various Magnific API response formats.
 * Different endpoints return results in different fields.
 */
function extractResult(data: Record<string, unknown>): { url?: string; urls?: string[] } | null {
  // Mystic: data.generated = ["url1", "url2"]
  if (data.generated && Array.isArray(data.generated) && data.generated.length > 0) {
    return { url: data.generated[0] as string, urls: data.generated as string[] };
  }

  // Some endpoints: data.image or data.images
  if (typeof data.image === "string") {
    return { url: data.image };
  }
  if (data.images && Array.isArray(data.images) && data.images.length > 0) {
    return { url: data.images[0] as string, urls: data.images as string[] };
  }

  // Video endpoints: data.video or data.videos
  if (typeof data.video === "string") {
    return { url: data.video };
  }
  if (data.videos && Array.isArray(data.videos) && data.videos.length > 0) {
    return { url: data.videos[0] as string, urls: data.videos as string[] };
  }

  // Generic: data.url or data.urls
  if (typeof data.url === "string") {
    return { url: data.url };
  }
  if (data.urls && Array.isArray(data.urls) && data.urls.length > 0) {
    return { url: data.urls[0] as string, urls: data.urls as string[] };
  }

  // Nested result object
  if (data.result && typeof data.result === "object") {
    const result = data.result as Record<string, unknown>;
    if (typeof result.url === "string") return { url: result.url };
    if (result.urls && Array.isArray(result.urls) && result.urls.length > 0) {
      return { url: result.urls[0] as string, urls: result.urls as string[] };
    }
  }

  // Prompt endpoints: data.prompt (text result, not a URL)
  if (typeof data.prompt === "string") {
    return { url: data.prompt };
  }

  return null;
}

export function pollTask(options: PollOptions): () => void {
  const {
    taskId,
    endpoint,
    apiKey,
    interval,
    timeout,
    onStatusChange,
    onComplete,
    onError,
  } = options;

  let aborted = false;
  const startTime = Date.now();

  const poll = async () => {
    if (aborted) return;

    // Check timeout
    if (Date.now() - startTime > timeout) {
      onError("Generation timed out. Please try again.");
      return;
    }

    const response = await getTaskStatus(endpoint, taskId, apiKey);

    if (aborted) return;

    if (!response.ok) {
      // Retry on transient errors
      if (response.status === 0 || response.status >= 500) {
        setTimeout(poll, interval);
        return;
      }
      onError(response.error || "Failed to check task status");
      return;
    }

    const data = response.data!.data;
    const status = data.status;

    onStatusChange?.(status);

    if (status === "COMPLETED") {
      const result = extractResult(data as unknown as Record<string, unknown>);
      if (result) {
        onComplete(result);
      } else {
        // Log the full response for debugging
        console.warn("Task completed but could not extract result from:", data);
        onError("Task completed but no result could be extracted. Check console for details.");
      }
      return;
    }

    if (status === "FAILED") {
      onError(data.error || "Generation failed");
      return;
    }

    // Still processing (CREATED, IN_PROGRESS, etc.), poll again
    setTimeout(poll, interval);
  };

  // Start polling after first interval
  setTimeout(poll, interval);

  // Return abort function
  return () => {
    aborted = true;
  };
}
