"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Key } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

export default function SetupPage() {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const { setApiKey, apiKey } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && apiKey) {
      router.replace("/generate");
    }
  }, [mounted, apiKey, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmed = key.trim();
    if (!trimmed) {
      setError("API key diperlukan");
      return;
    }
    if (trimmed.length > 256) {
      setError("API key terlalu panjang (max 256 karakter)");
      return;
    }

    setApiKey(trimmed);
    router.push("/generate");
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/nexlogo.png" alt="Nexvora" className="w-16 h-16 rounded-2xl mb-4" />
          <h1 className="text-2xl font-bold">Nexvora Tools</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Setup Magnific API Key
          </p>
        </div>

        {/* Form */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Magnific API Key</h2>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Untuk fitur Image Generation, Upscaler, Relight, UGC, dan Motion Control.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Masukkan Magnific API key..."
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                autoFocus
              />
              {error && (
                <p className="text-sm text-destructive mt-1.5">{error}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              Simpan & Lanjutkan
            </button>
          </form>

          <a
            href="https://www.magnific.com/api"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Dapatkan API key gratis
          </a>
        </div>

        {/* Skip option */}
        <div className="mt-4 text-center">
          <button
            onClick={() => router.push("/product")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip — langsung ke fitur yang pakai Gemini →
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            API key disimpan di browser kamu dan tidak dikirim ke server kami.
          </p>
        </div>
      </div>
    </div>
  );
}
