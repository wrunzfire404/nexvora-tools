"use client";

import { useState, useCallback, useEffect } from "react";
import { MonitorPlay, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useRateLimitStore } from "@/stores/rate-limit-store";
import { useHistoryStore } from "@/stores/history-store";
import { submitTask } from "@/lib/api-client";
import { pollTask } from "@/lib/task-poller";
import { leonardoGenerate, leonardoPoll, getLeonardoKey } from "@/lib/leonardo-client";
import { PromptInput } from "@/components/shared/prompt-input";
import { DownloadButton } from "@/components/shared/download-button";
import { TaskStatusBadge } from "@/components/shared/task-status";
import { POLL_INTERVALS, POLL_TIMEOUTS } from "@/lib/constants";

const THUMBNAIL_STYLES = [
  {
    id: "youtube-bold",
    name: "YouTube Bold",
    description: "Teks besar, warna kontras, eye-catching",
    promptTemplate: (title: string) => `Professional YouTube thumbnail, bold large text saying "${title}", vibrant contrasting colors, dramatic lighting, eye-catching composition, clean design, high contrast, 16:9 aspect ratio, professional graphic design, attention-grabbing, social media optimized`,
  },
  {
    id: "cinematic",
    name: "Cinematic",
    description: "Style film/sinematik, dramatic",
    promptTemplate: (title: string) => `Cinematic movie poster style YouTube thumbnail, dramatic lighting, text "${title}" in bold cinematic font, dark moody atmosphere, lens flare, professional color grading, 16:9 widescreen, epic and dramatic feel, high production value`,
  },
  {
    id: "minimal-clean",
    name: "Minimal Clean",
    description: "Minimalis, bersih, profesional",
    promptTemplate: (title: string) => `Minimalist clean YouTube thumbnail, simple elegant design, text "${title}" in modern sans-serif font, solid color background with subtle gradient, professional and sophisticated, 16:9 aspect ratio, premium brand feel, less is more aesthetic`,
  },
  {
    id: "gaming",
    name: "Gaming/Tech",
    description: "Neon, futuristik, gaming vibes",
    promptTemplate: (title: string) => `Gaming style YouTube thumbnail, neon glow effects, futuristic tech aesthetic, text "${title}" in bold glowing font, dark background with RGB lighting, dynamic composition, energetic and exciting, 16:9 aspect ratio, esports/tech channel style`,
  },
  {
    id: "tutorial",
    name: "Tutorial/How-to",
    description: "Informatif, step-by-step feel",
    promptTemplate: (title: string) => `Educational tutorial YouTube thumbnail, clean informative design, text "${title}" clearly readable, numbered steps visual, bright and inviting colors, professional yet approachable, 16:9 aspect ratio, trustworthy and helpful aesthetic`,
  },
  {
    id: "reaction",
    name: "Reaction/Viral",
    description: "Ekspresif, shocking, viral-worthy",
    promptTemplate: (title: string) => `Viral reaction style YouTube thumbnail, shocked expression aesthetic, text "${title}" in bold impact font, bright yellow and red accents, arrows and circles highlighting elements, maximum clickbait energy, 16:9 aspect ratio, attention-grabbing design`,
  },
];

const LEONARDO_IMAGE_MODELS = [
  { id: "flux-pro-2.0", name: "FLUX.2 Pro", description: "High quality" },
  { id: "nano-banana-2", name: "Nano Banana 2", description: "Fast, sharp" },
  { id: "seedream-4.5", name: "Seedream 4.5", description: "Great for text/logos" },
  { id: "phoenix-1.0", name: "Phoenix", description: "Fast & versatile" },
  { id: "ideogram-3.0", name: "Ideogram 3.0", description: "Best for text in images" },
];

