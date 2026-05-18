"use client";

import { useState, useCallback, useEffect } from "react";
import { Image as ImageIcon, Loader2, Languages } from "lucide-react";
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
import { isLikelyNonEnglish, translatePromptToEnglish } from "@/lib/translate";

export default function GeneratePage() {
  const { apiKey } = useAuthStore();
  const { addTask, updateTask } = useTaskStore();
  const { decrement, isExhausted, resetIfNewDay } = useRateLimitStore();
  const { addItem } = useHistoryStore();

  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState(IMAGE_MODELS[0].id);
  const [creativity, setCreativity] = useState(0.5);
  const [guidanceScale, setGuidanceScale] = useState(7.5);
  const [steps, setSteps] = useState(25);
  const [status, setStatus] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [translatedPrompt, setTranslatedPrompt] = useState<string | null>(null);
  const [isNonEnglish, setIsNonEnglish] = useState(false);

  const model = IMAGE_MODELS.find((m) => m.id === selectedModel)!;

  useEffect(() => {
    resetIfNewDay();
  }, [resetIfNewDay]);

  // Detect non-English prompt
  useEffect(() => {
    if (prompt.trim().length > 5) {
      setIsNonEnglish(isLikelyNonEnglish(prompt));
    } else {
      setIsNonEnglish(false);
    }
    setTranslatedPrompt(null);
  }, [prompt]);

  const handleGenerate = useCallback(async () => {
    if (!apiKey || !prompt.trim()) return;
    if (isExhausted(model.rateKey)) {
      setError("Daily quota exhausted for this model.");
      return;
    }

    setIsSubmitting(true);
    setStatus("PENDING");
    setResultUrl(null);
    setError(null);
    setTranslatedPrompt(null);

    // Auto-translate if enabled and prompt is non-English
    let finalPrompt = prompt.trim();
    if (autoTranslate && isNonEnglish) {
      setStatus("PENDING");
      const { translated, error: translateError } = await translatePromptToEnglish(finalPrompt, apiKey);
      if (translateError) {
        // Translation failed, proceed with original prompt
        console.warn("Translation failed, using original:", translateError);
      } else {
        finalPrompt = translated;
        setTranslatedPrompt(translated);
      }
    }

    // Build request body based on model
    const body: Record<string, unknown> = { prompt: finalPrompt };

    if (model.id === "mystic") {
      body.creativity = creativity;
    } else if (model.id === "flux-dev" || model.id === "flux-pro-v1-1") {
      body.guidance_scale = guidanceScale;
      body.num_inference_steps = steps;
    }

    const response = await submitTask(model.endpoint, body, apiKey);

    if (!response.ok) {
      setError(response.error || "Failed to submit task");
      setStatus("FAILED");
      setIsSubmitting(false);
      return;
    }

    const taskId = response.data!.data.task_id;
    decrement(model.rateKey);

    // Add to task store
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

    // Start polling
    pollTask({
      taskId,
      endpoint: model.endpoint,
      apiKey,
      interval: model.pollInterval,
      timeout: model.pollTimeout,
      onStatusChange: (s) => setStatus(s),
      onComplete: (result) => {
        const url = result.url || result.urls?.[0];
        setResultUrl(url || null);
        setStatus("COMPLETED");
        updateTask(taskId, {
          status: "COMPLETED",
          resultUrl: url,
          completedAt: new Date().toISOString(),
        });
        if (url) {
          addItem({
            id: crypto.randomUUID(),
            taskType: "image-generation",
            resultUrl: url,
            resultType: "image",
            params: body,
            createdAt: new Date().toISOString(),
          });
        }
      },
      onError: (err) => {
        setError(err);
        setStatus("FAILED");
        updateTask(taskId, { status: "FAILED", error: err });
      },
    });
  }, [
    apiKey,
    prompt,
    model,
    creativity,
    guidanceScale,
    steps,
    autoTranslate,
    isNonEnglish,
    isExhausted,
    decrement,
    addTask,
    updateTask,
    addItem,
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
              {IMAGE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.description}
                </option>
              ))}
            </select>
          </div>

          {/* Prompt */}
          <PromptInput
            value={prompt}
            onChange={setPrompt}
            maxLength={2000}
            placeholder="A beautiful sunset over the ocean with dramatic clouds..."
          />

          {/* Auto-translate toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Auto-translate to English</p>
                <p className="text-xs text-muted-foreground">
                  AI models work best with English prompts
                </p>
              </div>
            </div>
            <button
              onClick={() => setAutoTranslate(!autoTranslate)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                autoTranslate ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  autoTranslate ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Non-English detection indicator */}
          {isNonEnglish && autoTranslate && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Languages className="w-3 h-3" />
              Non-English detected — will auto-translate before generating
            </p>
          )}

          {/* Show translated prompt if available */}
          {translatedPrompt && (
            <div className="p-3 rounded-lg bg-accent/50 border border-border">
              <p className="text-xs font-medium text-muted-foreground mb-1">Translated prompt used:</p>
              <p className="text-sm">{translatedPrompt}</p>
            </div>
          )}

          {/* Model-specific controls */}
          {model.supports?.creativity && (
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

          {model.supports?.guidanceScale && (
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
              isExhausted(model.rateKey)
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

          {isExhausted(model.rateKey) && (
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
