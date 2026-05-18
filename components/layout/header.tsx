"use client";

import { useState, useEffect } from "react";
import { Key, X, Check } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

export function Header() {
  const { apiKey, setApiKey, clearApiKey } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [magnificKey, setMagnificKey] = useState("");
  const [leonardoKey, setLeonardoKey] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setLeonardoKey(localStorage.getItem("nexvora-leonardo-key") || "");
    }
  }, []);

  const handleSave = () => {
    if (magnificKey.trim()) setApiKey(magnificKey.trim());
    if (leonardoKey.trim() && typeof window !== "undefined") {
      localStorage.setItem("nexvora-leonardo-key", leonardoKey.trim());
    }
    setShowModal(false);
  };

  const handleOpen = () => {
    setMagnificKey(apiKey || "");
    if (typeof window !== "undefined") {
      setLeonardoKey(localStorage.getItem("nexvora-leonardo-key") || "");
    }
    setShowModal(true);
  };

  const hasKeys = apiKey || (mounted && typeof window !== "undefined" && localStorage.getItem("nexvora-leonardo-key"));

  return (
    <>
      <header className="hidden md:flex items-center justify-end h-14 px-6 border-b border-border bg-card/50">
        <button
          onClick={handleOpen}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors"
        >
          <Key className="w-4 h-4" />
          <span>{hasKeys ? "API Keys ✓" : "Set API Keys"}</span>
        </button>
      </header>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">API Keys</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-md hover:bg-accent">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              Masukkan API key dari provider yang kamu punya. Key disimpan di browser.
            </p>

            <div className="space-y-4">
              {/* Magnific */}
              <div>
                <label className="text-sm font-medium mb-1 block flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  Magnific API Key
                </label>
                <input
                  type="password"
                  value={magnificKey}
                  onChange={(e) => setMagnificKey(e.target.value)}
                  placeholder="Magnific / Freepik API key..."
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Untuk: Image Gen, Upscaler, Expand, Relight, UGC, Motion Control
                </p>
              </div>

              {/* Leonardo */}
              <div>
                <label className="text-sm font-medium mb-1 block flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Leonardo AI Key
                </label>
                <input
                  type="password"
                  value={leonardoKey}
                  onChange={(e) => setLeonardoKey(e.target.value)}
                  placeholder="Leonardo AI API key..."
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Untuk: Video Gen (Kling 3.0, Veo 3), Image Gen (Flux, GPT Image)
                </p>
              </div>

              <button
                onClick={handleSave}
                className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" /> Simpan
              </button>

              {(apiKey || leonardoKey) && (
                <button
                  onClick={() => { clearApiKey(); if (typeof window !== "undefined") localStorage.removeItem("nexvora-leonardo-key"); setMagnificKey(""); setLeonardoKey(""); }}
                  className="w-full py-2 rounded-lg border border-destructive/30 text-destructive text-xs font-medium hover:bg-destructive/10"
                >
                  Hapus Semua Key
                </button>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-border space-y-1.5">
              <a href="https://www.magnific.com/api" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[11px] text-muted-foreground hover:text-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Dapatkan Magnific key gratis →
              </a>
              <a href="https://app.leonardo.ai/api-access" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[11px] text-muted-foreground hover:text-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Dapatkan Leonardo key ($5 free credit) →
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
