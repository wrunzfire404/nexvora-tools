"use client";

import { useState, useCallback, useEffect } from "react";
import { Expand, Loader2 } from "lucide-react";
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


export default function ExpandPage() {
  const { apiKey } = useAuthStore();
  const { addTask, updateTask } = useTaskStore();
  const { decrement, isExhausted, resetIfNewDay } = useRateLimitStore();
  const { addItem } = useHistoryStore();

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [expandTop, setExpandTop] = useState(0);
  const [expandBottom, setExpandBottom] = useState(0);
  const [expandLeft, setExpandLeft] = useState(0);
  const [expandRight, setExpandRight] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { resetIfNewDay(); }, [resetIfNewDay]);

  const handleImageSelect = useCallback((file: File) => {
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResultUrl(null); setError(null); setStatus(null);
  }, []);

  const handleImageRemove = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedImage(null); setPreviewUrl(null);
  }, [previewUrl]);

  const hasExpansion = expandTop > 0 || expandBottom > 0 || expandLeft > 0 || expandRight > 0;

  const handleExpand = useCallback(async () => {
    if (!apiKey || !selectedImage || !hasExpansion) return;
    if (isExhausted("image-expand")) { setError("Daily quota exhausted."); return; }

    setIsSubmitting(true); setStatus("PENDING"); setResultUrl(null); setError(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      const body: Record<string, unknown> = { image: base64 };
      if (expandTop > 0) body.top = expandTop;
      if (expandBottom > 0) body.bottom = expandBottom;
      if (expandLeft > 0) body.left = expandLeft;
      if (expandRight > 0) body.right = expandRight;
      if (prompt.trim()) body.prompt = prompt.trim();

      const response = await submitTask(MAGNIFIC_ENDPOINTS["image-expand"], body, apiKey!);
      if (!response.ok) { setError(response.error || "Failed"); setStatus("FAILED"); setIsSubmitting(false); return; }

      const taskId = response.data!.data.task_id;
      decrement("image-expand");
      addTask({ id: crypto.randomUUID(), taskId, type: "image-expand", status: "PROCESSING", endpoint: MAGNIFIC_ENDPOINTS["image-expand"], params: body, createdAt: new Date().toISOString() });
      setStatus("PROCESSING"); setIsSubmitting(false);

      pollTask({
        taskId, endpoint: MAGNIFIC_ENDPOINTS["image-expand"], apiKey: apiKey!,
        interval: POLL_INTERVALS.image, timeout: POLL_TIMEOUTS.image,
        onStatusChange: (s) => setStatus(s),
        onComplete: (result) => {
          const url = result.url || result.urls?.[0];
          setResultUrl(url || null); setStatus("COMPLETED");
          updateTask(taskId, { status: "COMPLETED", resultUrl: url, completedAt: new Date().toISOString() });
          if (url) addItem({ id: crypto.randomUUID(), taskType: "image-expand", resultUrl: url, resultType: "image", params: body, createdAt: new Date().toISOString() });
        },
        onError: (err) => { setError(err); setStatus("FAILED"); updateTask(taskId, { status: "FAILED", error: err }); },
      });
    };
    reader.readAsDataURL(selectedImage);
  }, [apiKey, selectedImage, hasExpansion, expandTop, expandBottom, expandLeft, expandRight, prompt, isExhausted, decrement, addTask, updateTask, addItem]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Expand className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">AI Image Expand</h1>
          <p className="text-sm text-muted-foreground">Extend image boundaries with AI outpainting</p>
        </div>
      </div>

      <div className="mb-6 p-3 rounded-lg bg-accent/30 border border-border text-sm text-muted-foreground">
        💡 <strong>Apa ini?</strong> Perluas gambar ke arah mana pun (atas, bawah, kiri, kanan). AI akan &quot;melanjutkan&quot; gambar di area yang diperluas. Cocok buat foto yang terlalu sempit/crop, mau dijadiin wallpaper, atau butuh ruang lebih untuk desain.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <ImageUpload onImageSelect={handleImageSelect} onImageRemove={handleImageRemove} selectedImage={selectedImage} previewUrl={previewUrl} />

          {/* Expansion controls */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Top", value: expandTop, set: setExpandTop },
              { label: "Bottom", value: expandBottom, set: setExpandBottom },
              { label: "Left", value: expandLeft, set: setExpandLeft },
              { label: "Right", value: expandRight, set: setExpandRight },
            ].map(({ label, value, set }) => (
              <div key={label}>
                <label className="text-sm font-medium">{label}: {value}px</label>
                <input type="range" min="0" max="2048" step="32" value={value} onChange={(e) => set(parseInt(e.target.value))} className="w-full accent-primary" />
              </div>
            ))}
          </div>

          <PromptInput value={prompt} onChange={setPrompt} maxLength={500} label="Prompt (optional)" placeholder="Describe what should fill the expanded area..." rows={2} />

          <button onClick={handleExpand} disabled={!selectedImage || !hasExpansion || isSubmitting || status === "PROCESSING" || isExhausted("image-expand")}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {isSubmitting || status === "PROCESSING" ? <><Loader2 className="w-4 h-4 animate-spin" />Expanding...</> : "Expand Image"}
          </button>
        </div>

        <div className="space-y-4">
          {status && <TaskStatusBadge status={status} />}
          {error && <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">{error}</div>}
          {resultUrl && (
            <div className="space-y-3">
              <div className="rounded-lg overflow-hidden border border-border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resultUrl} alt="Expanded" className="w-full h-auto" />
              </div>
              <DownloadButton url={resultUrl} taskType="expanded" />
            </div>
          )}
          {!resultUrl && !status && (
            <div className="flex flex-col items-center justify-center h-64 rounded-lg border border-dashed border-border text-muted-foreground">
              <Expand className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Expanded image will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
