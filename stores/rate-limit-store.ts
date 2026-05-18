"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { RATE_LIMITS } from "@/lib/constants";
import { isNewDay } from "@/lib/utils";

interface RateLimitState {
  remaining: Record<string, number>;
  lastResetDate: string;
}

interface RateLimitStore extends RateLimitState {
  decrement: (category: string) => void;
  syncFromApi: (category: string, remaining: number) => void;
  resetIfNewDay: () => void;
  isExhausted: (category: string) => boolean;
  getRemaining: (category: string) => number;
  getMax: (category: string) => number;
}

function getInitialRemaining(): Record<string, number> {
  const remaining: Record<string, number> = {};
  for (const [key, config] of Object.entries(RATE_LIMITS)) {
    remaining[key] = config.max;
  }
  return remaining;
}

export const useRateLimitStore = create<RateLimitStore>()(
  persist(
    (set, get) => ({
      remaining: getInitialRemaining(),
      lastResetDate: new Date().toISOString(),

      decrement: (category: string) =>
        set((state) => {
          const current = state.remaining[category] ?? 0;
          return {
            remaining: {
              ...state.remaining,
              [category]: Math.max(0, current - 1),
            },
          };
        }),

      syncFromApi: (category: string, remaining: number) =>
        set((state) => ({
          remaining: {
            ...state.remaining,
            [category]: remaining,
          },
        })),

      resetIfNewDay: () => {
        const state = get();
        if (isNewDay(state.lastResetDate)) {
          set({
            remaining: getInitialRemaining(),
            lastResetDate: new Date().toISOString(),
          });
        }
      },

      isExhausted: (category: string) => {
        const state = get();
        return (state.remaining[category] ?? 0) <= 0;
      },

      getRemaining: (category: string) => {
        return get().remaining[category] ?? 0;
      },

      getMax: (category: string) => {
        return RATE_LIMITS[category]?.max ?? 0;
      },
    }),
    {
      name: "magnific-rate-limits",
    }
  )
);
