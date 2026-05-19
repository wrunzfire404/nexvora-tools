"use client";

import { useState, useCallback, useEffect } from "react";
import { Clapperboard, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useTaskStore } from "@/stores/task-store";
import { useRateLimitStore } from "@/stores/rate-limit-store";
import { useHistoryStore } from "@/stores/history-store";
import { submitTask } from "@/lib/api-client";
import { pollTask } from "@/lib/task-poller";
import { leonardoGenerate, leonardoPoll, getLeonardoKey } from "@/lib/leonardo-client";
import { ImageUpload } from "@/components/shared/image-upload";
import { DownloadButton } from "@/components/shared/download-button";
import { TaskStatusBadge } from "@/components/shared/task-status";
import { POLL_INTERVALS, POLL_TIMEOUTS } from "@/lib/constants";

const LOGO_STYLES = [
  {
    id: "glitch",
    name: "Glitch",
    description: "Efek glitch digital, tech vibes",
    prompt: "Logo animation with digital glitch effect, RGB split, scan lines, cyberpunk aesthetic, logo appears through glitch distortion then stabilizes, dark background, neon accents, modern tech intro style, smooth 5 second animation",
  },
  {
    id: "liquid",
    name: "Liquid Morph",
    description: "Logo muncul dari efek liquid/cairan",
    prompt: "Logo emerging from liquid metal morphing effect, chrome reflective surface transforming into logo shape, smooth organic motion, dark gradient background, premium 3D render quality, satisfying liquid animation, professional brand intro",
  },
  {
    id: "particle",
    name: "Particle Assemble",
    description: "Partikel berkumpul membentuk logo",
    prompt: "Logo assembled from thousands of glowing particles, particles flying from all directions converging into logo shape, magical sparkle effects, dark background with subtle gradient, cinematic particle animation, epic brand reveal",
  },
  {
    id: "3d-rotate",
    name: "3D Rotate",
    description: "Logo berputar 3D dengan depth",
    prompt: "Logo rotating in 3D space with depth and perspective, metallic material with reflections, studio lighting setup, smooth rotation revealing all angles, professional 3D logo animation, clean dark background, premium brand motion",
  },
  {
    id: "neon-flicker",
    name: "Neon Sign",
    description: "Logo menyala seperti neon sign",
    prompt: "Logo flickering on like a neon sign, tubes lighting up one by one, warm neon glow against dark brick wall, slight buzz flicker effect, retro neon aesthetic, atmospheric fog, cinematic neon sign animation, cozy night vibes",
  },
  {
    id: "smoke-reveal",
    name: "Smoke Reveal",
    description: "Logo terungkap dari asap/smoke",
    prompt: "Logo dramatically revealed through swirling smoke and fog, mysterious atmosphere, volumetric lighting piercing through smoke, dark cinematic background, epic reveal moment, premium brand intro animation, slow dramatic motion",
  },
  {
    id: "bounce-pop",
    name: "Bounce Pop",
    description: "Logo muncul dengan bounce playful",
    prompt: "Logo bouncing into frame with playful elastic animation, fun squash and stretch motion, colorful background, energetic and youthful brand intro, smooth cartoon-style physics, cheerful and dynamic, social media friendly",
  },
  {
    id: "minimal-fade",
    name: "Minimal Fade",
    description: "Fade in elegant dan minimal",
    prompt: "Logo fading in with elegant minimal animation, subtle scale from small to full size, clean white or dark background, soft shadow appearing underneath, premium minimalist brand intro, smooth and sophisticated, luxury feel",
  },
];

const LEONARDO_VIDEO_MODELS = [
  { id: "kling-3.0", name: "Kling 3.0", description: "Best quality" },
  { id: "kling-2.6", name: "Kling 2.6", description: "Fast & reliable" },
];

