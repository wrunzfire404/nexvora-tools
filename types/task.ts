export type TaskStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export type TaskType =
  | "image-generation"
  | "image-upscale"
  | "image-expand"
  | "image-relight"
  | "change-camera"
  | "video-generation"
  | "motion-control"
  | "image-to-prompt"
  | "improve-prompt"
  | "icon-generation";

export interface Task {
  id: string;
  taskId: string; // Magnific task_id
  type: TaskType;
  status: TaskStatus;
  endpoint: string;
  params: Record<string, unknown>;
  resultUrl?: string;
  resultUrls?: string[];
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface HistoryItem {
  id: string;
  taskType: TaskType;
  resultUrl: string;
  resultType: "image" | "video";
  params: Record<string, unknown>;
  createdAt: string;
  thumbnail?: string;
}
