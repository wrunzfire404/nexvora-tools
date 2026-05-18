"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { Key, ExternalLink } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requireMagnific?: boolean;
}

export function AuthGuard({ children, requireMagnific = false }: AuthGuardProps) {
  const { apiKey } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // If this page requires Magnific key and it's not set, show inline prompt
  if (requireMagnific && !apiKey) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-4">
        <InlineKeyPrompt />
      </div>
    );
  }

  return <>{children}</>;
}

function InlineKeyPrompt() {
  const { setApiKey } = useAuthStore();
  const [key, setKey] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) { setError("API key diperlukan"); return; }
    if (trimmed.length > 256) { setError("API key terlalu panjang"); return; }
    setApiKey(trimmed);
  };

  return (
    <div className="w-full max-w-md">
      <div className="p-6 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 mb-3">
          <Key className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Magnific API Key Diperlukan</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Fitur ini membutuhkan Magnific API key. Dapatkan gratis di magnific.com/api
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Masukkan Magnific API key..."
            className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button type="submit" className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90">
            Simpan & Lanjutkan
          </button>
        </form>
        <a href="https://www.magnific.com/api" target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 mt-3 text-sm text-muted-foreground hover:text-foreground">
          <ExternalLink className="w-3.5 h-3.5" /> Dapatkan API key gratis
        </a>
      </div>
    </div>
  );
}
