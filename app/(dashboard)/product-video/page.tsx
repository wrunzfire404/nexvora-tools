"use client";

import { useState, useCallback, useEffect } from "react";
import { Package, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useTaskStore } from "@/stores/task-store";
import { useRateLimitStore } from "@/stores/rate-limit-store";
import { useHistoryStore } from "@/stores/history-store";
import { submitTask, apiRequest } from "@/lib/api-client";
import { pollTask } from "@/lib/task-poller";
import { ImageUpload } from "@/components/shared/image-upload";
import { DownloadButton } from "@/components/shared/download-button";
import { TaskStatusBadge } from "@/components/shared/task-status";
import { POLL_INTERVALS, POLL_TIMEOUTS, MAGNIFIC_ENDPOINTS } from "@/lib/constants";

// Professional product video style presets with hidden "secret sauce" prompts
const PRODUCT_STYLES = [
  {
    id: "hero-reveal",
    name: "Hero Reveal",
    description: "Produk muncul dramatis dari kegelapan",
    prompt: "Cinematic product reveal from darkness, dramatic volumetric lighting gradually illuminating the product, slow elegant camera push-in, lens flare accents, premium luxury commercial aesthetic, black background transitioning to studio lighting, smooth 24fps motion, high-end advertising quality, product stays perfectly centered and sharp throughout",
  },
  {
    id: "360-showcase",
    name: "360° Showcase",
    description: "Produk berputar smooth menampilkan semua sisi",
    prompt: "Smooth 360 degree product rotation on clean gradient background, professional turntable photography style, consistent studio lighting from multiple angles, product rotates slowly and elegantly showing all details, seamless loop motion, commercial product showcase, sharp focus maintained throughout rotation, subtle reflection on surface below",
  },
  {
    id: "floating-premium",
    name: "Floating Premium",
    description: "Produk melayang dengan efek premium",
    prompt: "Product floating in mid-air with subtle levitation motion, gentle up and down hovering, soft particle effects around product, premium gradient background transitioning from dark to light, volumetric god rays, luxury brand commercial style, smooth slow motion, product perfectly lit from all angles, high-end beauty commercial aesthetic",
  },
  {
    id: "splash-dynamic",
    name: "Splash Dynamic",
    description: "Efek splash/percikan air dinamis",
    prompt: "Dynamic product shot with water splash effects, liquid droplets flying around product in slow motion, fresh and energetic feel, bright studio lighting, crisp clean background, product remains sharp and centered while water splashes dramatically around it, high-speed photography style, refreshing commercial aesthetic, vibrant and eye-catching",
  },
  {
    id: "lifestyle-context",
    name: "Lifestyle Scene",
    description: "Produk dalam setting lifestyle natural",
    prompt: "Product in elegant lifestyle setting, natural morning light streaming through window, soft bokeh background with tasteful decor, camera slowly dollying around product, warm color grading, aspirational lifestyle commercial, product is hero of the scene, shallow depth of field keeping product sharp, Instagram-worthy aesthetic",
  },
  {
    id: "zoom-detail",
    name: "Macro Detail",
    description: "Zoom in ke detail dan tekstur produk",
    prompt: "Extreme close-up macro shot slowly revealing product details and textures, cinematic shallow depth of field, smooth camera movement exploring surface details, premium material textures visible, studio lighting highlighting craftsmanship, luxury brand detail shot, ASMR-style satisfying visual, slow deliberate camera motion",
  },
  {
    id: "unboxing",
    name: "Unboxing Reveal",
    description: "Efek unboxing/reveal dari packaging",
    prompt: "Elegant product unboxing reveal sequence, product emerging from premium packaging, dramatic top-down camera angle, satisfying reveal moment, luxury unwrapping experience, soft tissue paper and premium box materials, studio lighting, anticipation building reveal, high-end brand unboxing aesthetic, smooth cinematic motion",
  },
  {
    id: "neon-glow",
    name: "Neon Glow",
    description: "Efek neon/glow futuristik",
    prompt: "Product illuminated by colorful neon lights, futuristic cyberpunk aesthetic, glowing rim lighting in purple and blue, product slowly rotating with neon reflections, dark background with colored light streaks, modern tech product commercial style, dynamic lighting changes, eye-catching social media ad quality, vibrant and bold",
  },
];

