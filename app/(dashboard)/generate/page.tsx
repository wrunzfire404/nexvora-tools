"use client";

import { useState, useCallback, useEffect } from "react";
import { Image as ImageIcon, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useTaskStore } from "@/stores/task-store";
import { useRateLimitStore } from "@/stores/rate-limit-store";
import { useHistoryStore } from "@/stores/history-store";
import { submitTask } from "@/lib/api-client";
import { pollTask } from "@/lib/task-poller";
import { PromptInput } from "@/components/shared/prompt-input";
import { DownloadButton } from "@/components/shared/download-button";
import { TaskStatusBadge } from "@/components/shared/task-status";
import { IMAGE_MODELS } from "@/types/models";
import { leonardoGenerate, leonardoPoll, getLeonardoKey } from "@/lib/leonardo-client";

// Combined models: Magnific + Leonardo
const ALL_IMAGE_MODELS = [
  ...IMAGE_MODELS.map((m) => ({ ...m, provider: "magnific" as const })),
  // Leonardo image models
  { id: "leo-flux-2-pro", name: "FLUX.2 Pro", description: "Premium quality", provider: "leonardo" as const, leonardoModel: "flux-pro-2.0", endpoint: "", rateKey: "", maxPerDay: 0, pollInterval: 3000, pollTimeout: 120000 },
  { id: "leo-flux-dev", name: "FLUX Dev", description: "High quality, detailed", provider: "leonardo" as const, leonardoModel: "flux-dev", endpoint: "", rateKey: "", maxPerDay: 0, pollInterval: 3000, pollTimeout: 120000 },
  { id: "leo-nano-banana-2", name: "Nano Banana 2", description: "Fast, sharp details", provider: "leonardo" as const, leonardoModel: "nano-banana-2", endpoint: "", rateKey: "", maxPerDay: 0, pollInterval: 3000, pollTimeout: 120000 },
  { id: "leo-seedream-45", name: "Seedream 4.5", description: "Posters, logos, text-heavy", provider: "leonardo" as const, leonardoModel: "seedream-4.5", endpoint: "", rateKey: "", maxPerDay: 0, pollInterval: 3000, pollTimeout: 120000 },
  { id: "leo-phoenix", name: "Phoenix 1.0", description: "Leonardo's own model", provider: "leonardo" as const, leonardoModel: "phoenix-1.0", endpoint: "", rateKey: "", maxPerDay: 0, pollInterval: 3000, pollTimeout: 120000 },
  { id: "leo-ideogram", name: "Ideogram 3.0", description: "Great for text in images", provider: "leonardo" as const, leonardoModel: "ideogram-3.0", endpoint: "", rateKey: "", maxPerDay: 0, pollInterval: 3000, pollTimeout: 120000 },
  { id: "leo-gpt-image-2", name: "GPT Image 2", description: "OpenAI's image model", provider: "leonardo" as const, leonardoModel: "gpt-image-2", endpoint: "", rateKey: "", maxPerDay: 0, pollInterval: 3000, pollTimeout: 120000 },
];

