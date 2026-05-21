"use client";

import { useState, useCallback } from "react";
import { Video, Loader2, Music, Sparkles } from "lucide-react";
import { ImageUpload } from "@/components/shared/image-upload";
import { PromptInput } from "@/components/shared/prompt-input";
import { DownloadButton } from "@/components/shared/download-button";
import { TaskStatusBadge } from "@/components/shared/task-status";

type GenerationMode = "text-to-video" | "image-to-video";

const BYTEPLUS_API_KEY = "byteplusark-6d31fbf7-4379-4cc7-a91f-3c05ea88707f-a22b8";

const MODELS = [
  { id: "seedance-1-5-pro-251215", name: "Seedance 1.5 Pro", description: "Activated" },
];

const RATIOS = ["16:9", "9:16", "4:3", "3:4", "1:1", "21:9", "adaptive"];
const DURATIONS = [4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function BytePlusPage() {
  const [mode, setMode] = useState<GenerationMode>("image-to-video");
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState("9:16");
  const [duration, setDuration] = useState(5);
  const [generateAudio, setGenerateAudio] = useState(true);

  // Image state (first frame)
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // Result state
  const [status, setStatus] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenUsage, setTokenUsage] = useState<number | null>(null);

  // Upload file to catbox for public URL
  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/upload", { method: "POST", body: formData });
    if (!response.ok) throw new Error("Upload failed");
    const data = await response.json();
    return data.url;
  };

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

  const handleGenerate = useCallback(async () => {
    if (mode === "text-to-video" && !prompt.trim()) {
      setError("Prompt wajib untuk text-to-video."); return;
    }
    if (mode === "image-to-video" && !selectedImage) {
      setError("Upload image dulu."); return;
    }

    setIsSubmitting(true); setStatus("PENDING"); setResultUrl(null); setError(null); setTokenUsage(null);

    try {
      // Build content array
      const content: Array<Record<string, unknown>> = [];

      // Text prompt
      if (prompt.trim()) {
        content.push({ type: "text", text: prompt.trim() });
      }

      // Image (first frame)
      if (mode === "image-to-video" && selectedImage) {
        setStatus("Uploading image...");
        const imageUrl = await uploadFile(selectedImage);
        content.push({ type: "image_url", image_url: { url: imageUrl } });
      }

      // Build request body
      const body: Record<string, unknown> = {
        model: selectedModel,
        content,
        ratio,
        duration,
        watermark: false,
      };

      if (generateAudio) {
        body.generate_audio = true;
      }

      setStatus("Submitting...");

      // Submit to BytePlus
      const response = await fetch("/api/byteplus", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-byteplus-key": BYTEPLUS_API_KEY },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) { setError(data.error || "BytePlus API error"); setStatus("FAILED"); setIsSubmitting(false); return; }

      const taskId = data.id;
      if (!taskId) { setError("No task ID returned"); setStatus("FAILED"); setIsSubmitting(false); return; }

      setStatus("PROCESSING"); setIsSubmitting(false);

      // Poll for result
      const maxAttempts = 180; // 30 min
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise((r) => setTimeout(r, 10000));

        try {
          const pollRes = await fetch(`/api/byteplus?id=${taskId}`, {
            headers: { "x-byteplus-key": BYTEPLUS_API_KEY },
          });
          const pollData = await pollRes.json();

          if (pollData.status === "succeeded") {
            const videoUrl = pollData.content?.video_url;
            if (videoUrl) {
              setResultUrl(videoUrl);
              setStatus("COMPLETED");
              if (pollData.usage?.completion_tokens) setTokenUsage(pollData.usage.completion_tokens);
            } else {
              setError("Completed but no video URL found");
              setStatus("FAILED");
            }
            return;
          }

          if (pollData.status === "failed") {
            setError(pollData.error?.message || "Generation failed");
            setStatus("FAILED");
            return;
          }

          if (pollData.status === "running") setStatus("PROCESSING");
          else if (pollData.status === "queued") setStatus("QUEUED");
        } catch {
          // Network error, keep polling
        }
      }
      setError("Timeout after 30 minutes");
      setStatus("FAILED");
    } catch (err) {
      setError("Failed. Check connection.");
      setStatus("FAILED");
      setIsSubmitting(false);
    }
  }, [mode, prompt, selectedModel, ratio, duration, generateAudio, selectedImage]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold">BytePlus Seedance</h1>
          <p className="text-sm text-muted-foreground">Video generator — Admin only</p>
        </div>
        <span className="ml-auto px-2 py-0.5 text-[10px] rounded bg-yellow-500/20 text-yellow-400 font-medium">ADMIN</span>
      </div>

      <div className="mb-6 p-3 rounded-lg bg-accent/30 border border-border text-sm text-muted-foreground">
        💡 <strong>BytePlus Seedance 1.5 Pro</strong> — Text-to-video dan image-to-video (first frame).
        Durasi 4-12 detik, support audio generation, resolusi sampai 1080p.
        <br /><span className="text-[10px] mt-1 inline-block">🔑 API Key hardcoded. 500K token free ≈ ~10 video 5 detik.</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* Mode */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Mode</label>
            <select value={mode} onChange={(e) => setMode(e.target.value as GenerationMode)}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="text-to-video">Text to Video</option>
              <option value="image-to-video">Image to Video (First Frame)</option>
            </select>
          </div>

          {/* Model */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Model</label>
            <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.name} — {m.description}</option>
              ))}
            </select>
          </div>

          {/* Prompt */}
          <PromptInput
            value={prompt}
            onChange={setPrompt}
            maxLength={5000}
            label={mode === "text-to-video" ? "Prompt (wajib)" : "Prompt (opsional, deskripsi gerakan)"}
            placeholder="Deskripsi video yang mau dibuat..."
            rows={3}
          />

          {/* Image Upload — for i2v */}
          {mode === "image-to-video" && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                First Frame Image <span className="text-muted-foreground font-normal">max 30 MB</span>
              </label>
              <ImageUpload
                onImageSelect={handleImageSelect}
                onImageRemove={handleImageRemove}
                selectedImage={selectedImage}
                previewUrl={imagePreviewUrl}
                maxSize={30 * 1024 * 1024}
              />
            </div>
          )}

          {/* Settings Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Ratio</label>
              <select value={ratio} onChange={(e) => setRatio(e.target.value)}
                className="w-full px-2 py-1.5 rounded border border-input bg-background text-xs">
                {RATIOS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Durasi</label>
              <select value={duration} onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full px-2 py-1.5 rounded border border-input bg-background text-xs">
                {DURATIONS.map((d) => <option key={d} value={d}>{d}s</option>)}
              </select>
            </div>
          </div>

          {/* Audio toggle */}
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={generateAudio} onChange={(e) => setGenerateAudio(e.target.checked)}
              className="rounded border-input accent-primary" />
            <Music className="w-3.5 h-3.5" />
            Generate Audio
          </label>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isSubmitting || status === "PROCESSING" || status === "QUEUED"}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium text-sm hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting || status === "PROCESSING" || status === "QUEUED" ? (
              <><Loader2 className="w-4 h-4 animate-spin" />
                {status === "QUEUED" ? "Queued..." : "Generating..."}
              </>
            ) : (
              "Generate Video"
            )}
          </button>

          {(status === "PROCESSING" || status === "QUEUED") && (
            <p className="text-xs text-muted-foreground">
              ⏳ Seedance 1.5 Pro biasanya 1-3 menit. Jangan tutup halaman.
            </p>
          )}
        </div>

        {/* Result Panel */}
        <div className="space-y-4">
          {status && <TaskStatusBadge status={status} />}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">{error}</div>
          )}
          {resultUrl && (
            <div className="space-y-3">
              <div className="rounded-lg overflow-hidden border border-border bg-muted">
                <video src={resultUrl} controls autoPlay className="w-full h-auto" />
              </div>
              {tokenUsage && (
                <p className="text-xs text-muted-foreground text-center">
                  🎯 Token: {tokenUsage.toLocaleString()} / 500,000 free ({((tokenUsage / 500000) * 100).toFixed(1)}% used)
                </p>
              )}
              <DownloadButton url={resultUrl} taskType="byteplus-seedance" extension="mp4" />
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
