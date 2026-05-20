import { API_BASE_URL } from "./constants";

interface ApiRequestOptions {
  method?: "GET" | "POST";
  body?: Record<string, unknown> | FormData;
  apiKey: string;
  timeout?: number;
}

interface ApiResponse<T = unknown> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
  retryAfter?: number;
  rateLimit?: {
    remaining?: number;
    limit?: number;
    reset?: string;
  };
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: ApiRequestOptions
): Promise<ApiResponse<T>> {
  const { method = "POST", body, apiKey, timeout = 30000 } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // Get user proxy from localStorage if available
  const userProxy = typeof window !== "undefined" ? localStorage.getItem("nexvora-user-proxy") || "" : "";

  try {
    const headers: Record<string, string> = {
      "x-api-key": apiKey,
    };

    if (userProxy) {
      headers["x-user-proxy"] = userProxy;
    }

    let fetchBody: string | FormData | undefined;

    if (body instanceof FormData) {
      fetchBody = body;
    } else if (body) {
      headers["Content-Type"] = "application/json";
      fetchBody = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: fetchBody,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 401) {
      return { ok: false, status: 401, error: "Invalid or expired API key" };
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get("retry-after");
      return {
        ok: false,
        status: 429,
        error: "Rate limit exceeded",
        retryAfter: retryAfter ? parseInt(retryAfter, 10) : undefined,
      };
    }

    if (response.status >= 500) {
      return {
        ok: false,
        status: response.status,
        error: "Server error. Please try again later.",
      };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return {
        ok: false,
        status: response.status,
        error: errorData?.message || `Request failed with status ${response.status}`,
      };
    }

    const data = (await response.json()) as T;

    // Capture rate limit headers
    const rateLimitRemaining = response.headers.get("x-ratelimit-remaining");
    const rateLimitLimit = response.headers.get("x-ratelimit-limit");
    const rateLimitReset = response.headers.get("x-ratelimit-reset");

    return {
      ok: true,
      status: response.status,
      data,
      rateLimit: {
        remaining: rateLimitRemaining ? parseInt(rateLimitRemaining, 10) : undefined,
        limit: rateLimitLimit ? parseInt(rateLimitLimit, 10) : undefined,
        reset: rateLimitReset || undefined,
      },
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof DOMException && error.name === "AbortError") {
      return { ok: false, status: 0, error: "Request timed out" };
    }

    return {
      ok: false,
      status: 0,
      error: "Network error. Check your connection.",
    };
  }
}

export async function submitTask(
  endpoint: string,
  body: Record<string, unknown> | FormData,
  apiKey: string
) {
  return apiRequest<{ data: { task_id: string; status: string } }>(endpoint, {
    method: "POST",
    body,
    apiKey,
    timeout: 55000, // Stay within Vercel function timeout
  });
}

export async function getTaskStatus(
  endpoint: string,
  taskId: string,
  apiKey: string
) {
  return apiRequest<{
    data: {
      task_id: string;
      status: string;
      // Different APIs return results in different fields
      generated?: string[];
      result?: { url?: string; urls?: string[] };
      image?: string;
      images?: string[];
      video?: string;
      videos?: string[];
      url?: string;
      urls?: string[];
      prompt?: string;
      error?: string;
    };
  }>(`${endpoint}/${taskId}`, {
    method: "GET",
    apiKey,
    timeout: 15000,
  });
}
