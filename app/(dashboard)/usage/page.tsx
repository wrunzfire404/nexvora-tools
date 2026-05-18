"use client";

import { useEffect, useState } from "react";
import { BarChart3, RefreshCw } from "lucide-react";
import { useRateLimitStore } from "@/stores/rate-limit-store";
import { RATE_LIMITS } from "@/lib/constants";

interface UsageCategory {
  key: string;
  label: string;
  max: number;
  remaining: number;
  used: number;
  percentage: number;
}

export default function UsagePage() {
  const { remaining, resetIfNewDay, lastResetDate } = useRateLimitStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    resetIfNewDay();
  }, [resetIfNewDay]);

  if (!mounted) return null;

  // Build usage data
  const categories: UsageCategory[] = Object.entries(RATE_LIMITS).map(([key, config]) => {
    const rem = remaining[key] ?? config.max;
    const used = config.max - rem;
    const percentage = (used / config.max) * 100;
    return { key, label: config.label, max: config.max, remaining: rem, used, percentage };
  });

  // Group by type
  const imageGen = categories.filter((c) => c.key.startsWith("image-generation"));
  const imageEdit = categories.filter((c) =>
    ["image-expand", "image-relight", "image-upscaler", "image-upscaler-precision", "change-camera"].includes(c.key)
  );
  const videoGen = categories.filter((c) => c.key.startsWith("video-"));
  const tools = categories.filter((c) =>
    ["icon-generation", "image-to-prompt", "improve-prompt"].includes(c.key)
  );

  const totalUsed = categories.reduce((sum, c) => sum + c.used, 0);
  const totalMax = categories.reduce((sum, c) => sum + c.max, 0);

  const resetTime = new Date(lastResetDate);
  const nextReset = new Date(resetTime);
  nextReset.setUTCDate(nextReset.getUTCDate() + 1);
  nextReset.setUTCHours(0, 0, 0, 0);

  const now = new Date();
  const hoursUntilReset = Math.max(0, Math.ceil((nextReset.getTime() - now.getTime()) / (1000 * 60 * 60)));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Usage & Quota</h1>
            <p className="text-sm text-muted-foreground">
              Free tier daily limits — resets in ~{hoursUntilReset}h (UTC midnight)
            </p>
          </div>
        </div>
        <button
          onClick={() => resetIfNewDay()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Summary Card */}
      <div className="p-4 rounded-xl border border-border bg-card mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Usage Today</p>
            <p className="text-2xl font-bold">{totalUsed} <span className="text-sm font-normal text-muted-foreground">/ {totalMax} requests</span></p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Next Reset</p>
            <p className="text-sm font-medium">~{hoursUntilReset} hours</p>
          </div>
        </div>
        <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.min(100, (totalUsed / totalMax) * 100)}%` }}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-6">
        <UsageSection title="Image Generation" items={imageGen} />
        <UsageSection title="Image Editing" items={imageEdit} />
        <UsageSection title="Video Generation" items={videoGen} />
        <UsageSection title="AI Tools" items={tools} />
      </div>

      {/* Info */}
      <div className="mt-6 p-4 rounded-lg bg-accent/30 border border-border">
        <p className="text-xs text-muted-foreground">
          💡 Usage syncs with Magnific API response headers when available. Counters also track locally 
          as a fallback. If you use your API key elsewhere, numbers may differ slightly. 
          Resets automatically at UTC midnight.
        </p>
      </div>
    </div>
  );
}

function UsageSection({ title, items }: { title: string; items: UsageCategory[] }) {
  if (items.length === 0) return null;

  return (
    <div>
      <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">{title}</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.key} className="flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium truncate">{item.label}</p>
                <p className="text-xs text-muted-foreground shrink-0 ml-2">
                  {item.remaining}/{item.max}
                </p>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    item.percentage > 90
                      ? "bg-destructive"
                      : item.percentage > 60
                      ? "bg-warning"
                      : "bg-primary"
                  }`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
