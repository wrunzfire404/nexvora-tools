"use client";

import { useState, useCallback, useEffect } from "react";
import { Sun, Loader2 } from "lucide-react";
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
import { MAGNIFIC_ENDPOINTS, POLL_INTERVALS, POLL_TIMEOUTS, FILE_LIMITS } from "@/lib/constants";


const LIGHTING_PRESETS = [
  "Golden hour warm sunlight",
  "Neon cyberpunk lighting",
  "Soft studio lighting",
  "Dramatic side lighting",
  "Moonlit night scene",
  "Overcast diffused light",
];

export default function RelightPage() {
  const { apiKey } = useAuthStore();
  const { addTask, updateTask } = useTaskStore();
  const { decrement, isExhausted, resetIfNewDay } = useRateLimitStore();
  const { addItem } = useHistoryStore();

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { resetIfNewDay(); }, [resetIfNewDay]);

  const handleImageSelect = useCallback((file: File) => {
    setSelectedImage(file); setPreviewUrl(URL.createObjectURL(file));
    setResultUrl(null); setError(null); setStatus(null);
  }, []);

  const handleImageRemove = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedImage(null); setPreviewUrl(null);
  }, [previewUrl]);

  const handleRelight = useCallback(async () => {
    if (!apiKey || !selectedImage || !prompt.trim()) return;
    if (isExhausted("image-relight")) { setError("Daily quota exhausted."); return; }

    setIsSubmitting(true); setStatus("PENDING"); setResultUrl(null); setError(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      const body: Record<string, unknown> = { image: base64, prompt: prompt.trim() };

      const response = await submitTask(MAGNIFIC_ENDPOINTS["image-relight"], body, apiKey!);
      if (!response.ok) { setError(response.error || "Failed"); setStatus("FAILED"); setIsSubmitting(false); return; }

      const taskId = response.data!.data.task_id;
      decrement("image-relight");
      addTask({ id: crypto.randomUUID(), taskId, type: "image-relight", status: "PROCESSING", endpoint: MAGNIFIC_ENDPOINTS["image-relight"], params: body, createdAt: new Date().toISOString() });
      setStatus("PROCESSING"); setIsSubmitting(false);

      pollTask({
        taskId, endpoint: MAGNIFIC_ENDPOINTS["image-relight"], apiKey: apiKey!,
        interval: POLL_INTERVALS.image, timeout: POLL_TIMEOUTS.image,
        onStatusChange: (s) => setStatus(s),
        onComplete: (result) => {
          const url = result.url || result.urls?.[0];
          setResultUrl(url || null); setStatus("COMPLETED");
          updateTask(taskId, { status: "COMPLETED", resultUrl: url, completedAt: new Date().toISOString() });
          if (url) addItem({ id: crypto.randomUUID(), taskType: "image-relight", resultUrl: url, resultType: "image", params: body, createdAt: new Date().toISOString() });
        },
        onError: (err) => { setError(err); setStatus("FAILED"); updateTask(taskId, { status: "FAILED", error: err }); },
      });
    };
    reader.readAsDataURL(selectedImage);
  }, [apiKey, selectedImage, prompt, isExhausted, decrement, addTask, updateTask, addItem]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sun className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">AI Image Relight</h1>
          <p className="text-sm text-muted-foreground">Change image lighting with AI</p>
        </div>
      </div>

      <div className="mb-6 p-3 rounded-lg bg-accent/30 border border-border text-sm text-muted-foreground">
        💡 <strong>Apa ini?</strong> Ubah pencahayaan foto tanpa edit manual. Bisa bikin foto jadi golden hour, neon, studio lighting, dll. Cocok buat foto produk yang kurang cahaya, atau mau ganti mood/suasana foto.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <ImageUpload onImageSelect={handleImageSelect} onImageRemove={handleImageRemove} selectedImage={selectedImage} previewUrl={previewUrl} maxSize={FILE_LIMITS.maxSizeRelight} />

          <PromptInput value={prompt} onChange={setPrompt} maxLength={500} label="Lighting Description" placeholder="Describe the desired lighting..." rows={3} />

          {/* Presets */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Quick Presets</label>
            <div className="flex flex-wrap gap-2">
              {LIGHTING_PRESETS.map((p) => (
                <button key={p} onClick={() => setPrompt(p)} className="px-2.5 py-1 text-xs rounded-full border border-border hover:border-primary/50 hover:bg-accent/50 transition-colors">
                  {p}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleRelight} disabled={!selectedImage || !prompt.trim() || isSubmitting || status === "PROCESSING" || isExhausted("image-relight")}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {isSubmitting || status === "PROCESSING" ? <><Loader2 className="w-4 h-4 animate-spin" />Relighting...</> : "Relight Image"}
          </button>
        </div>

        <div className="space-y-4">
          {status && <TaskStatusBadge status={status} />}
          {error && <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">{error}</div>}
          {resultUrl && (
            <div className="space-y-3">
              <div className="rounded-lg overflow-hidden border border-border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resultUrl} alt="Relit" className="w-full h-auto" />
              </div>
              <DownloadButton url={resultUrl} taskType="relit" />
            </div>
          )}
          {!resultUrl && !status && (
            <div className="flex flex-col items-center justify-center h-64 rounded-lg border border-dashed border-border text-muted-foreground">
              <Sun className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Relit image will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
