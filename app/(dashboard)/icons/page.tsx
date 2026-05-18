"use client";

import { useState, useCallback, useEffect } from "react";
import { Shapes, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useRateLimitStore } from "@/stores/rate-limit-store";
import { useHistoryStore } from "@/stores/history-store";
import { submitTask } from "@/lib/api-client";
import { pollTask } from "@/lib/task-poller";
import { PromptInput } from "@/components/shared/prompt-input";
import { DownloadButton } from "@/components/shared/download-button";
import { TaskStatusBadge } from "@/components/shared/task-status";
import { MAGNIFIC_ENDPOINTS, POLL_INTERVALS, POLL_TIMEOUTS } from "@/lib/constants";
import { isLikelyNonEnglish, translatePromptToEnglish } from "@/lib/translate";


const ICON_STYLES = ["solid", "outline", "color", "flat", "sticker"] as const;

export default function IconsPage() {
  const { apiKey } = useAuthStore();
  const { decrement, isExhausted, resetIfNewDay } = useRateLimitStore();
  const { addItem } = useHistoryStore();

  const [description, setDescription] = useState("");
  const [style, setStyle] = useState<string>("solid");
  const [status, setStatus] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { resetIfNewDay(); }, [resetIfNewDay]);

  const handleGenerate = useCallback(async () => {
    if (!apiKey || !description.trim()) return;
    if (isExhausted("icon-generation")) { setError("Daily quota exhausted."); return; }

    setIsSubmitting(true); setStatus("PENDING"); setResultUrl(null); setError(null);

    // Auto-translate if non-English
    let finalPrompt = description.trim();
    if (isLikelyNonEnglish(finalPrompt)) {
      const { translated } = await translatePromptToEnglish(finalPrompt, apiKey);
      finalPrompt = translated;
    }

    const body: Record<string, unknown> = { prompt: finalPrompt, style };
    const response = await submitTask(MAGNIFIC_ENDPOINTS["icon-generation"], body, apiKey);

    if (!response.ok) { setError(response.error || "Failed"); setStatus("FAILED"); setIsSubmitting(false); return; }

    const taskId = response.data!.data.task_id;
    decrement("icon-generation");
    setStatus("PROCESSING"); setIsSubmitting(false);

    pollTask({
      taskId, endpoint: MAGNIFIC_ENDPOINTS["icon-generation"], apiKey,
      interval: POLL_INTERVALS.image, timeout: POLL_TIMEOUTS.prompt,
      onStatusChange: (s) => setStatus(s),
      onComplete: (result) => {
        const url = result.url || result.urls?.[0];
        setResultUrl(url || null); setStatus("COMPLETED");
        if (url) addItem({ id: crypto.randomUUID(), taskType: "icon-generation", resultUrl: url, resultType: "image", params: body, createdAt: new Date().toISOString() });
      },
      onError: (err) => { setError(err); setStatus("FAILED"); },
    });
  }, [apiKey, description, style, isExhausted, decrement, addItem]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Shapes className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">AI Icon Generation</h1>
          <p className="text-sm text-muted-foreground">Generate custom icons with AI</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <PromptInput value={description} onChange={setDescription} maxLength={500} label="Icon Description" placeholder="A rocket ship launching into space..." rows={3} />

          <div>
            <label className="text-sm font-medium mb-1.5 block">Style</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ICON_STYLES.map((s) => (
                <button key={s} onClick={() => setStyle(s)}
                  className={`px-3 py-2 rounded-lg text-sm border capitalize transition-colors ${style === s ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleGenerate} disabled={!description.trim() || isSubmitting || status === "PROCESSING" || isExhausted("icon-generation")}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {isSubmitting || status === "PROCESSING" ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : "Generate Icon"}
          </button>
        </div>

        <div className="space-y-4">
          {status && <TaskStatusBadge status={status} />}
          {error && <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">{error}</div>}
          {resultUrl && (
            <div className="space-y-3">
              <div className="rounded-lg overflow-hidden border border-border bg-muted p-8 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resultUrl} alt="Generated icon" className="w-48 h-48 object-contain" />
              </div>
              <DownloadButton url={resultUrl} taskType="icon" />
            </div>
          )}
          {!resultUrl && !status && (
            <div className="flex flex-col items-center justify-center h-64 rounded-lg border border-dashed border-border text-muted-foreground">
              <Shapes className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Generated icon will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
