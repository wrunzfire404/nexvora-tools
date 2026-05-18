"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, AlertCircle } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import { FILE_LIMITS } from "@/lib/constants";

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  onImageRemove: () => void;
  selectedImage: File | null;
  previewUrl: string | null;
  maxSize?: number;
  className?: string;
}

export function ImageUpload({
  onImageSelect,
  onImageRemove,
  selectedImage,
  previewUrl,
  maxSize = FILE_LIMITS.maxSize,
  className,
}: ImageUploadProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: unknown[]) => {
      setError(null);

      if (rejectedFiles && (rejectedFiles as Array<unknown>).length > 0) {
        setError("Unsupported file format. Use JPEG, PNG, or WebP.");
        return;
      }

      const file = acceptedFiles[0];
      if (!file) return;

      if (file.size > maxSize) {
        setError(`File too large. Maximum size is ${formatBytes(maxSize)}.`);
        return;
      }

      if (!(FILE_LIMITS.supportedFormats as readonly string[]).includes(file.type)) {
        setError("Unsupported format. Use JPEG, PNG, or WebP.");
        return;
      }

      // Validate it's actually an image
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        onImageSelect(file);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        setError("File is not a valid image.");
      };
      img.src = url;
    },
    [maxSize, onImageSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxFiles: 1,
    multiple: false,
  });

  if (selectedImage && previewUrl) {
    return (
      <div className={cn("relative", className)}>
        <div className="relative rounded-lg overflow-hidden border border-border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-auto max-h-[400px] object-contain"
          />
          <button
            onClick={onImageRemove}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
            aria-label="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {selectedImage.name} ({formatBytes(selectedImage.size)})
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-accent/30"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {isDragActive
            ? "Drop image here..."
            : "Drag & drop an image, or click to browse"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          JPEG, PNG, WebP • Max {formatBytes(maxSize)}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 mt-2 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
