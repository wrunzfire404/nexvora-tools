"use client";

import { useEffect, useState } from "react";
import { History, Trash2, ExternalLink } from "lucide-react";
import { useHistoryStore } from "@/stores/history-store";

export default function HistoryPage() {
  const { items, removeItem, clearHistory } = useHistoryStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <History className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">History</h1>
            <p className="text-sm text-muted-foreground">{items.length} results saved</p>
          </div>
        </div>
        {items.length > 0 && (
          <button onClick={clearHistory} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
            Clear All
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-lg border border-dashed border-border text-muted-foreground">
          <History className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">No history yet. Generated results will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border border-border bg-card overflow-hidden group">
              <div className="aspect-video relative bg-muted">
                {item.resultType === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.resultUrl} alt={item.taskType} className="w-full h-full object-cover" />
                ) : (
                  <video src={item.resultUrl} className="w-full h-full object-cover" muted />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <a href={item.resultUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
                    <ExternalLink className="w-4 h-4 text-white" />
                  </a>
                </div>
              </div>
              <div className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium capitalize">{item.taskType.replace(/-/g, " ")}</p>
                  <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</p>
                </div>
                <button onClick={() => removeItem(item.id)} className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-destructive transition-colors">
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
