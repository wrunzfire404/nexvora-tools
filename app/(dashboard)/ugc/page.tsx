"use client";

import { useState, useCallback, useEffect } from "react";
import { Sparkles, Loader2, X, Video, Upload } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useTaskStore } from "@/stores/task-store";
import { useRateLimitStore } from "@/stores/rate-limit-store";
import { useHistoryStore } from "@/stores/history-store";
import { submitTask } from "@/lib/api-client";
import { pollTask } from "@/lib/task-poller";
import { ImageUpload } from "@/components/shared/image-upload";
import { DownloadButton } from "@/components/shared/download-button";
import { TaskStatusBadge } from "@/components/shared/task-status";
import { POLL_INTERVALS, POLL_TIMEOUTS } from "@/lib/constants";
import { formatBytes } from "@/lib/utils";

// UGC-specific presets
const UGC_STYLES = [
  {
    id: "talking-head",
    name: "Talking Head",
    description: "Person talking to camera, natural gestures",
    prompt: "Professional UGC talking head video, person speaking naturally to camera, authentic social media style, natural hand gestures, good eye contact with camera, well-lit face, vertical format, smooth natural movement, realistic facial expressions, casual and relatable vibe, maintain exact same face identity and facial features throughout entire video, consistent appearance from start to end, same person in every frame",
  },
  {
    id: "product-showcase",
    name: "Product Showcase",
    description: "Holding/showing a product naturally",
    prompt: "Professional UGC product showcase video, person naturally holding and presenting product, authentic unboxing style, smooth hand movements, good product visibility, natural lighting, vertical social media format, genuine enthusiasm, casual presentation style, maintain exact same face identity and facial features throughout entire video, consistent appearance, same person in every frame",
  },
  {
    id: "lifestyle",
    name: "Lifestyle",
    description: "Natural daily activity, walking, posing",
    prompt: "Professional UGC lifestyle video, natural daily activity, authentic movement, smooth camera follow, aesthetic composition, natural lighting, social media vertical format, relatable and aspirational, fluid body movement, cinematic quality, maintain exact same face identity and facial features throughout entire video, consistent appearance from start to end, same person in every frame",
  },
  {
    id: "reaction",
    name: "Reaction/Review",
    description: "Reacting to something, expressive face",
    prompt: "Professional UGC reaction video, expressive facial reactions, natural surprise and emotion, authentic review style, good camera angle, well-lit face, vertical format, genuine expressions, engaging body language, social media ready, maintain exact same face identity and facial features throughout entire video, consistent face from start to end, same person in every frame",
  },
  {
    id: "dance",
    name: "Dance/Trend",
    description: "Dance moves, TikTok-style trends",
    prompt: "Professional UGC dance video, smooth choreographed movement, TikTok trend style, energetic and fluid motion, good rhythm sync, vertical format, dynamic camera angle, clean background, high energy, social media viral style, maintain exact same face identity and facial features throughout entire video, consistent face preservation, same person from start to end, no face morphing",
  },
  {
    id: "before-after",
    name: "Before & After",
    description: "Transformation reveal style",
    prompt: "Professional UGC before and after transformation video, dramatic reveal moment, smooth transition, authentic reaction, good lighting contrast, vertical format, satisfying visual change, social media engagement style, clean presentation, maintain exact same face identity and facial features throughout entire video, consistent appearance, same person in every frame",
  },
];

const UGC_MODELS = [
  {
    id: "kling-v2-6-mc-std",
    name: "Kling 2.6 Standard (Recommended)",
    endpoint: "/v1/ai/video/kling-v2-6-motion-control-std",
    taskEndpoint: "/v1/ai/image-to-video/kling-v2-6",
  },
  {
    id: "kling-v2-6-mc-pro",
    name: "Kling 2.6 Pro (Higher Quality)",
    endpoint: "/v1/ai/video/kling-v2-6-motion-control-pro",
    taskEndpoint: "/v1/ai/image-to-video/kling-v2-6",
  },
];

