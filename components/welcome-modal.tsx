"use client";

import { useState, useEffect } from "react";
import { X, Key, MessageCircle } from "lucide-react";

export function WelcomeModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show only once per browser
    const seen = localStorage.getItem("nexvora-welcome-seen");
    if (!seen) {
      setShow(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("nexvora-welcome-seen", "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/nexlogo.png" alt="" className="w-8 h-8 rounded-lg" />
            <span className="font-bold">Nexvora Tools</span>
          </div>
          <button onClick={handleClose} className="p-1 rounded-md hover:bg-accent">
            <X className="w-4 h-4" />
          </button>
        </div>

        <h2 className="text-lg font-bold mb-2">Selamat Datang! 👋</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Sebelum mulai, ada 2 hal penting:
        </p>

        {/* Steps */}
        <div className="space-y-3 mb-5">
          <div className="flex gap-3 p-3 rounded-lg bg-accent/30 border border-border">
            <Key className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">1. Set API Key</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Klik tombol <strong>&quot;API Keys&quot;</strong> di kanan atas untuk memasukkan API key dari Magnific atau Leonardo AI.
              </p>
            </div>
          </div>

          <div className="flex gap-3 p-3 rounded-lg bg-accent/30 border border-border">
            <MessageCircle className="w-5 h-5 text-[#0088cc] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">2. Join Komunitas</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Dapatkan info update, tips, dan bantuan di Telegram channel kami.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <a
            href="https://t.me/NexvoraWebtools"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-[#0088cc] text-white text-sm font-medium hover:bg-[#0077b5] transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            Join Channel Telegram
          </a>
          <button
            onClick={handleClose}
            className="w-full py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors"
          >
            Mulai Gunakan
          </button>
        </div>

        <p className="text-[10px] text-muted-foreground text-center mt-3">
          Pesan ini hanya muncul sekali.
        </p>
      </div>
    </div>
  );
}
