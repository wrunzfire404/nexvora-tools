"use client";

import { useState, useCallback, useEffect } from "react";
import { Camera, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useTaskStore } from "@/stores/task-store";
import { useRateLimitStore } from "@/stores/rate-limit-store";
import { useHistoryStore } from "@/stores/history-store";
import { submitTask } from "@/lib/api-client";
import { pollTask } from "@/lib/task-poller";
import { ImageUpload } from "@/components/shared/image-upload";
import { DownloadButton } from "@/components/shared/download-button";
import { TaskStatusBadge } from "@/components/shared/task-status";
import { MAGNIFIC_ENDPOINTS, POLL_INTERVALS, POLL_TIMEOUTS } from "@/lib/constants";


export default function CameraPage() {
  const { apiKey } = useAuthStore();
  const { addTask, updateTask } = useTaskStore();
  const { decrement, isExhausted, resetIfNewDay } = useRateLimitStore();
  const { addItem } = useHistoryStore();

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [tilt, setTilt] = useState(0);
  const [pan, setPan] = useState(0);
  const [zoom, setZoom] = useState(1.0);
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

  const handleSubmit = useCallback(async () => {
    if (!apiKey || !selectedImage) return;
    if (isExhausted("change-camera")) { setError("Daily quota exhausted."); return; }

    setIsSubmitting(true); setStatus("PENDING"); setResultUrl(null); setError(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      const body: Record<string, unknown> = { image: base64, rotation, tilt, pan, zoom };

      const response = await submitTask(MAGNIFIC_ENDPOINTS["change-camera"], body, apiKey!);
      if (!response.ok) { setError(response.error || "Failed"); setStatus("FAILED"); setIsSubmitting(false); return; }

      const taskId = response.data!.data.task_id;
      decrement("change-camera");
      addTask({ id: crypto.randomUUID(), taskId, type: "change-camera", status: "PROCESSING", endpoint: MAGNIFIC_ENDPOINTS["change-camera"], params: body, createdAt: new Date().toISOString() });
      setStatus("PROCESSING"); setIsSubmitting(false);

      pollTask({
        taskId, endpoint: MAGNIFIC_ENDPOINTS["change-camera"], apiKey: apiKey!,
        interval: POLL_INTERVALS.image, timeout: POLL_TIMEOUTS.image,
        onStatusChange: (s) => setStatus(s),
        onComplete: (result) => {
          const url = result.url || result.urls?.[0];
          setResultUrl(url || null); setStatus("COMPLETED");
          updateTask(taskId, { status: "COMPLETED", resultUrl: url, completedAt: new Date().toISOString() });
          if (url) addItem({ id: crypto.randomUUID(), taskType: "change-camera", resultUrl: url, resultType: "image", params: body, createdAt: new Date().toISOString() });
        },
        onError: (err) => { setError(err); setStatus("FAILED"); updateTask(taskId, { status: "FAILED", error: err }); },
      });
    };
    reader.readAsDataURL(selectedImage);
  }, [apiKey, selectedImage, rotation, tilt, pan, zoom, isExhausted, decrement, addTask, updateTask, addItem]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Camera className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Change Camera</h1>
          <p className="text-sm text-muted-foreground">Adjust camera angle and perspective</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <ImageUpload onImageSelect={handleImageSelect} onImageRemove={handleImageRemove} selectedImage={selectedImage} previewUrl={previewUrl} />

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Rotation: {rotation}°</label>
              <input type="range" min="-180" max="180" step="5" value={rotation} onChange={(e) => setRotation(parseInt(e.target.value))} className="w-full accent-primary" />
            </div>
            <div>
              <label className="text-sm font-medium">Vertical Tilt: {tilt}°</label>
              <input type="range" min="-90" max="90" step="5" value={tilt} onChange={(e) => setTilt(parseInt(e.target.value))} className="w-full accent-primary" />
            </div>
            <div>
              <label className="text-sm font-medium">Horizontal Pan: {pan}°</label>
              <input type="range" min="-90" max="90" step="5" value={pan} onChange={(e) => setPan(parseInt(e.target.value))} className="w-full accent-primary" />
            </div>
            <div>
              <label className="text-sm font-medium">Zoom: {zoom.toFixed(1)}x</label>
              <input type="range" min="0.5" max="3.0" step="0.1" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-full accent-primary" />
            </div>
          </div>

          <button onClick={handleSubmit} disabled={!selectedImage || isSubmitting || status === "PROCESSING" || isExhausted("change-camera")}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {isSubmitting || status === "PROCESSING" ? <><Loader2 className="w-4 h-4 animate-spin" />Processing...</> : "Change Camera"}
          </button>
        </div>

        <div className="space-y-4">
          {status && <TaskStatusBadge status={status} />}
          {error && <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">{error}</div>}
          {resultUrl && (
            <div className="space-y-3">
              <div className="rounded-lg overflow-hidden border border-border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resultUrl} alt="Camera changed" className="w-full h-auto" />
              </div>
              <DownloadButton url={resultUrl} taskType="camera" />
            </div>
          )}
          {!resultUrl && !status && (
            <div className="flex flex-col items-center justify-center h-64 rounded-lg border border-dashed border-border text-muted-foreground">
              <Camera className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Result will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
