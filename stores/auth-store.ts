"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthStore {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      apiKey: null,
      setApiKey: (key: string) => set({ apiKey: key }),
      clearApiKey: () => set({ apiKey: null }),
      isAuthenticated: () => !!get().apiKey,
    }),
    {
      name: "magnific-auth",
    }
  )
);