export default function UGCPage() {
  const { apiKey } = useAuthStore();
  const { addTask, updateTask } = useTaskStore();
  const { decrement, isExhausted, resetIfNewDay } = useRateLimitStore();
  const { addItem } = useHistoryStore();

  const [selectedModel, setSelectedModel] = useState(UGC_MODELS[0].id);
  const [selectedStyle, setSelectedStyle] = useState(UGC_STYLES[0].id);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [cfgScale, setCfgScale] = useState(0.6);
  const [status, setStatus] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const model = UGC_MODELS.find((m) => m.id === selectedModel)!;
  const style = UGC_STYLES.find((s) => s.id === selectedStyle)!;

  useEffect(() => { resetIfNewDay(); }, [resetIfNewDay]);

  const handleImageSelect = useCallback((file: File) => {
    setSelectedImage(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setResultUrl(null); setError(null); setStatus(null);
  }, []);

  const handleImageRemove = useCallback(() => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setSelectedImage(null); setImagePreviewUrl(null);
  }, [imagePreviewUrl]);

  const handleVideoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ["video/mp4", "video/webm", "video/quicktime"];
    if (!validTypes.includes(file.type)) {
      setError("Use MP4, WebM, or MOV format.");
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

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/upload", { method: "POST", body: formData });
    if (!response.ok) throw new Error("Failed to upload file");
    const data = await response.json();
    return data.url;
  };

  const handleGenerate = useCallback(async () => {
    if (!apiKey || !selectedImage || !selectedVideo) return;
    if (isExhausted("video-kling-mc")) { setError("Daily quota exhausted (5/day)."); return; }

    setIsSubmitting(true); setStatus("PENDING"); setResultUrl(null); setError(null);

    try {
      const [imageUrl, videoUrl] = await Promise.all([
        uploadFile(selectedImage),
        uploadFile(selectedVideo),
      ]);

      // Build the final prompt: style preset + custom additions
      let finalPrompt = style.prompt;
      if (customPrompt.trim()) {
        finalPrompt += `. Additional context: ${customPrompt.trim()}`;
      }

      const body: Record<string, unknown> = {
        image_url: imageUrl,
        video_url: videoUrl,
        cfg_scale: cfgScale,
        character_orientation: "video",
        prompt: finalPrompt,
      };

      const response = await submitTask(model.endpoint, body, apiKey);
      if (!response.ok) {
        setError(response.error || "Failed to submit");
        setStatus("FAILED"); setIsSubmitting(false);
        return;
      }

      const taskId = response.data!.data.task_id;
      decrement("video-kling-mc");
      addTask({
        id: crypto.randomUUID(), taskId, type: "motion-control", status: "PROCESSING",
        endpoint: model.taskEndpoint, params: { style: selectedStyle, customPrompt },
        createdAt: new Date().toISOString(),
      });
      setStatus("PROCESSING"); setIsSubmitting(false);

      pollTask({
        taskId, endpoint: model.taskEndpoint, apiKey,
        interval: POLL_INTERVALS.video, timeout: POLL_TIMEOUTS.video,
        onStatusChange: (s) => setStatus(s),
        onComplete: (result) => {
          const url = result.url || result.urls?.[0];
          setResultUrl(url || null); setStatus("COMPLETED");
          updateTask(taskId, { status: "COMPLETED", resultUrl: url, completedAt: new Date().toISOString() });
          if (url) addItem({ id: crypto.randomUUID(), taskType: "motion-control", resultUrl: url, resultType: "video", params: { style: selectedStyle }, createdAt: new Date().toISOString() });
        },
        onError: (err) => { setError(err); setStatus("FAILED"); updateTask(taskId, { status: "FAILED", error: err }); },
      });
    } catch {
      setError("Failed to upload files. Try smaller files or check connection.");
      setStatus("FAILED"); setIsSubmitting(false);
    }
  }, [apiKey, selectedImage, selectedVideo, customPrompt, cfgScale, model, style, selectedStyle, isExhausted, decrement, addTask, updateTask, addItem]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">UGC Creator</h1>
          <p className="text-sm text-muted-foreground">
            Create professional UGC videos — just upload a face & motion reference
          </p>
        </div>
      </div>

      <div className="mb-6 p-3 rounded-lg bg-accent/30 border border-border text-sm text-muted-foreground">
        💡 <strong>Apa ini?</strong> Bikin video UGC (User Generated Content) profesional untuk iklan/sosmed. Upload foto model + video referensi gerakan → AI bikin video seolah model di foto sedang bergerak/ngomong. Pilih style sesuai kebutuhan (talking head, product showcase, dance, dll). Prompt otomatis di-optimize biar hasilnya bagus.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* UGC Style Selector */}
          <div>
            <label className="text-sm font-medium mb-2 block">UGC Style</label>
            <div className="grid grid-cols-2 gap-2">
              {UGC_STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStyle(s.id)}
                  className={`p-3 rounded-lg text-left border transition-colors ${
                    selectedStyle === s.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Model */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Quality</label>
            <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              {UGC_MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Reference Image (Model/Avatar) */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Model / Avatar Photo
              <span className="text-muted-foreground font-normal ml-1">The face that will appear in the video</span>
            </label>
            <ImageUpload
              onImageSelect={handleImageSelect}
              onImageRemove={handleImageRemove}
              selectedImage={selectedImage}
              previewUrl={imagePreviewUrl}
              maxSize={15 * 1024 * 1024}
            />
          </div>

          {/* Reference Video (Motion) */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Motion Reference Video
              <span className="text-muted-foreground font-normal ml-1">The movement to copy</span>
            </label>
            {selectedVideo && videoPreviewUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-border bg-muted">
                <video src={videoPreviewUrl} className="w-full h-auto max-h-[180px] object-contain" controls muted />
                <button onClick={handleVideoRemove}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  aria-label="Remove video">
                  <X className="w-4 h-4" />
                </button>
                <p className="px-3 py-1.5 text-xs text-muted-foreground">
                  {selectedVideo.name} ({formatBytes(selectedVideo.size)})
                </p>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-5 cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors">
                <Video className="w-7 h-7 mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Upload motion reference</p>
                <p className="text-xs text-muted-foreground mt-1">TikTok/Reels videos work best (short, clear movement)</p>
                <input type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" onChange={handleVideoSelect} className="hidden" />
              </label>
            )}
          </div>

          {/* Motion Strength */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Motion Strength: {cfgScale.toFixed(2)}
            </label>
            <input type="range" min="0.3" max="0.9" step="0.05" value={cfgScale}
              onChange={(e) => setCfgScale(parseFloat(e.target.value))}
              className="w-full accent-primary" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>More like photo</span>
              <span>More like video</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              💡 Recommended: 0.5-0.7 for best face consistency. Lower = face more preserved but less motion.
            </p>
          </div>

          {/* Custom prompt (optional) */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Extra Instructions <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value.slice(0, 200))}
              placeholder="e.g., wearing red dress, outdoor setting, smiling..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">{customPrompt.length}/200</p>
          </div>

          <button onClick={handleGenerate}
            disabled={!selectedImage || !selectedVideo || isSubmitting || status === "PROCESSING" || isExhausted("video-kling-mc")}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium text-sm hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all">
            {isSubmitting || status === "PROCESSING" ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Creating UGC Video...</>
            ) : (
              <><Sparkles className="w-4 h-4" />Create UGC Video</>
            )}
          </button>

          {isExhausted("video-kling-mc") && (
            <p className="text-sm text-destructive">Daily quota exhausted (5/day). Resets at UTC midnight.</p>
          )}
        </div>

        {/* Result */}
        <div className="space-y-4">
          {status && <TaskStatusBadge status={status} />}
          {status === "PROCESSING" && (
            <div className="p-4 rounded-lg bg-accent/50 border border-border">
              <p className="text-sm font-medium">⏳ Creating your UGC video...</p>
              <p className="text-xs text-muted-foreground mt-1">This usually takes 2-5 minutes. Don&apos;t close this page.</p>
            </div>
          )}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">{error}</div>
          )}
          {resultUrl && (
            <div className="space-y-3">
              <div className="rounded-lg overflow-hidden border border-border bg-muted">
                <video src={resultUrl} controls className="w-full h-auto" />
              </div>
              <DownloadButton url={resultUrl} taskType="ugc" extension="mp4" />
              <p className="text-xs text-muted-foreground text-center">
                🎉 Your UGC video is ready! Download and use it for ads, social media, or content.
              </p>
            </div>
          )}
          {!resultUrl && !status && (
            <div className="flex flex-col items-center justify-center h-80 rounded-lg border border-dashed border-border text-muted-foreground p-6">
              <Sparkles className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">Your UGC video will appear here</p>
              <div className="mt-4 text-xs text-center space-y-1 max-w-[280px]">
                <p>1. Choose a UGC style</p>
                <p>2. Upload a photo of the model/avatar</p>
                <p>3. Upload a motion reference video</p>
                <p>4. Hit create and wait 2-5 minutes</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