export default function ProductVideoPage() {
  const { apiKey } = useAuthStore();
  const { addTask, updateTask } = useTaskStore();
  const { decrement, isExhausted, resetIfNewDay } = useRateLimitStore();
  const { addItem } = useHistoryStore();

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState(PRODUCT_STYLES[0].id);
  const [customDetail, setCustomDetail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [suggestedStyle, setSuggestedStyle] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const style = PRODUCT_STYLES.find((s) => s.id === selectedStyle)!;

  useEffect(() => { resetIfNewDay(); }, [resetIfNewDay]);

  const handleImageSelect = useCallback((file: File) => {
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResultUrl(null); setError(null); setStatus(null);
    setSuggestedStyle(null);
  }, []);

  // Analyze product image and suggest best style (triggered by user clicking "AI Auto")
  const handleAiSuggest = async () => {
    if (!selectedImage || !apiKey) {
      setError("Upload foto produk dulu sebelum pakai AI Auto.");
      return;
    }

    setIsAnalyzing(true);
    setSuggestedStyle(null);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(selectedImage);
      });

      const response = await apiRequest<{ data: { prompt: string } }>(
        MAGNIFIC_ENDPOINTS["image-to-prompt"],
        { method: "POST", body: { image: base64 }, apiKey: apiKey!, timeout: 15000 }
      );

      if (response.ok && response.data) {
        const description = response.data.data.prompt.toLowerCase();
        const suggested = matchStyleToProduct(description);
        setSuggestedStyle(suggested);
        setSelectedStyle(suggested);
      } else {
        setError("Gagal analyze gambar. Coba pilih style manual.");
      }
    } catch {
      setError("Gagal analyze gambar. Coba pilih style manual.");
    }
    setIsAnalyzing(false);
  };

  // Rule-based style matching from product description
  const matchStyleToProduct = (description: string): string => {
    // Skincare, beauty, cosmetics → Floating Premium or Lifestyle
    if (/skincare|cream|serum|beauty|cosmetic|lotion|perfume|fragrance/.test(description)) {
      return "floating-premium";
    }
    // Tech, gadget, electronic → Neon Glow or Hero Reveal
    if (/tech|gadget|phone|laptop|electronic|device|headphone|speaker|watch/.test(description)) {
      return "neon-glow";
    }
    // Food, drink, beverage → Splash Dynamic
    if (/food|drink|beverage|bottle|juice|coffee|tea|water|soda/.test(description)) {
      return "splash-dynamic";
    }
    // Fashion, clothing, shoes → Lifestyle Scene
    if (/fashion|cloth|shoe|sneaker|bag|dress|shirt|wear|apparel/.test(description)) {
      return "lifestyle-context";
    }
    // Luxury, jewelry, premium → Hero Reveal
    if (/luxury|gold|diamond|jewelry|premium|elegant|ring|necklace/.test(description)) {
      return "hero-reveal";
    }
    // Box, package → Unboxing
    if (/box|package|packaging|wrapped|gift/.test(description)) {
      return "unboxing";
    }
    // Default: 360 showcase (works for everything)
    return "360-showcase";
  };

  const handleImageRemove = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedImage(null); setPreviewUrl(null);
  }, [previewUrl]);

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
    if (isExhausted("video-kling-pro")) { setError("Daily quota exhausted."); return; }

    setIsSubmitting(true); setStatus("PENDING"); setResultUrl(null); setError(null);

    try {
      const imageUrl = await uploadFile(selectedImage);

      // If AI Auto selected, analyze image first to pick best style
      let finalStyle = style;
      if (selectedStyle === "ai-auto") {
        setStatus("PENDING");
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.readAsDataURL(selectedImage);
        });

        // Step 1: Get product description via Image-to-Prompt (Magnific)
        const analyzeResponse = await apiRequest<{ data: { task_id: string; status: string } }>(
          MAGNIFIC_ENDPOINTS["image-to-prompt"],
          { method: "POST", body: { image: base64 }, apiKey, timeout: 15000 }
        );

        let description = "";

        if (analyzeResponse.ok && analyzeResponse.data?.data?.task_id) {
          const taskId = analyzeResponse.data.data.task_id;
          for (let i = 0; i < 10; i++) {
            await new Promise((r) => setTimeout(r, 2000));
            const pollRes = await apiRequest<{ data: { status: string; generated?: string[]; prompt?: string } }>(
              `${MAGNIFIC_ENDPOINTS["image-to-prompt"]}/${taskId}`,
              { method: "GET", apiKey, timeout: 10000 }
            );
            if (pollRes.ok && pollRes.data?.data) {
              const d = pollRes.data.data;
              if (d.status === "COMPLETED") {
                description = d.prompt || d.generated?.[0] || "";
                break;
              }
              if (d.status === "FAILED") break;
            }
          }
        }

        // Step 2: Ask Gemini text AI to suggest best style
        if (description) {
          const geminiKey = typeof window !== "undefined" ? localStorage.getItem("nexvora-gemini-key") || "" : "";
          if (geminiKey) {
            try {
              const suggestRes = await fetch("/api/ai-suggest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description, geminiKey }),
              });
              const suggestData = await suggestRes.json();
              const suggestedId = suggestData.style || "360-showcase";
              finalStyle = PRODUCT_STYLES.find((s) => s.id === suggestedId) || PRODUCT_STYLES[1];
              setSuggestedStyle(suggestedId);
            } catch {
              // Fallback to rule matching
              const suggestedId = matchStyleToProduct(description.toLowerCase());
              finalStyle = PRODUCT_STYLES.find((s) => s.id === suggestedId) || PRODUCT_STYLES[1];
              setSuggestedStyle(suggestedId);
            }
          } else {
            // No Gemini key — use rule matching
            const suggestedId = matchStyleToProduct(description.toLowerCase());
            finalStyle = PRODUCT_STYLES.find((s) => s.id === suggestedId) || PRODUCT_STYLES[1];
            setSuggestedStyle(suggestedId);
          }
        } else {
          finalStyle = PRODUCT_STYLES.find((s) => s.id === "360-showcase") || PRODUCT_STYLES[1];
        }
      }

      // Build the final prompt
      let finalPrompt = finalStyle.prompt;
      if (customDetail.trim()) {
        finalPrompt += `. Product details: ${customDetail.trim()}`;
      }

      const body: Record<string, unknown> = {
        image: imageUrl,
        prompt: finalPrompt,
        duration: "5",
        cfg_scale: 0.5,
        negative_prompt: "blur, distort, low quality, shaky camera, fast motion, text overlay, watermark",
      };

      const response = await submitTask("/v1/ai/image-to-video/kling-v2-6-pro", body, apiKey);

      if (!response.ok) {
        setError(response.error || "Failed to submit");
        setStatus("FAILED"); setIsSubmitting(false);
        return;
      }

      const taskId = response.data!.data.task_id;
      decrement("video-kling-pro");

      addTask({
        id: crypto.randomUUID(), taskId, type: "video-generation", status: "PROCESSING",
        endpoint: "/v1/ai/image-to-video/kling-v2-6", params: { style: selectedStyle },
        createdAt: new Date().toISOString(),
      });

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
      setError("Failed. Check connection and try again.");
      setStatus("FAILED"); setIsSubmitting(false);
    }
  }, [apiKey, selectedImage, style, customDetail, selectedStyle, isExhausted, decrement, addTask, updateTask, addItem]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
          <Package className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Product Video Generator</h1>
          <p className="text-sm text-muted-foreground">Bikin video produk profesional untuk iklan</p>
        </div>
      </div>

      <div className="mb-6 p-3 rounded-lg bg-accent/30 border border-border text-sm text-muted-foreground">
        💡 <strong>Apa ini?</strong> Upload foto produk, pilih style video (hero reveal, 360° showcase, floating, dll), dan AI akan bikin video iklan produk yang profesional. Prompt sudah di-optimize biar hasilnya cinematic dan eye-catching.
      </div>

      {!apiKey && (
        <div className="mb-4 p-4 rounded-lg border border-primary/30 bg-primary/5">
          <p className="text-sm font-medium">🔑 API Key belum diset</p>
          <p className="text-xs text-muted-foreground mt-1">Klik &quot;API Key&quot; di header untuk set.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* Image */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Foto Produk</label>
            <ImageUpload onImageSelect={handleImageSelect} onImageRemove={handleImageRemove} selectedImage={selectedImage} previewUrl={previewUrl} />
          </div>

          {/* Style Selector */}
          <div>
            <label className="text-sm font-medium mb-2 block">Video Style</label>

            <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
              {PRODUCT_STYLES.map((s) => (
                <button key={s.id} onClick={() => setSelectedStyle(s.id)}
                  className={`p-3 rounded-lg text-left border transition-colors relative ${selectedStyle === s.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
                  <p className="text-xs font-medium">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom detail */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Detail Produk <span className="text-muted-foreground font-normal">(opsional)</span></label>
            <textarea value={customDetail} onChange={(e) => setCustomDetail(e.target.value.slice(0, 200))}
              placeholder="Misal: skincare bottle, warna gold, luxury brand..."
              rows={2} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground mt-1">{customDetail.length}/200</p>
          </div>

          <button onClick={handleGenerate}
            disabled={!selectedImage || isSubmitting || status === "PROCESSING" || !apiKey}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-orange-600 to-red-600 text-white font-medium text-sm hover:from-orange-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {isSubmitting || status === "PROCESSING" ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Generating Product Video...</>
            ) : (
              <><Package className="w-4 h-4" />Generate Product Video</>
            )}
          </button>

          {status === "PROCESSING" && (
            <p className="text-xs text-muted-foreground">⏳ Video generation takes 2-5 minutes. Prompt sudah di-optimize untuk hasil terbaik.</p>
          )}
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
              <DownloadButton url={resultUrl} taskType="product-video" extension="mp4" />
              <p className="text-xs text-muted-foreground text-center">🎬 Video produk siap dipakai untuk iklan, marketplace, atau social media!</p>
            </div>
          )}
          {!resultUrl && !status && (
            <div className="flex flex-col items-center justify-center h-64 rounded-lg border border-dashed border-border text-muted-foreground p-4">
              <Package className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">Video produk akan muncul di sini</p>
              <p className="text-xs mt-2 text-center max-w-[200px]">Upload foto produk dan pilih style untuk generate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
