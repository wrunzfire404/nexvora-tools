"use client";

import { useState, useCallback, useEffect } from "react";
import { Layers, Loader2, Download, X, CheckCircle2, XCircle } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useRateLimitStore } from "@/stores/rate-limit-store";
import { apiRequest } from "@/lib/api-client";
import { formatBytes } from "@/lib/utils";
import { FILE_LIMITS } from "@/lib/constants";

interface UploadedFile {
  id: string;
  file: File;
  previewUrl: string;
  status: "pending" | "uploading" | "processing" | "completed" | "failed";
  resultUrl?: string;
  error?: string;
}

export default function BatchUpscalePage() {
  const { apiKey } = useAuthStore();
  const { decrement, resetIfNewDay } = useRateLimitStore();

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [mode, setMode] = useState<"precision" | "creative">("precision");
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => { resetIfNewDay(); }, [resetIfNewDay]);

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles
      .filter((f) => (FILE_LIMITS.supportedFormats as readonly string[]).includes(f.type))
      .filter((f) => f.size <= FILE_LIMITS.maxSize)
      .slice(0, 10); // Max 10 files

    const newFiles: UploadedFile[] = validFiles.map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      previewUrl: URL.createObjectURL(f),
      status: "pending",
    }));

    setFiles((prev) => [...prev, ...newFiles].slice(0, 10));
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) URL.revokeObjectURL(file.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  const upscaleFile = async (file: UploadedFile): Promise<{ url?: string; error?: string }> => {
    // Convert to base64
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.readAsDataURL(file.file);
    });

    const endpoint = mode === "creative" ? "/v1/ai/image-upscaler" : "/v1/ai/image-upscaler-precision";
    const body: Record<string, unknown> = { image: base64 };

    // Submit
    const submitRes = await apiRequest<{ data: { task_id: string } }>(endpoint, {
      method: "POST", body, apiKey: apiKey!, timeout: 30000,
    });

    if (!submitRes.ok) return { error: submitRes.error || "Submit failed" };

    const taskId = submitRes.data!.data.task_id;
    decrement(mode === "creative" ? "image-upscaler" : "image-upscaler-precision");

    // Poll
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const pollRes = await apiRequest<{ data: { status: string; generated?: string[] } }>(
        `${endpoint}/${taskId}`, { method: "GET", apiKey: apiKey!, timeout: 10000 }
      );
      if (pollRes.ok && pollRes.data?.data) {
        if (pollRes.data.data.status === "COMPLETED" && pollRes.data.data.generated?.[0]) {
          return { url: pollRes.data.data.generated[0] };
        }
        if (pollRes.data.data.status === "FAILED") return { error: "Upscale failed" };
      }
    }
    return { error: "Timeout" };
  };

  const handleBatchUpscale = useCallback(async () => {
    if (!apiKey || files.length === 0) return;
    setIsProcessing(true);
    setCompletedCount(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.status === "completed") continue;

      setFiles((prev) => prev.map((f) => f.id === file.id ? { ...f, status: "processing" } : f));

      const result = await upscaleFile(file);

      setFiles((prev) => prev.map((f) =>
        f.id === file.id
          ? { ...f, status: result.url ? "completed" : "failed", resultUrl: result.url, error: result.error }
          : f
      ));
      setCompletedCount((c) => c + 1);
    }

    setIsProcessing(false);
  }, [apiKey, files, mode]);

  const downloadAll = () => {
    files.filter((f) => f.resultUrl).forEach((f, i) => {
      setTimeout(() => {
        const a = document.createElement("a");
        a.href = f.resultUrl!;
        a.target = "_blank";
        a.click();
      }, i * 500);
    });
  };

  const completedFiles = files.filter((f) => f.status === "completed");

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Batch Upscaler</h1>
          <p className="text-sm text-muted-foreground">Upscale banyak gambar sekaligus</p>
        </div>
      </div>

      <div className="mb-6 p-3 rounded-lg bg-accent/30 border border-border text-sm text-muted-foreground">
        💡 <strong>Apa ini?</strong> Upload sampai 10 foto sekaligus, dan AI akan upscale semua satu per satu secara otomatis. Cocok buat batch processing foto produk, portfolio, atau album.
      </div>

      {!apiKey && (
        <div className="mb-4 p-4 rounded-lg border border-primary/30 bg-primary/5">
          <p className="text-sm font-medium">🔑 API Key belum diset</p>
          <p className="text-xs text-muted-foreground mt-1">Klik tombol &quot;API Key&quot; di kanan atas.</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Mode */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Mode:</label>
          <div className="flex gap-2">
            <button onClick={() => setMode("precision")}
              className={`px-3 py-1.5 rounded-lg text-xs border ${mode === "precision" ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>
              Precision (faithful)
            </button>
            <button onClick={() => setMode("creative")}
              className={`px-3 py-1.5 rounded-lg text-xs border ${mode === "creative" ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>
              Creative (enhance)
            </button>
          </div>
        </div>

        {/* Upload area */}
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-8 cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors">
          <Layers className="w-8 h-8 mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Klik untuk pilih gambar (max 10)</p>
          <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, WebP • Max 10MB per file</p>
          <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={handleFilesSelect} className="hidden" />
        </label>

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{files.length} file{files.length > 1 ? "s" : ""}</p>
              {completedFiles.length > 0 && (
                <button onClick={downloadAll} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                  <Download className="w-3 h-3" /> Download All ({completedFiles.length})
                </button>
              )}
            </div>

            {files.map((f) => (
              <div key={f.id} className="flex items-center gap-3 p-2 rounded-lg border border-border bg-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.previewUrl} alt="" className="w-12 h-12 rounded object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{f.file.name}</p>
                  <p className="text-[10px] text-muted-foreground">{formatBytes(f.file.size)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {f.status === "processing" && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                  {f.status === "completed" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  {f.status === "failed" && <XCircle className="w-4 h-4 text-destructive" />}
                  {f.resultUrl && (
                    <a href={f.resultUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline">View</a>
                  )}
                  {f.status === "pending" && (
                    <button onClick={() => removeFile(f.id)} className="p-1 hover:bg-accent rounded">
                      <X className="w-3 h-3 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Progress */}
        {isProcessing && (
          <div className="p-3 rounded-lg bg-accent/50 border border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium">Processing...</p>
              <p className="text-xs text-muted-foreground">{completedCount}/{files.length}</p>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(completedCount / files.length) * 100}%` }} />
            </div>
          </div>
        )}

        {/* Start button */}
        <button onClick={handleBatchUpscale}
          disabled={files.length === 0 || isProcessing || !apiKey || files.every((f) => f.status === "completed")}
          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium text-sm hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" />Processing {completedCount}/{files.length}...</> : <><Layers className="w-4 h-4" />Upscale {files.length} Gambar</>}
        </button>
      </div>
    </div>
  );
}
