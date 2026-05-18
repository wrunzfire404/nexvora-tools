"use client";

import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
  creditCost?: number;
}

export function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title = "Konfirmasi",
  message = "Aksi ini akan menggunakan credit API kamu.",
  creditCost = 1,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-warning" />
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>

        <p className="text-sm text-muted-foreground mb-4">{message}</p>

        <div className="p-3 rounded-lg bg-accent/50 border border-border mb-4">
          <p className="text-xs text-muted-foreground">
            💰 Estimasi credit: <strong className="text-foreground">{creditCost} credit</strong>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Credit tidak bisa dikembalikan jika request gagal.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Ya, Lanjutkan
          </button>
        </div>
      </div>
    </div>
  );
}
