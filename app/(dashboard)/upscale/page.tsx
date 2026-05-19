"use client";

import { useState, useCallback, useEffect } from "react";
import { ZoomIn, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useTaskStore } from "@/stores/task-store";
import { useRateLimitStore } from "@/stores/rate-limit-store";
import { useHistoryStore } from "@/stores/history-store";
import { submitTask } from "@/lib/api-client";
import { pollTask } from "@/lib/task-poller";
import { ImageUpload } from "@/components/shared/image-upload";
import { PromptInput } from "@/components/shared/prompt-input";
import { DownloadButton } from "@/components/shared/download-button";
import { TaskStatusBadge } from "@/components/shared/task-status";
import { MAGNIFIC_ENDPOINTS, POLL_INTERVALS, POLL_TIMEOUTS } from "@/lib/constants";


type UpscaleMode = "creative" | "precision-v1" | "precision-v2";

export default function UpscalePage() {
  const { apiKey } = useAuthStore();
  const { addTask, updateTask } = useTaskStore();
  const { decrement, isExhausted, resetIfNewDay } = useRateLimitStore();
  const { addItem } = useHistoryStore();

  const [mode, setMode] = useState<UpscaleMode>("creative");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [creativity, setCreativity] = useState(3);
  const [status, setStatus] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    resetIfNewDay();
  }, [resetIfNewDay]);

  const rateKey = mode === "creative" ? "image-upscaler" : "image-upscaler-precision";

  const handleImageSelect = useCallback((file: File) => {
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResultUrl(null);
    setError(null);
    setStatus(null);
  }, []);

  const handleImageRemove = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedImage(null);
    setPreviewUrl(null);
  }, [previewUrl]);

  const handleUpscale = useCallback(async () => {
    if (!apiKey || !selectedImage) return;
    if (isExhausted(rateKey)) {
      setError("Daily quota exhausted.");
      return;
    }

    setIsSubmitting(true);
    setStatus("PENDING");
    setResultUrl(null);
    setError(null);

    // Convert image to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      const endpoint =
        mode === "creative"
          ? MAGNIFIC_ENDPOINTS["upscaler-creative"]
          : MAGNIFIC_ENDPOINTS["upscaler-precision"];

      const body: Record<string, unknown> = { image: base64 };
      if (mode === "creative") {
        body.creativity = creativity;
        if (prompt.trim()) body.prompt = prompt.trim();
      }

      const response = await submitTask(endpoint, body, apiKey);

      if (!response.ok) {
        setError(response.error || "Failed to submit");
        setStatus("FAILED");
        setIsSubmitting(false);
        return;
      }

      const taskId = response.data!.data.task_id;
      decrement(rateKey);

      addTask({
        id: crypto.randomUUID(),
        taskId,
        type: "image-upscale",
        status: "PROCESSING",
        endpoint,
        params: body,
        createdAt: new Date().toISOString(),
      });

      setStatus("PROCESSING");
      setIsSubmitting(false);

      pollTask({
        taskId,
        endpoint,
        apiKey,
        interval: POLL_INTERVALS.image,
        timeout: POLL_TIMEOUTS.image,
        onStatusChange: (s) => setStatus(s),
        onComplete: (result) => {
          const url = result.url || result.urls?.[0];
          setResultUrl(url || null);
          setStatus("COMPLETED");
          updateTask(taskId, { status: "COMPLETED", resultUrl: url, completedAt: new Date().toISOString() });
          if (url) {
            addItem({
              id: crypto.randomUUID(),
              taskType: "image-upscale",
              resultUrl: url,
              resultType: "image",
              params: { mode, creativity, prompt },
              createdAt: new Date().toISOString(),
            });
          }
        },
        onError: (err) => {
          setError(err);
          setStatus("FAILED");
          updateTask(taskId, { status: "FAILED", error: err });
        },
      });
    };
    reader.readAsDataURL(selectedImage);
  }, [apiKey, selectedImage, mode, creativity, prompt, rateKey, isExhausted, decrement, addTask, updateTask, addItem]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <ZoomIn className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">AI Image Upscaler</h1>
          <p className="text-sm text-muted-foreground">Enhance image resolution with AI</p>
        </div>
      </div>

      <div className="mb-6 p-3 rounded-lg bg-accent/30 border border-border text-sm text-muted-foreground">
        💡 <strong>Apa ini?</strong> Naikin resolusi gambar yang blur/pecah jadi lebih tajam dan jernih. Cocok buat foto lama, screenshot, atau gambar kecil yang mau diperbesar tanpa pecah. Mode <em>Precision</em> = persis sama cuma lebih tajam. Mode <em>Creative</em> = AI tambah detail baru (bisa ubah sedikit).
        <br /><span className="text-[10px] mt-1 inline-block">🟣 Fitur ini hanya tersedia dengan Magnific API key.</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* Mode Selector */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {(["creative", "precision-v1", "precision-v2"] as UpscaleMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                    mode === m
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {m === "creative" ? "Creative" : m === "precision-v1" ? "Precision v1" : "Precision v2"}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {mode === "creative"
                ? "⚠️ Creative mode reimagines the image — may change faces, text, and details. Use for artistic enhancement."
                : "✓ Precision mode faithfully upscales without changing content. Best for photos and screenshots."}
            </p>
          </div>

          {/* Image Upload */}
          <ImageUpload
            onImageSelect={handleImageSelect}
            onImageRemove={handleImageRemove}
            selectedImage={selectedImage}
            previewUrl={previewUrl}
          />

          {/* Creative mode controls */}
          {mode === "creative" && (
            <>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Creativity Level: {creativity}
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={creativity}
                  onChange={(e) => setCreativity(parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
              <PromptInput
                value={prompt}
                onChange={setPrompt}
                maxLength={1000}
                label="Prompt (optional)"
                placeholder="Guide the upscaling style..."
                rows={2}
              />
            </>
          )}

          <button
            onClick={handleUpscale}
            disabled={!selectedImage || isSubmitting || status === "PROCESSING" || isExhausted(rateKey)}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting || status === "PROCESSING" ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Upscaling...</>
            ) : (
              "Upscale Image"
            )}
          </button>
        </div>

        {/* Result */}
        <div className="space-y-4">
          {status && <TaskStatusBadge status={status} />}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">{error}</div>
          )}
          {resultUrl && (
            <div className="space-y-3">
              <div className="rounded-lg overflow-hidden border border-border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resultUrl} alt="Upscaled" className="w-full h-auto" />
              </div>
              <DownloadButton url={resultUrl} taskType="upscaled" />
            </div>
          )}
          {!resultUrl && !status && (
            <div className="flex flex-col items-center justify-center h-64 rounded-lg border border-dashed border-border text-muted-foreground">
              <ZoomIn className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Upscaled image will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
