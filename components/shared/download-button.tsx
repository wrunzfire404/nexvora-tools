"use client";

import { Download } from "lucide-react";
import { generateFilename } from "@/lib/utils";

interface DownloadButtonProps {
  url: string;
  taskType: string;
  extension?: string;
  className?: string;
}

export function DownloadButton({
  url,
  taskType,
  extension = "png",
  className,
}: DownloadButtonProps) {
  const handleDownload = async () => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = generateFilename(taskType, extension);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: open in new tab
      window.open(url, "_blank");
    }
  };

  return (
    <button
      onClick={handleDownload}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors ${className ?? ""}`}
    >
      <Download className="w-4 h-4" />
      Download
    </button>
  );
}