export default function LogoAnimatePage() {
  const { apiKey } = useAuthStore();
  const { addTask, updateTask } = useTaskStore();
  const { decrement, isExhausted, resetIfNewDay } = useRateLimitStore();
  const { addItem } = useHistoryStore();

  const [provider, setProvider] = useState<"magnific" | "leonardo">("magnific");
  const [leonardoModel, setLeonardoModel] = useState(LEONARDO_VIDEO_MODELS[0].id);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState(LOGO_STYLES[0].id);
  const [status, setStatus] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const style = LOGO_STYLES.find((s) => s.id === selectedStyle)!;

  useEffect(() => { resetIfNewDay(); }, [resetIfNewDay]);

  const handleImageSelect = useCallback((file: File) => {
    setSelectedImage(file); setPreviewUrl(URL.createObjectURL(file));
    setResultUrl(null); setError(null); setStatus(null);
  }, []);

  const handleImageRemove = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedImage(null); setPreviewUrl(null);
  }, [previewUrl]);

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/upload", { method: "POST", body: formData });
    if (!response.ok) throw new Error("Upload failed");
    return (await response.json()).url;
  };

  const handleGenerateLeonardo = useCallback(async () => {
    const leoKey = getLeonardoKey();
    if (!leoKey) { setError("Leonardo API key belum diset. Tambahkan di Settings."); return; }

    setIsSubmitting(true); setStatus("PENDING"); setResultUrl(null); setError(null);

    try {
      const body = {
        model: leonardoModel,
        public: false,
        parameters: {
          prompt: style.prompt,
          duration: 5,
          width: 1920,
          height: 1080,
          mode: "RESOLUTION_1080",
        },
      };

      const submitResult = await leonardoGenerate(leoKey, body);
      if (!submitResult.ok) {
        setError(submitResult.error || "Failed to submit to Leonardo");
        setStatus("FAILED"); setIsSubmitting(false); return;
      }

      setStatus("PROCESSING"); setIsSubmitting(false);

      const pollResult = await leonardoPoll(leoKey, submitResult.generationId!, {
        interval: 5000,
        timeout: 300000,
        onStatusChange: (s) => setStatus(s === "COMPLETE" ? "COMPLETED" : s),
      });

      if (pollResult.status === "COMPLETE" && pollResult.videoUrl) {
        setResultUrl(pollResult.videoUrl); setStatus("COMPLETED");
        addItem({ id: crypto.randomUUID(), taskType: "video-generation", resultUrl: pollResult.videoUrl, resultType: "video", params: { style: selectedStyle, provider: "leonardo", model: leonardoModel }, createdAt: new Date().toISOString() });
      } else {
        setError(pollResult.error || "Generation failed"); setStatus("FAILED");
      }
    } catch {
      setError("Failed. Check connection."); setStatus("FAILED"); setIsSubmitting(false);
    }
  }, [leonardoModel, style, selectedStyle, addItem]);

  const handleGenerateMagnific = useCallback(async () => {
    if (!apiKey || !selectedImage) return;
    if (isExhausted("video-kling-pro")) { setError("Daily quota exhausted."); return; }

    setIsSubmitting(true); setStatus("PENDING"); setResultUrl(null); setError(null);

    try {
      const imageUrl = await uploadFile(selectedImage);

      const body: Record<string, unknown> = {
        image: imageUrl,
        prompt: style.prompt,
        duration: "5",
        cfg_scale: 0.5,
        negative_prompt: "blur, distort, low quality, text, watermark",
      };

      const response = await submitTask("/v1/ai/image-to-video/kling-v2-6-pro", body, apiKey);
      if (!response.ok) { setError(response.error || "Failed"); setStatus("FAILED"); setIsSubmitting(false); return; }

      const taskId = response.data!.data.task_id;
      decrement("video-kling-pro");

      addTask({ id: crypto.randomUUID(), taskId, type: "video-generation", status: "PROCESSING", endpoint: "/v1/ai/image-to-video/kling-v2-6", params: { style: selectedStyle }, createdAt: new Date().toISOString() });
      setStatus("PROCESSING"); setIsSubmitting(false);

      pollTask({
        taskId, endpoint: "/v1/ai/image-to-video/kling-v2-6", apiKey,
        interval: POLL_INTERVALS.video, timeout: POLL_TIMEOUTS.video,
        onStatusChange: (s) => setStatus(s),
        onComplete: (result) => {
          const url = result.url || result.urls?.[0];
          setResultUrl(url || null); setStatus("COMPLETED");
          updateTask(taskId, { status: "COMPLETED", resultUrl: url, completedAt: new Date().toISOString() });
          if (url) addItem({ id: crypto.randomUUID(), taskType: "video-generation", resultUrl: url, resultType: "video", params: { style: selectedStyle }, createdAt: new Date().toISOString() });
        },
        onError: (err) => { setError(err); setStatus("FAILED"); updateTask(taskId, { status: "FAILED", error: err }); },
      });
    } catch {
      setError("Failed. Check connection."); setStatus("FAILED"); setIsSubmitting(false);
    }
  }, [apiKey, selectedImage, style, selectedStyle, isExhausted, decrement, addTask, updateTask, addItem]);

  const handleGenerate = useCallback(() => {
    if (provider === "leonardo") return handleGenerateLeonardo();
    return handleGenerateMagnific();
  }, [provider, handleGenerateLeonardo, handleGenerateMagnific]);

  const canGenerate = provider === "magnific"
    ? !!selectedImage && !isSubmitting && status !== "PROCESSING" && !!apiKey
    : !isSubmitting && status !== "PROCESSING" && !!getLeonardoKey();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
          <Clapperboard className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Logo Animator</h1>
          <p className="text-sm text-muted-foreground">Animate logo statis jadi video intro</p>
        </div>
      </div>

      <div className="mb-6 p-3 rounded-lg bg-accent/30 border border-border text-sm text-muted-foreground">
        💡 <strong>Apa ini?</strong> Upload logo kamu, pilih style animasi (glitch, liquid, particle, dll), dan AI akan bikin video animasi logo yang bisa dipakai sebagai intro YouTube, brand reveal, atau opening video. Biasanya butuh After Effects — sekarang cukup 1 klik.
      </div>

      {!apiKey && provider === "magnific" && (
        <div className="mb-4 p-4 rounded-lg border border-primary/30 bg-primary/5">
          <p className="text-sm font-medium">🔑 API Key belum diset</p>
          <p className="text-xs text-muted-foreground mt-1">Klik tombol &quot;API Key&quot; di kanan atas.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* Provider Selector */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Provider</label>
            <div className="flex gap-2">
              <button onClick={() => setProvider("magnific")}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${provider === "magnific" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}>
                Magnific (with image)
              </button>
              <button onClick={() => setProvider("leonardo")}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${provider === "leonardo" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}>
                Leonardo (text-to-video)
              </button>
            </div>
          </div>

          {/* Leonardo Model Selector */}
          {provider === "leonardo" && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">Model</label>
              <select value={leonardoModel} onChange={(e) => setLeonardoModel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {LEONARDO_VIDEO_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} — {m.description}</option>
                ))}
              </select>
              <p className="text-[10px] text-muted-foreground mt-1.5 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                ⚠️ Leonardo mode generates logo animation from text description. Upload logo as visual reference only.
              </p>
            </div>
          )}

          {/* Image Upload */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Upload Logo</label>
            <ImageUpload onImageSelect={handleImageSelect} onImageRemove={handleImageRemove} selectedImage={selectedImage} previewUrl={previewUrl} />
            <p className="text-[10px] text-muted-foreground mt-1">
              {provider === "magnific"
                ? "Tips: Logo dengan background transparan/solid gelap hasilnya lebih bagus"
                : "Logo dipakai sebagai referensi visual saja (text-to-video mode)"}
            </p>
          </div>

          {/* Style Selector */}
          <div>
            <label className="text-sm font-medium mb-2 block">Animation Style</label>
            <div className="grid grid-cols-2 gap-2">
              {LOGO_STYLES.map((s) => (
                <button key={s.id} onClick={() => setSelectedStyle(s.id)}
                  className={`p-3 rounded-lg text-left border transition-colors ${selectedStyle === s.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
                  <p className="text-xs font-medium">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.description}</p>
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleGenerate}
            disabled={!canGenerate}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium text-sm hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {isSubmitting || status === "PROCESSING" ? <><Loader2 className="w-4 h-4 animate-spin" />Animating Logo...</> : <><Clapperboard className="w-4 h-4" />Animate Logo</>}
          </button>
          {status === "PROCESSING" && <p className="text-xs text-muted-foreground">⏳ 2-5 menit. Prompt sudah di-optimize untuk animasi logo terbaik.</p>}
        </div>

        <div className="space-y-4">
          {status && <TaskStatusBadge status={status} />}
          {error && <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">{error}</div>}
          {resultUrl && (
            <div className="space-y-3">
              <div className="rounded-lg overflow-hidden border border-border bg-muted">
                <video src={resultUrl} controls loop className="w-full h-auto" />
              </div>
              <DownloadButton url={resultUrl} taskType="logo-animation" extension="mp4" />
              <p className="text-xs text-muted-foreground text-center">🎬 Logo animation siap dipakai sebagai intro video!</p>
            </div>
          )}
          {!resultUrl && !status && (
            <div className="flex flex-col items-center justify-center h-64 rounded-lg border border-dashed border-border text-muted-foreground p-4">
              <Clapperboard className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Animasi logo akan muncul di sini</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
