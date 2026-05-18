"use client";

import { useState, useCallback, useEffect } from "react";
import { Wand2, Copy, ArrowRight, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useRateLimitStore } from "@/stores/rate-limit-store";
import { apiRequest } from "@/lib/api-client";
import { ImageUpload } from "@/components/shared/image-upload";
import { PromptInput } from "@/components/shared/prompt-input";
import { MAGNIFIC_ENDPOINTS } from "@/lib/constants";
import { useRouter } from "next/navigation";

export default function PromptToolsPage() {
  const { apiKey } = useAuthStore();
  const { decrement, isExhausted, resetIfNewDay } = useRateLimitStore();
  const router = useRouter();

  // Image to Prompt state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedPrompt, setExtractedPrompt] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  // Improve Prompt state
  const [inputPrompt, setInputPrompt] = useState("");
  const [improvedPrompt, setImprovedPrompt] = useState("");
  const [improving, setImproving] = useState(false);
  const [improveError, setImproveError] = useState<string | null>(null);
  const [iterations, setIterations] = useState(0);

  useEffect(() => {
    resetIfNewDay();
  }, [resetIfNewDay]);

  // Image to Prompt
  const handleImageSelect = useCallback((file: File) => {
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setExtractedPrompt("");
    setExtractError(null);
  }, []);

  const handleImageRemove = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedImage(null);
    setPreviewUrl(null);
    setExtractedPrompt("");
  }, [previewUrl]);

  const handleExtract = useCallback(async () => {
    if (!apiKey || !selectedImage) return;
    if (isExhausted("image-to-prompt")) {
      setExtractError("Daily quota exhausted.");
      return;
    }

    setExtracting(true);
    setExtractError(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      const response = await apiRequest<{ data: { prompt: string } }>(
        MAGNIFIC_ENDPOINTS["image-to-prompt"],
        { method: "POST", body: { image: base64 }, apiKey: apiKey!, timeout: 30000 }
      );

      if (response.ok && response.data) {
        setExtractedPrompt(response.data.data.prompt);
        decrement("image-to-prompt");
      } else {
        setExtractError(response.error || "Failed to extract prompt");
      }
      setExtracting(false);
    };
    reader.readAsDataURL(selectedImage);
  }, [apiKey, selectedImage, isExhausted, decrement]);

  // Improve Prompt
  const handleImprove = useCallback(async () => {
    const textToImprove = improvedPrompt || inputPrompt;
    if (!apiKey || !textToImprove.trim()) return;
    if (isExhausted("improve-prompt")) {
      setImproveError("Daily quota exhausted.");
      return;
    }
    if (iterations >= 10) {
      setImproveError("Maximum 10 iterations reached.");
      return;
    }

    setImproving(true);
    setImproveError(null);

    const response = await apiRequest<{ data: { prompt: string } }>(
      MAGNIFIC_ENDPOINTS["improve-prompt"],
      { method: "POST", body: { prompt: textToImprove.trim() }, apiKey, timeout: 30000 }
    );

    if (response.ok && response.data) {
      setImprovedPrompt(response.data.data.prompt);
      setIterations((i) => i + 1);
      decrement("improve-prompt");
    } else {
      setImproveError(response.error || "Failed to improve prompt");
    }
    setImproving(false);
  }, [apiKey, inputPrompt, improvedPrompt, iterations, isExhausted, decrement]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const useInGenerator = (text: string) => {
    // Store in sessionStorage and navigate
    sessionStorage.setItem("prefill-prompt", text);
    router.push("/generate");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Wand2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Prompt Tools</h1>
          <p className="text-sm text-muted-foreground">Extract and improve prompts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image to Prompt */}
        <div className="p-4 rounded-xl border border-border bg-card space-y-4">
          <h2 className="text-lg font-semibold">Image to Prompt</h2>
          <p className="text-sm text-muted-foreground">Upload an image to extract a text prompt</p>

          <ImageUpload
            onImageSelect={handleImageSelect}
            onImageRemove={handleImageRemove}
            selectedImage={selectedImage}
            previewUrl={previewUrl}
          />

          <button
            onClick={handleExtract}
            disabled={!selectedImage || extracting || isExhausted("image-to-prompt")}
            className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {extracting ? <><Loader2 className="w-4 h-4 animate-spin" />Extracting...</> : "Extract Prompt"}
          </button>

          {extractError && <p className="text-sm text-destructive">{extractError}</p>}

          {extractedPrompt && (
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-muted text-sm whitespace-pre-wrap">{extractedPrompt}</div>
              <div className="flex gap-2">
                <button onClick={() => copyToClipboard(extractedPrompt)} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-md border border-border hover:bg-accent">
                  <Copy className="w-3 h-3" /> Copy
                </button>
                <button onClick={() => useInGenerator(extractedPrompt)} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
                  <ArrowRight className="w-3 h-3" /> Use in Generator
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Improve Prompt */}
        <div className="p-4 rounded-xl border border-border bg-card space-y-4">
          <h2 className="text-lg font-semibold">Improve Prompt</h2>
          <p className="text-sm text-muted-foreground">Enhance your prompt for better results</p>

          <PromptInput
            value={inputPrompt}
            onChange={(v) => { setInputPrompt(v); setImprovedPrompt(""); setIterations(0); }}
            maxLength={10000}
            label="Your Prompt"
            placeholder="Enter a prompt to improve..."
            rows={3}
          />

          <button
            onClick={handleImprove}
            disabled={!inputPrompt.trim() || improving || isExhausted("improve-prompt") || iterations >= 10}
            className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {improving ? <><Loader2 className="w-4 h-4 animate-spin" />Improving...</> : iterations > 0 ? `Improve Again (${iterations}/10)` : "Improve Prompt"}
          </button>

          {improveError && <p className="text-sm text-destructive">{improveError}</p>}

          {improvedPrompt && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Improved Prompt:</label>
              <div className="p-3 rounded-lg bg-muted text-sm whitespace-pre-wrap">{improvedPrompt}</div>
              <div className="flex gap-2">
                <button onClick={() => copyToClipboard(improvedPrompt)} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-md border border-border hover:bg-accent">
                  <Copy className="w-3 h-3" /> Copy
                </button>
                <button onClick={() => useInGenerator(improvedPrompt)} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
                  <ArrowRight className="w-3 h-3" /> Use in Generator
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
