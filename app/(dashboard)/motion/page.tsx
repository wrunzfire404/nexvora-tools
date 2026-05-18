"use client";

import { useState, useCallback, useEffect } from "react";
import { Move, Loader2, Upload, X, Video } from "lucide-react";
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
import { formatBytes } from "@/lib/utils";

const MOTION_MODELS = [
  {
    id: "kling-v2-6-mc-std",
    name: "Kling 2.6 Motion Standard",
    endpoint: "/v1/ai/video/kling-v2-6-motion-control-std",
    taskEndpoint: "/v1/ai/image-to-video/kling-v2-6",
    rateKey: "video-kling-mc",
  },
  {
    id: "kling-v2-6-mc-pro",
    name: "Kling 2.6 Motion Pro",
    endpoint: "/v1/ai/video/kling-v2-6-motion-control-pro",
    taskEndpoint: "/v1/ai/image-to-video/kling-v2-6",
    rateKey: "video-kling-mc",
  },
  {
    id: "kling-v3-mc-std",
    name: "Kling 3 Motion Standard",
    endpoint: "/v1/ai/video/kling-v3-motion-control-std",
    taskEndpoint: "/v1/ai/video/kling-v3-motion-control",
    rateKey: "video-kling-mc",
  },
];

export default function MotionPage() {
  const { apiKey } = useAuthStore();
  const { addTask, updateTask } = useTaskStore();
  const { decrement, isExhausted, resetIfNewDay } = useRateLimitStore();
  const { addItem } = useHistoryStore();

  const [selectedModel, setSelectedModel] = useState(MOTION_MODELS[0].id);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [cfgScale, setCfgScale] = useState(0.5);
  const [status, setStatus] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const model = MOTION_MODELS.find((m) => m.id === selectedModel)!;

  useEffect(() => { resetIfNewDay(); }, [resetIfNewDay]);

  // Image handlers
  const handleImageSelect = useCallback((file: File) => {
    setSelectedImage(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setResultUrl(null); setError(null); setStatus(null);
  }, []);

  const handleImageRemove = useCallback(() => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setSelectedImage(null); setImagePreviewUrl(null);
  }, [imagePreviewUrl]);

  // Video handlers
  const handleVideoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate video
    const validTypes = ["video/mp4", "video/webm", "video/quicktime"];
    if (!validTypes.includes(file.type)) {
      setError("Unsupported video format. Use MP4, WebM, or MOV.");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError("Video too large. Maximum 100MB.");
      return;
    }

    setSelectedVideo(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
    setError(null);
  }, []);

  const handleVideoRemove = useCallback(() => {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setSelectedVideo(null); setVideoPreviewUrl(null);
  }, [videoPreviewUrl]);

  // Upload file and get public URL
  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload file");
    }

    const data = await response.json();
    return data.url;
  };

  // Hidden system prompt for professional UGC-quality results
  const buildFinalPrompt = (userPrompt: string): string => {
    const systemPrompt = [
      "Professional UGC-style video",
      "natural and fluid human movement",
      "smooth realistic motion transfer",
      "consistent character appearance throughout",
      "high quality cinematic rendering",
      "natural lighting and shadows",
      "stable camera with subtle organic movement",
      "social media ready vertical format",
      "no artifacts or distortion",
      "seamless motion blend",
    ].join(", ");

    if (userPrompt.trim()) {
      return `${systemPrompt}. ${userPrompt.trim()}`;
    }
    return systemPrompt;
  };

  const handleGenerate = useCallback(async () => {
    if (!apiKey || !selectedImage || !selectedVideo) return;
    if (isExhausted(model.rateKey)) { setError("Daily quota exhausted (5/day)."); return; }

    setIsSubmitting(true); setStatus("PENDING"); setResultUrl(null); setError(null);

    try {
      // Upload both files to get public URLs
      setStatus("PENDING");
      const [imageUrl, videoUrl] = await Promise.all([
        uploadFile(selectedImage),
        uploadFile(selectedVideo),
      ]);

      const body: Record<string, unknown> = {
        image_url: imageUrl,
        video_url: videoUrl,
        cfg_scale: cfgScale,
        character_orientation: "video",
        prompt: buildFinalPrompt(prompt),
      };

      const response = await submitTask(model.endpoint, body, apiKey);
      if (!response.ok) {
        setError(response.error || "Failed to submit");
        setStatus("FAILED");
        setIsSubmitting(false);
        return;
      }

      const taskId = response.data!.data.task_id;
      decrement(model.rateKey);
      addTask({
        id: crypto.randomUUID(), taskId, type: "motion-control", status: "PROCESSING",
        endpoint: model.taskEndpoint, params: { prompt, cfgScale, model: model.id },
        createdAt: new Date().toISOString(),
      });
      setStatus("PROCESSING"); setIsSubmitting(false);

      pollTask({
        taskId,
        endpoint: model.taskEndpoint,
        apiKey,
        interval: POLL_INTERVALS.video,
        timeout: POLL_TIMEOUTS.video,
        onStatusChange: (s) => setStatus(s),
        onComplete: (result) => {
          const url = result.url || result.urls?.[0];
          setResultUrl(url || null); setStatus("COMPLETED");
          updateTask(taskId, { status: "COMPLETED", resultUrl: url, completedAt: new Date().toISOString() });
          if (url) addItem({ id: crypto.randomUUID(), taskType: "motion-control", resultUrl: url, resultType: "video", params: { prompt, model: model.id }, createdAt: new Date().toISOString() });
        },
        onError: (err) => { setError(err); setStatus("FAILED"); updateTask(taskId, { status: "FAILED", error: err }); },
      });
    } catch (err) {
      setError("Failed to process files. Try smaller files.");
      setStatus("FAILED");
      setIsSubmitting(false);
    }
  }, [apiKey, selectedImage, selectedVideo, prompt, cfgScale, model, isExhausted, decrement, addTask, updateTask, addItem]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Move className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Motion Control Video</h1>
          <p className="text-sm text-muted-foreground">
            Transfer motion from a reference video to your image
          </p>
        </div>
      </div>

      <div className="mb-6 p-3 rounded-lg bg-accent/30 border border-border text-sm text-muted-foreground">
        💡 <strong>Apa ini?</strong> Bikin video dari foto + video referensi gerakan. Upload foto (subjek) dan video (gerakan yang mau ditiru), AI akan bikin video dimana subjek di foto bergerak mengikuti gerakan di video referensi. Cocok buat animasi karakter, content creation.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* Model */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Model</label>
            <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              {MOTION_MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Reference Image */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Reference Image <span className="text-muted-foreground font-normal">JPG, PNG, WebP · max 15 MB</span>
            </label>
            <ImageUpload
              onImageSelect={handleImageSelect}
              onImageRemove={handleImageRemove}
              selectedImage={selectedImage}
              previewUrl={imagePreviewUrl}
              maxSize={15 * 1024 * 1024}
            />
          </div>

          {/* Reference Video */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Reference Video <span className="text-muted-foreground font-normal">MP4, MOV, WebM · max 100 MB</span>
            </label>
            {selectedVideo && videoPreviewUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-border bg-muted">
                <video
                  src={videoPreviewUrl}
                  className="w-full h-auto max-h-[200px] object-contain"
                  controls
                  muted
                />
                <button
                  onClick={handleVideoRemove}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                  aria-label="Remove video"
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="px-3 py-1.5 text-xs text-muted-foreground">
                  {selectedVideo.name} ({formatBytes(selectedVideo.size)})
                </p>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors">
                <Video className="w-8 h-8 mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Click to upload reference video</p>
                <p className="text-xs text-muted-foreground mt-1">Use short videos (TikTok/Reels) for best results</p>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                  onChange={handleVideoSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* CFG Scale */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Motion Strength: {cfgScale.toFixed(2)}
            </label>
            <input
              type="range" min="0" max="1" step="0.05" value={cfgScale}
              onChange={(e) => setCfgScale(parseFloat(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Subtle</span>
              <span>Strong</span>
            </div>
          </div>

          {/* Prompt */}
          <PromptInput
            value={prompt}
            onChange={setPrompt}
            maxLength={500}
            label="Prompt (optional)"
            placeholder="Describe the motion or scene..."
            rows={2}
          />

          <button
            onClick={handleGenerate}
            disabled={!selectedImage || !selectedVideo || isSubmitting || status === "PROCESSING" || isExhausted(model.rateKey)}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting || status === "PROCESSING" ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Generating Motion Video...</>
            ) : (
              "Generate Motion Video"
            )}
          </button>

          {isExhausted(model.rateKey) && (
            <p className="text-sm text-destructive">Daily quota exhausted (5/day). Resets at UTC midnight.</p>
          )}

          <p className="text-xs text-muted-foreground">
            💡 Tip: Use short reference videos (3-10s) from TikTok or Reels for best motion transfer results.
          </p>
        </div>

        {/* Result */}
        <div className="space-y-4">
          {status && <TaskStatusBadge status={status} />}
          {status === "PROCESSING" && (
            <p className="text-xs text-muted-foreground">Video generation takes 2-5 minutes...</p>
          )}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">{error}</div>
          )}
          {resultUrl && (
            <div className="space-y-3">
              <div className="rounded-lg overflow-hidden border border-border bg-muted">
                <video src={resultUrl} controls className="w-full h-auto" />
              </div>
              <DownloadButton url={resultUrl} taskType="motion" extension="mp4" />
            </div>
          )}
          {!resultUrl && !status && (
            <div className="flex flex-col items-center justify-center h-64 rounded-lg border border-dashed border-border text-muted-foreground">
              <Move className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Motion video will appear here</p>
              <p className="text-xs mt-2 max-w-[250px] text-center">
                Upload a reference image (subject) and a reference video (motion) to generate
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
