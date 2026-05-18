"use client";

import { useState, useCallback, useEffect } from "react";
import { Video, Loader2 } from "lucide-react";
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
import { POLL_INTERVALS, POLL_TIMEOUTS } from "@/lib/constants";
import { isLikelyNonEnglish, translatePromptToEnglish } from "@/lib/translate";

const VIDEO_MODELS = [
  {
    id: "kling-v2-6-pro",
    name: "Kling 2.6 Pro",
    description: "Best quality",
    endpoint: "/v1/ai/image-to-video/kling-v2-6-pro",
    pollEndpoint: "/v1/ai/image-to-video/kling-v2-6",
    rateKey: "video-kling-pro",
    maxPerDay: 11,
  },
  {
    id: "kling-v2-6-std",
    name: "Kling 2.6 Standard",
    description: "Good quality, faster",
    endpoint: "/v1/ai/image-to-video/kling-v2-6-std",
    pollEndpoint: "/v1/ai/image-to-video/kling-v2-6",
    rateKey: "video-kling-standard",
    maxPerDay: 20,
  },
  {
    id: "kling-pro",
    name: "Kling 1.6 Pro",
    description: "Reliable",
    endpoint: "/v1/ai/image-to-video/kling-pro",
    pollEndpoint: "/v1/ai/image-to-video/kling-pro",
    rateKey: "video-kling-pro",
    maxPerDay: 11,
  },
  {
    id: "kling-std",
    name: "Kling 1.6 Standard",
    description: "Fast, basic",
    endpoint: "/v1/ai/image-to-video/kling-std",
    pollEndpoint: "/v1/ai/image-to-video/kling-std",
    rateKey: "video-kling-standard",
    maxPerDay: 20,
  },
];

