"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { HistoryItem } from "@/types/task";

interface HistoryStore {
  items: HistoryItem[];
  addItem: (item: HistoryItem) => void;
  removeItem: (id: string) => void;
  clearHistory: () => void;
}

const MAX_HISTORY = 50;

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item: HistoryItem) =>
        set((state) => {
          const items = [item, ...state.items].slice(0, MAX_HISTORY);
          return { items };
        }),

      removeItem: (id: string) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      clearHistory: () => set({ items: [] }),
    }),
    {
      name: "magnific-history",
    }
  )
);
