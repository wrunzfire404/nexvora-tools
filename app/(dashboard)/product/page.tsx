"use client";

import { useState, useCallback, useEffect } from "react";
import { ShoppingBag, Loader2, Download, Plus } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { ImageUpload } from "@/components/shared/image-upload";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

const SCENE_PRESETS = [
  { id: "white-clean", name: "White Clean", description: "Latar putih bersih, studio", prompt: "Product photography on pure white background, professional studio lighting, clean minimal composition, high-end commercial photography, sharp focus on product, soft shadows" },
  { id: "lifestyle-table", name: "Lifestyle Table", description: "Di atas meja dengan dekorasi", prompt: "Product placed on elegant wooden table, lifestyle setting, natural window light, minimal props, cozy aesthetic, professional product photography, bokeh background" },
  { id: "outdoor-nature", name: "Outdoor Nature", description: "Outdoor dengan tanaman/alam", prompt: "Product in natural outdoor setting, surrounded by green plants and soft natural light, fresh and organic feel, professional product photography, shallow depth of field" },
  { id: "marble-luxury", name: "Marble Luxury", description: "Marble/luxury aesthetic", prompt: "Product on white marble surface, luxury aesthetic, gold accents, premium brand photography, elegant composition, soft studio lighting, high-end commercial" },
  { id: "colorful-pop", name: "Colorful Pop", description: "Background warna cerah", prompt: "Product on vibrant colorful background, bold pop art style, eye-catching commercial photography, dynamic composition, bright studio lighting, social media ready" },
  { id: "dark-moody", name: "Dark Moody", description: "Dark background, dramatic", prompt: "Product on dark background, dramatic moody lighting, premium feel, cinematic product photography, rim lighting, professional commercial shot" },
  { id: "flat-lay", name: "Flat Lay", description: "Top-down flat lay style", prompt: "Product in flat lay composition, top-down view, organized arrangement with complementary props, clean aesthetic, professional product photography, Instagram style" },
  { id: "hand-holding", name: "Hand Model", description: "Dipegang tangan model", prompt: "Product being held by a hand model, natural pose, soft studio lighting, focus on product, professional commercial photography, clean background" },
];

interface GeneratedResult {
  id: string;
  imageUrl: string;
  scene: string;
}