export default function GeneratePage() {
  const { apiKey } = useAuthStore();
  const { addTask, updateTask } = useTaskStore();
  const { decrement, isExhausted, resetIfNewDay } = useRateLimitStore();
  const { addItem } = useHistoryStore();

  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState(ALL_IMAGE_MODELS[0].id);
  const [creativity, setCreativity] = useState(0.5);
  const [guidanceScale, setGuidanceScale] = useState(7.5);
  const [steps, setSteps] = useState(25);
  const [status, setStatus] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const model = ALL_IMAGE_MODELS.find((m) => m.id === selectedModel)!;

  useEffect(() => {
    resetIfNewDay();
  }, [resetIfNewDay]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;

    // Check API key based on provider
    if (model.provider === "magnific" && !apiKey) {
      setError("Magnific API Key belum diset. Klik 'API Keys' di kanan atas.");
      return;
    }
    const leoKey = getLeonardoKey();
    if (model.provider === "leonardo" && !leoKey) {
      setError("Leonardo API Key belum diset. Klik 'API Keys' di kanan atas.");
      return;
    }

    if (model.provider === "magnific" && isExhausted(model.rateKey)) {
      setError("Daily quota exhausted for this model.");
      return;
    }

    setIsSubmitting(true);
    setStatus("PENDING");
    setResultUrl(null);
    setError(null);

    let finalPrompt = prompt.trim();

    if (model.provider === "leonardo") {
      // Leonardo flow
      const body = {
        model: (model as { leonardoModel?: string }).leonardoModel,
        public: false,
        parameters: {
          prompt: finalPrompt,
          quantity: 1,
          width: 1024,
          height: 1024,
        },
      };

      const result = await leonardoGenerate(leoKey, body);
      if (!result.ok) { setError(result.error || "Failed"); setStatus("FAILED"); setIsSubmitting(false); return; }

      setStatus("PROCESSING"); setIsSubmitting(false);

      const pollResult = await leonardoPoll(leoKey, result.generationId!, {
        interval: 3000,
        timeout: 120000,
        onStatusChange: (s) => setStatus(s === "COMPLETE" ? "COMPLETED" : s),
      });

      if (pollResult.imageUrl) {
        setResultUrl(pollResult.imageUrl);
        setStatus("COMPLETED");
        addItem({ id: crypto.randomUUID(), taskType: "image-generation", resultUrl: pollResult.imageUrl, resultType: "image", params: { prompt: finalPrompt, model: model.id }, createdAt: new Date().toISOString() });
      } else {
        setError(pollResult.error || "No image returned");
        setStatus("FAILED");
      }
    } else {
      // Magnific flow (existing)
      const body: Record<string, unknown> = { prompt: finalPrompt };

      if (model.id === "mystic") {
        body.creativity = creativity;
      } else if (model.id === "flux-dev" || model.id === "flux-pro-v1-1") {
        body.guidance_scale = guidanceScale;
        body.num_inference_steps = steps;
      }

      const response = await submitTask(model.endpoint, body, apiKey!);

      if (!response.ok) {
        setError(response.error || "Failed to submit task");
        setStatus("FAILED");
        setIsSubmitting(false);
        return;
      }

      const taskId = response.data!.data.task_id;
      decrement(model.rateKey);

      addTask({
        id: crypto.randomUUID(),
        taskId,
        type: "image-generation",
        status: "PROCESSING",
        endpoint: model.endpoint,
        params: body,
        createdAt: new Date().toISOString(),
      });

      setStatus("PROCESSING");
      setIsSubmitting(false);

      pollTask({
        taskId,
        endpoint: model.endpoint,
        apiKey: apiKey!,
        interval: model.pollInterval,
        timeout: model.pollTimeout,
        onStatusChange: (s) => setStatus(s),
        onComplete: (result) => {
          const url = result.url || result.urls?.[0];
          setResultUrl(url || null);
          setStatus("COMPLETED");
          updateTask(taskId, { status: "COMPLETED", resultUrl: url, completedAt: new Date().toISOString() });
          if (url) {
            addItem({ id: crypto.randomUUID(), taskType: "image-generation", resultUrl: url, resultType: "image", params: body, createdAt: new Date().toISOString() });
          }
        },
        onError: (err) => {
          setError(err);
          setStatus("FAILED");
          updateTask(taskId, { status: "FAILED", error: err });
        },
      });
    }
  }, [
    apiKey, prompt, model, creativity, guidanceScale, steps,
    isExhausted, decrement, addTask, updateTask, addItem,
  ]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* API Key Warning */}
      {!apiKey && (
        <div className="mb-4 p-4 rounded-lg border border-primary/30 bg-primary/5">
          <p className="text-sm font-medium">🔑 Magnific API Key belum diset</p>
          <p className="text-xs text-muted-foreground mt-1">Klik tombol &quot;API Key&quot; di kanan atas untuk memasukkan key. Dapatkan API key gratis di <a href="https://www.magnific.com/api" target="_blank" rel="noopener noreferrer" className="text-primary underline">magnific.com/api</a></p>
        </div>
      )}
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <ImageIcon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Image Generation</h1>
          <p className="text-sm text-muted-foreground">
            Generate images using AI models
          </p>
        </div>
      </div>

      <div className="mb-6 p-3 rounded-lg bg-accent/30 border border-border text-sm text-muted-foreground">
        💡 <strong>Apa ini?</strong> Buat gambar dari teks. Tulis deskripsi apa yang kamu mau (misal: &quot;wanita duduk di cafe&quot;), AI akan generate gambar sesuai prompt. Bisa pilih model yang berbeda untuk style yang berbeda.
        <br /><span className="text-[10px] mt-1 inline-block">⚠️ Leonardo AI tidak memproses konten NSFW/dewasa — gunakan Magnific untuk konten tersebut.</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Controls */}
        <div className="space-y-4">
          {/* Model Selector */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <optgroup label="🟣 Magnific (free tier)">
                {ALL_IMAGE_MODELS.filter(m => m.provider === "magnific").map((m) => (
                  <option key={m.id} value={m.id}>{m.name} — {m.description}</option>
                ))}
              </optgroup>
              <optgroup label="🟡 Leonardo AI ($5 credit)">
                {ALL_IMAGE_MODELS.filter(m => m.provider === "leonardo").map((m) => (
                  <option key={m.id} value={m.id}>{m.name} — {m.description}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Prompt */}
          <PromptInput
            value={prompt}
            onChange={setPrompt}
            maxLength={2000}
            placeholder="A beautiful sunset over the ocean with dramatic clouds..."
          />

          {/* Model-specific controls */}
          {model.provider === "magnific" && model.supports?.creativity && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Creativity: {creativity.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={creativity}
                onChange={(e) => setCreativity(parseFloat(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Conservative</span>
                <span>Creative</span>
              </div>
            </div>
          )}

          {model.provider === "magnific" && model.supports?.guidanceScale && (
            <>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Guidance Scale: {guidanceScale.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={guidanceScale}
                  onChange={(e) =>
                    setGuidanceScale(parseFloat(e.target.value))
                  }
                  className="w-full accent-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Inference Steps: {steps}
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={steps}
                  onChange={(e) => setSteps(parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            </>
          )}

          {/* Submit */}
          <button
            onClick={handleGenerate}
            disabled={
              !prompt.trim() ||
              isSubmitting ||
              status === "PROCESSING" ||
              (model.provider === "magnific" && isExhausted(model.rateKey))
            }
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting || status === "PROCESSING" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Image"
            )}
          </button>

          {model.provider === "magnific" && isExhausted(model.rateKey) && (
            <p className="text-sm text-destructive">
              Daily quota exhausted for {model.name}. Resets at UTC midnight.
            </p>
          )}
        </div>

        {/* Right: Result */}
        <div className="space-y-4">
          {status && <TaskStatusBadge status={status} />}

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              {error}
            </div>
          )}

          {resultUrl && (
            <div className="space-y-3">
              <div className="rounded-lg overflow-hidden border border-border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resultUrl}
                  alt="Generated image"
                  className="w-full h-auto"
                />
              </div>
              <DownloadButton url={resultUrl} taskType="generated" />
            </div>
          )}

          {!resultUrl && !status && (
            <div className="flex flex-col items-center justify-center h-64 rounded-lg border border-dashed border-border text-muted-foreground">
              <ImageIcon className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Generated image will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
