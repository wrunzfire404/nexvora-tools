"use client";

import { useState } from "react";
import { Key, X, Check } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

export function Header() {
  const { apiKey, setApiKey, clearApiKey } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [inputKey, setInputKey] = useState("");

  const handleSave = () => {
    const trimmed = inputKey.trim();
    if (trimmed) {
      setApiKey(trimmed);
      setShowModal(false);
      setInputKey("");
    }
  };

  const handleOpen = () => {
    setInputKey(apiKey || "");
    setShowModal(true);
  };

  return (
    <>
      <header className="hidden md:flex items-center justify-end h-14 px-6 border-b border-border bg-card/50">
        <button
          onClick={handleOpen}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors"
          title="Manage API Key"
        >
          <Key className="w-4 h-4" />
          <span>{apiKey ? "API Key ✓" : "Set API Key"}</span>
        </button>
      </header>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Magnific API Key</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-md hover:bg-accent">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              API key digunakan untuk semua fitur (Image Gen, Upscaler, UGC, dll). Disimpan di browser kamu.
            </p>

            <div className="space-y-3">
              <input
                type="password"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="Masukkan Magnific API key..."
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />

              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={!inputKey.trim()}
                  className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" /> Simpan
                </button>
                {apiKey && (
                  <button
                    onClick={() => { clearApiKey(); setShowModal(false); }}
                    className="px-4 py-2 rounded-lg border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/10"
                  >
                    Hapus
                  </button>
                )}
              </div>

              <a
                href="https://www.magnific.com/api"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Belum punya? Dapatkan gratis di magnific.com/api →
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
