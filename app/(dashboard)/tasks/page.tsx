"use client";

import { useEffect, useState } from "react";
import { ListTodo, Trash2 } from "lucide-react";
import { useTaskStore } from "@/stores/task-store";
import { TaskStatusBadge } from "@/components/shared/task-status";

export default function TasksPage() {
  const { tasks, removeTask } = useTaskStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  const activeTasks = tasks.filter((t) => t.status === "PENDING" || t.status === "PROCESSING");
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED" || t.status === "FAILED");

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <ListTodo className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Task Queue</h1>
          <p className="text-sm text-muted-foreground">{activeTasks.length} active, {completedTasks.length} completed</p>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-lg border border-dashed border-border text-muted-foreground">
          <ListTodo className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">No tasks yet. Generate something to see tasks here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-4">
                <TaskStatusBadge status={task.status} />
                <div>
                  <p className="text-sm font-medium capitalize">{task.type.replace(/-/g, " ")}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(task.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {task.resultUrl && (
                  <a href={task.resultUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                    View Result
                  </a>
                )}
                {task.error && <span className="text-xs text-destructive max-w-[200px] truncate">{task.error}</span>}
                <button onClick={() => removeTask(task.taskId)} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