export default function VideoPage() {
  const { apiKey } = useAuthStore();
  const { addTask, updateTask } = useTaskStore();
  const { decrement, isExhausted, resetIfNewDay } = useRateLimitStore();
  const { addItem } = useHistoryStore();

  const [selectedModel, setSelectedModel] = useState(VIDEO_MODELS[0].id);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState<string>("5");
  const [status, setStatus] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const model = VIDEO_MODELS.find((m) => m.id === selectedModel)!;

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

  // Upload to catbox for public URL
  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/upload", { method: "POST", body: formData });
    if (!response.ok) throw new Error("Upload failed");
    const data = await response.json();
    return data.url;
  };

  const handleGenerate = useCallback(async () => {
    if (!apiKey || !selectedImage) return;
    if (isExhausted(model.rateKey)) { setError("Daily quota exhausted."); return; }

    setIsSubmitting(true); setStatus("PENDING"); setResultUrl(null); setError(null);

    try {
      // Auto-translate
      let finalPrompt = prompt.trim();
      if (finalPrompt && isLikelyNonEnglish(finalPrompt)) {
        const { translated } = await translatePromptToEnglish(finalPrompt, apiKey);
        finalPrompt = translated;
      }
      if (finalPrompt) {
        finalPrompt = `High quality video, smooth motion, professional. ${finalPrompt}`;
      }

      // Upload image to get public URL
      const imageUrl = await uploadFile(selectedImage);

      // Build body — use image_url (public URL)
      const body: Record<string, unknown> = {
        image: imageUrl,
        duration,
        cfg_scale: 0.5,
        negative_prompt: "blur, distort, low quality",
      };
      if (finalPrompt) body.prompt = finalPrompt;

      const response = await submitTask(model.endpoint, body, apiKey);

      if (!response.ok) {
        setError(response.error || "Failed to submit");
        setStatus("FAILED"); setIsSubmitting(false);
        return;
      }

      const taskId = response.data!.data.task_id;
      decrement(model.rateKey);

      addTask({
        id: crypto.randomUUID(), taskId, type: "video-generation", status: "PROCESSING",
        endpoint: model.pollEndpoint, params: { prompt: finalPrompt, duration },
        createdAt: new Date().toISOString(),
      });

      setStatus("PROCESSING"); setIsSubmitting(false);

      pollTask({
        taskId, endpoint: model.pollEndpoint, apiKey,
        interval: POLL_INTERVALS.video, timeout: POLL_TIMEOUTS.video,
        onStatusChange: (s) => setStatus(s),
        onComplete: (result) => {
          const url = result.url || result.urls?.[0];
          setResultUrl(url || null); setStatus("COMPLETED");
          updateTask(taskId, { status: "COMPLETED", resultUrl: url, completedAt: new Date().toISOString() });
          if (url) addItem({ id: crypto.randomUUID(), taskType: "video-generation", resultUrl: url, resultType: "video", params: { prompt: finalPrompt }, createdAt: new Date().toISOString() });
        },
        onError: (err) => { setError(err); setStatus("FAILED"); updateTask(taskId, { status: "FAILED", error: err }); },
      });
    } catch (err) {
      setError("Failed. Check connection and try again.");
      setStatus("FAILED"); setIsSubmitting(false);
    }
  }, [apiKey, selectedImage, prompt, model, duration, isExhausted, decrement, addTask, updateTask, addItem]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Video className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Image to Video</h1>
          <p className="text-sm text-muted-foreground">Animate foto jadi video dengan AI</p>
        </div>
      </div>

      <div className="mb-6 p-3 rounded-lg bg-accent/30 border border-border text-sm text-muted-foreground">
        💡 <strong>Apa ini?</strong> Upload foto (produk, orang, pemandangan, apapun) dan AI akan bikin video dari foto tersebut. Cocok buat animate foto produk, bikin content social media, atau preview animasi.
      </div>

      {!apiKey && (
        <div className="mb-4 p-4 rounded-lg border border-primary/30 bg-primary/5">
          <p className="text-sm font-medium">🔑 API Key belum diset</p>
          <p className="text-xs text-muted-foreground mt-1">Klik &quot;API Key&quot; di header untuk set.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* Model */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Model</label>
            <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              {VIDEO_MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.name} — {m.description} ({m.maxPerDay}/day)</option>
              ))}
            </select>
          </div>

          {/* Image */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Foto yang mau di-animate</label>
            <ImageUpload onImageSelect={handleImageSelect} onImageRemove={handleImageRemove} selectedImage={selectedImage} previewUrl={previewUrl} />
          </div>

          {/* Prompt */}
          <PromptInput value={prompt} onChange={setPrompt} maxLength={2500}
            placeholder="Deskripsi gerakan: produk berputar 360, orang berjalan, kamera zoom in..." />

          {/* Duration */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Durasi</label>
            <div className="grid grid-cols-2 gap-2">
              {["5", "10"].map((d) => (
                <button key={d} onClick={() => setDuration(d)}
                  className={`px-3 py-2 rounded-lg text-sm border transition-colors ${duration === d ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}>
                  {d} detik
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleGenerate}
            disabled={!selectedImage || isSubmitting || status === "PROCESSING" || !apiKey}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {isSubmitting || status === "PROCESSING" ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Generating Video...</>
            ) : (
              "Generate Video"
            )}
          </button>

          {status === "PROCESSING" && <p className="text-xs text-muted-foreground">⏳ Video generation takes 2-5 minutes...</p>}
        </div>

        {/* Result */}
        <div className="space-y-4">
          {status && <TaskStatusBadge status={status} />}
          {error && <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">{error}</div>}
          {resultUrl && (
            <div className="space-y-3">
              <div className="rounded-lg overflow-hidden border border-border bg-muted">
                <video src={resultUrl} controls className="w-full h-auto" />
              </div>
              <DownloadButton url={resultUrl} taskType="video" extension="mp4" />
            </div>
          )}
          {!resultUrl && !status && (
            <div className="flex flex-col items-center justify-center h-64 rounded-lg border border-dashed border-border text-muted-foreground">
              <Video className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Video akan muncul di sini</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