export default function ProductPage() {
  const { apiKey } = useAuthStore();

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedScenes, setSelectedScenes] = useState<string[]>(["white-clean"]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GeneratedResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>("");
  const [showConfirm, setShowConfirm] = useState(false);

  const handleImageSelect = useCallback((file: File) => {
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResults([]);
    setError(null);
  }, []);

  const handleImageRemove = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedImage(null);
    setPreviewUrl(null);
  }, [previewUrl]);

  const toggleScene = (sceneId: string) => {
    setSelectedScenes((prev) =>
      prev.includes(sceneId) ? prev.filter((s) => s !== sceneId) : [...prev, sceneId]
    );
  };

  const generateWithMagnific = async (scenePrompt: string): Promise<string | null> => {
    if (!apiKey) throw new Error("Magnific API key belum diset");

    const fullPrompt = `Professional product photography. ${scenePrompt}. ${customPrompt || ""}`;

    const response = await fetch("/api/magnific/v1/ai/mystic", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({ prompt: fullPrompt }),
    });

    const data = await response.json();
    if (data?.data?.task_id) {
      const taskId = data.data.task_id;
      for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        const statusRes = await fetch(`/api/magnific/v1/ai/mystic/${taskId}`, {
          headers: { "x-api-key": apiKey },
        });
        const statusData = await statusRes.json();
        if (statusData?.data?.status === "COMPLETED" && statusData?.data?.generated?.[0]) {
          return statusData.data.generated[0];
        }
        if (statusData?.data?.status === "FAILED") {
          throw new Error("Generation failed");
        }
      }
      throw new Error("Timeout");
    }
    throw new Error(data?.error || data?.message || "Failed to submit");
  };

  const handleGenerate = useCallback(async () => {
    if (!selectedImage || selectedScenes.length === 0 || !apiKey) return;

    setIsGenerating(true);
    setError(null);
    setResults([]);

    const newResults: GeneratedResult[] = [];

    for (let i = 0; i < selectedScenes.length; i++) {
      const sceneId = selectedScenes[i];
      const scene = SCENE_PRESETS.find((s) => s.id === sceneId)!;
      setProgress(`Generating ${i + 1}/${selectedScenes.length}: ${scene.name}...`);

      try {
        const resultUrl = await generateWithMagnific(scene.prompt);
        if (resultUrl) {
          newResults.push({ id: crypto.randomUUID(), imageUrl: resultUrl, scene: scene.name });
          setResults([...newResults]);
        }
      } catch (err) {
        console.error(`Failed ${scene.name}:`, err);
      }
    }

    if (newResults.length === 0) {
      setError("Semua generasi gagal. Cek API key dan coba lagi.");
    }

    setIsGenerating(false);
    setProgress("");
  }, [selectedImage, selectedScenes, apiKey, customPrompt]);

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">E-Commerce Product Generator</h1>
          <p className="text-sm text-muted-foreground">Generate professional product photos</p>
        </div>
      </div>

      <div className="mb-6 p-3 rounded-lg bg-accent/30 border border-border text-sm text-muted-foreground">
        💡 <strong>Apa ini?</strong> Pilih background/scene, AI akan generate foto produk profesional dengan latar tersebut. Cocok buat toko online dan social media. Bisa generate banyak variasi sekaligus.
      </div>

      {!apiKey && (
        <div className="mb-4 p-4 rounded-lg border border-primary/30 bg-primary/5">
          <p className="text-sm font-medium">🔑 Magnific API Key belum diset</p>
          <p className="text-xs text-muted-foreground mt-1">Masukkan API key di tombol &quot;API Key&quot; di header, atau dapatkan gratis di <a href="https://www.magnific.com/api" target="_blank" rel="noopener noreferrer" className="text-primary underline">magnific.com/api</a></p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Controls */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Foto Produk</label>
            <ImageUpload onImageSelect={handleImageSelect} onImageRemove={handleImageRemove} selectedImage={selectedImage} previewUrl={previewUrl} />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Detail Tambahan <span className="text-muted-foreground font-normal">(opsional)</span></label>
            <textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} placeholder="Misal: produk skincare, warna pink..." rows={2}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground" />
          </div>

          <button onClick={() => setShowConfirm(true)} disabled={!selectedImage || selectedScenes.length === 0 || isGenerating || !apiKey}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-orange-600 to-red-600 text-white font-medium text-sm hover:from-orange-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" />{progress || "Generating..."}</> : <><ShoppingBag className="w-4 h-4" />Generate {selectedScenes.length} Variasi</>}
          </button>

          <ConfirmDialog isOpen={showConfirm} onConfirm={() => { setShowConfirm(false); handleGenerate(); }} onCancel={() => setShowConfirm(false)}
            title="Generate Product Photos?" message={`Akan generate ${selectedScenes.length} variasi foto produk.`} creditCost={selectedScenes.length} />
        </div>

        {/* Middle: Scene Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">Pilih Background ({selectedScenes.length} dipilih)</label>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {SCENE_PRESETS.map((scene) => (
              <button key={scene.id} onClick={() => toggleScene(scene.id)}
                className={`w-full p-3 rounded-lg text-left border transition-colors ${selectedScenes.includes(scene.id) ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{scene.name}</p>
                  {selectedScenes.includes(scene.id) && <Plus className="w-4 h-4 text-primary rotate-45" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{scene.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Results */}
        <div>
          <label className="text-sm font-medium block mb-2">Hasil ({results.length})</label>
          {error && <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive mb-3">{error}</div>}
          {results.length > 0 ? (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {results.map((result) => (
                <div key={result.id} className="rounded-lg border border-border overflow-hidden bg-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={result.imageUrl} alt={result.scene} className="w-full h-auto" />
                  <div className="p-2 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{result.scene}</span>
                    <button onClick={() => downloadImage(result.imageUrl, `product-${result.scene.toLowerCase().replace(/\s/g, "-")}.png`)}
                      className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90">
                      <Download className="w-3 h-3" /> Save
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 rounded-lg border border-dashed border-border text-muted-foreground p-4">
              <ShoppingBag className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-xs text-center">Hasil foto produk muncul di sini</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
