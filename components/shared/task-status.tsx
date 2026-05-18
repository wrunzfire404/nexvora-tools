"use client";

import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskStatusProps {
  status: string;
  className?: string;
}

const statusConfig: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; label: string; color: string }
> = {
  PENDING: { icon: Clock, label: "Pending", color: "text-muted-foreground" },
  CREATED: { icon: Clock, label: "Created", color: "text-muted-foreground" },
  PROCESSING: { icon: Loader2, label: "Processing", color: "text-warning" },
  IN_PROGRESS: { icon: Loader2, label: "Processing", color: "text-warning" },
  COMPLETED: { icon: CheckCircle2, label: "Completed", color: "text-success" },
  FAILED: { icon: XCircle, label: "Failed", color: "text-destructive" },
};

const defaultConfig = { icon: Loader2, label: "Working...", color: "text-muted-foreground" };

export function TaskStatusBadge({ status, className }: TaskStatusProps) {
  const config = statusConfig[status] || defaultConfig;
  const Icon = config.icon;
  const isSpinning = status === "PROCESSING" || status === "IN_PROGRESS" || !statusConfig[status];

  return (
    <div className={cn("flex items-center gap-1.5", config.color, className)}>
      <Icon
        className={cn("w-4 h-4", isSpinning && "animate-spin")}
      />
      <span className="text-sm font-medium">{config.label}</span>
    </div>
  );
}
