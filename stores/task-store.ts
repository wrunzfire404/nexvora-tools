"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Task } from "@/types/task";

interface TaskStore {
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (taskId: string, update: Partial<Task>) => void;
  removeTask: (taskId: string) => void;
  getActiveTasks: () => Task[];
  getCompletedTasks: () => Task[];
  getFailedTasks: () => Task[];
}

const MAX_TASKS = 100;

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],

      addTask: (task: Task) =>
        set((state) => {
          // Don't store large data (base64 images) in params
          const cleanTask = {
            ...task,
            params: Object.fromEntries(
              Object.entries(task.params).filter(
                ([, v]) => typeof v !== "string" || (v as string).length < 1000
              )
            ),
          };

          const tasks = [cleanTask, ...state.tasks];
          // Evict oldest completed/failed tasks if over limit
          if (tasks.length > MAX_TASKS) {
            const active = tasks.filter(
              (t) => t.status === "PENDING" || t.status === "PROCESSING"
            );
            const inactive = tasks
              .filter(
                (t) => t.status === "COMPLETED" || t.status === "FAILED"
              )
              .slice(0, MAX_TASKS - active.length);
            return { tasks: [...active, ...inactive] };
          }
          return { tasks };
        }),

      updateTask: (taskId: string, update: Partial<Task>) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.taskId === taskId ? { ...t, ...update } : t
          ),
        })),

      removeTask: (taskId: string) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.taskId !== taskId),
        })),

      getActiveTasks: () =>
        get().tasks.filter(
          (t) => t.status === "PENDING" || t.status === "PROCESSING"
        ),

      getCompletedTasks: () =>
        get().tasks.filter((t) => t.status === "COMPLETED"),

      getFailedTasks: () =>
        get().tasks.filter((t) => t.status === "FAILED"),
    }),
    {
      name: "magnific-tasks",
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch {
            // Quota exceeded — clear old tasks and retry
            try {
              const parsed = JSON.parse(JSON.stringify(value));
              if (parsed?.state?.tasks) {
                parsed.state.tasks = parsed.state.tasks.slice(0, 20);
              }
              localStorage.setItem(name, JSON.stringify(parsed));
            } catch {
              // Last resort: clear the store
              localStorage.removeItem(name);
            }
          }
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