export default function ThumbnailPage() {
  const { apiKey } = useAuthStore();
  const { decrement, isExhausted, resetIfNewDay } = useRateLimitStore();
  const { addItem } = useHistoryStore();

  const [provider, setProvider] = useState<"magnific" | "leonardo">("magnific");
  const [leonardoModel, setLeonardoModel] = useState(LEONARDO_IMAGE_MODELS[0].id);
  const [title, setTitle] = useState("");
  const [selectedStyle, setSelectedStyle] = useState(THUMBNAIL_STYLES[0].id);
  const [results, setResults] = useState<Array<{ id: string; url: string; style: string }>>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateCount, setGenerateCount] = useState(3);

  const style = THUMBNAIL_STYLES.find((s) => s.id === selectedStyle)!;

  useEffect(() => { resetIfNewDay(); }, [resetIfNewDay]);

  const generateOneMagnific = async (promptTemplate: (t: string) => string): Promise<string | null> => {
    const prompt = promptTemplate(title.trim());

    const submitRes = await submitTask("/v1/ai/mystic", { prompt }, apiKey!);
    if (!submitRes.ok) return null;

    const taskId = submitRes.data!.data.task_id;
    decrement("image-generation-mystic");

    return new Promise((resolve) => {
      pollTask({
        taskId, endpoint: "/v1/ai/mystic", apiKey: apiKey!,
        interval: POLL_INTERVALS.image, timeout: POLL_TIMEOUTS.image,
        onComplete: (result) => resolve(result.url || result.urls?.[0] || null),
        onError: () => resolve(null),
      });
    });
  };

  const generateOneLeonardo = async (promptTemplate: (t: string) => string): Promise<string | null> => {
    const leoKey = getLeonardoKey();
    if (!leoKey) return null;

    const prompt = promptTemplate(title.trim());

    const body = {
      model: leonardoModel,
      public: false,
      parameters: {
        prompt,
        quantity: 1,
        width: 1440,
        height: 810,
      },
    };

    const submitResult = await leonardoGenerate(leoKey, body);
    if (!submitResult.ok) return null;

    const pollResult = await leonardoPoll(leoKey, submitResult.generationId!, {
      interval: 4000,
      timeout: 120000,
    });

    if (pollResult.status === "COMPLETE" && pollResult.imageUrl) {
      return pollResult.imageUrl;
    }
    return null;
  };

  const handleGenerate = useCallback(async () => {
    if (!title.trim()) return;

    if (provider === "magnific") {
      if (!apiKey) return;
      if (isExhausted("image-generation-mystic")) { setError("Daily quota exhausted."); return; }
    } else {
      const leoKey = getLeonardoKey();
      if (!leoKey) { setError("Leonardo API key belum diset. Tambahkan di Settings."); return; }
    }

    setIsGenerating(true); setStatus("PROCESSING"); setError(null); setResults([]);

    const newResults: Array<{ id: string; url: string; style: string }> = [];

    for (let i = 0; i < generateCount; i++) {
      const url = provider === "magnific"
        ? await generateOneMagnific(style.promptTemplate)
        : await generateOneLeonardo(style.promptTemplate);

      if (url) {
        newResults.push({ id: crypto.randomUUID(), url, style: style.name });
        setResults([...newResults]);
        addItem({ id: crypto.randomUUID(), taskType: "image-generation", resultUrl: url, resultType: "image", params: { title, style: selectedStyle, provider }, createdAt: new Date().toISOString() });
      }
    }

    if (newResults.length === 0) setError("Semua generasi gagal. Coba lagi.");
    setStatus(newResults.length > 0 ? "COMPLETED" : "FAILED");
    setIsGenerating(false);
  }, [apiKey, title, style, generateCount, selectedStyle, provider, leonardoModel, isExhausted, decrement, addItem]);

  const canGenerate = provider === "magnific"
    ? !!title.trim() && !isGenerating && !!apiKey && !isExhausted("image-generation-mystic")
    : !!title.trim() && !isGenerating && !!getLeonardoKey();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
          <MonitorPlay className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Thumbnail Generator</h1>
          <p className="text-sm text-muted-foreground">Generate thumbnail YouTube/podcast yang eye-catching</p>
        </div>
      </div>

      <div className="mb-6 p-3 rounded-lg bg-accent/30 border border-border text-sm text-muted-foreground">
        💡 <strong>Apa ini?</strong> Masukkan judul video, pilih style, dan AI akan generate beberapa variasi thumbnail yang eye-catching. Cocok buat YouTuber, podcaster, atau content creator yang butuh thumbnail cepat tanpa desain manual.
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
                Magnific (Mystic)
              </button>
              <button onClick={() => setProvider("leonardo")}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${provider === "leonardo" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}>
                Leonardo AI
              </button>
            </div>
          </div>

          {/* Leonardo Model Selector */}
          {provider === "leonardo" && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">Model</label>
              <select value={leonardoModel} onChange={(e) => setLeonardoModel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {LEONARDO_IMAGE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} — {m.description}</option>
                ))}
              </select>
              <p className="text-[10px] text-muted-foreground mt-1">
                💡 Ideogram 3.0 recommended untuk thumbnail dengan teks — hasilnya paling rapi.
              </p>
            </div>
          )}

          <PromptInput value={title} onChange={setTitle} maxLength={100} label="Judul Video / Teks Thumbnail" placeholder="Misal: 5 Tips Jadi Content Creator Sukses" rows={2} />

          <div>
            <label className="text-sm font-medium mb-2 block">Thumbnail Style</label>
            <div className="grid grid-cols-2 gap-2">
              {THUMBNAIL_STYLES.map((s) => (
                <button key={s.id} onClick={() => setSelectedStyle(s.id)}
                  className={`p-3 rounded-lg text-left border transition-colors ${selectedStyle === s.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
                  <p className="text-xs font-medium">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Jumlah Variasi</label>
            <div className="flex gap-2">
              {[1, 2, 3].map((n) => (
                <button key={n} onClick={() => setGenerateCount(n)}
                  className={`px-4 py-1.5 rounded-lg text-xs border ${generateCount === n ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>
                  {n}x
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Setiap variasi = 1 credit</p>
          </div>

          <button onClick={handleGenerate}
            disabled={!canGenerate}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-red-600 to-pink-600 text-white font-medium text-sm hover:from-red-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" />Generating Thumbnails...</> : <><MonitorPlay className="w-4 h-4" />Generate {generateCount} Thumbnail</>}
          </button>
        </div>

        <div className="space-y-4">
          {status && <TaskStatusBadge status={status} />}
          {error && <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">{error}</div>}
          {results.length > 0 ? (
            <div className="space-y-3">
              {results.map((r) => (
                <div key={r.id} className="rounded-lg border border-border overflow-hidden bg-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.url} alt="Thumbnail" className="w-full h-auto" />
                  <div className="p-2 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{r.style}</span>
                    <DownloadButton url={r.url} taskType="thumbnail" className="!py-1 !px-2 !text-xs" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 rounded-lg border border-dashed border-border text-muted-foreground p-4">
              <MonitorPlay className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Thumbnail akan muncul di sini</p>
              <p className="text-xs mt-1">Multiple variasi untuk dipilih</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
