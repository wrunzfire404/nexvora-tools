"use client";

import { cn } from "@/lib/utils";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  label?: string;
  className?: string;
  rows?: number;
}

export function PromptInput({
  value,
  onChange,
  placeholder = "Describe what you want to generate...",
  maxLength = 2000,
  label = "Prompt",
  className,
  rows = 4,
}: PromptInputProps) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium">{label}</label>
        <span
          className={cn(
            "text-xs",
            value.length > maxLength * 0.9
              ? "text-destructive"
              : "text-muted-foreground"
          )}
        >
          {value.length}/{maxLength}
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent placeholder:text-muted-foreground"
      />
    </div>
  );
}
