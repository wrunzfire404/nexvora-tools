"use client";

import { useState, useEffect } from "react";
import { Info, AlertTriangle, XCircle, X } from "lucide-react";

interface Announcement {
  id: string;
  message: string;
  type: "info" | "warning" | "error";
}

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/admin/announcements")
      .then((r) => r.json())
      .then((data) => setAnnouncements(data.announcements || []))
      .catch(() => {});
  }, []);

  const visible = announcements.filter((a) => !dismissed.includes(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {visible.map((a) => (
        <div
          key={a.id}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm ${
            a.type === "error"
              ? "bg-destructive/10 border border-destructive/20 text-destructive"
              : a.type === "warning"
              ? "bg-yellow-500/10 border border-yellow-500/20 text-yellow-500"
              : "bg-blue-500/10 border border-blue-500/20 text-blue-400"
          }`}
        >
          {a.type === "error" ? <XCircle className="w-4 h-4 shrink-0" /> : a.type === "warning" ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <Info className="w-4 h-4 shrink-0" />}
          <span className="flex-1">{a.message}</span>
          <button onClick={() => setDismissed((d) => [...d, a.id])} className="p-0.5 hover:opacity-70">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
