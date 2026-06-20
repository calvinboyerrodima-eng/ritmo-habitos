import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppSettings } from "./types";
import { DEFAULT_CALENDAR_NAME, DEFAULT_GOOGLE_CLIENT_ID, DEFAULT_SYNC_WINDOW_DAYS } from "./google-config";

interface AppState {
  settings: AppSettings;
  setSettings: (patch: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

const initial: AppSettings = {
  googleClientId: DEFAULT_GOOGLE_CLIENT_ID,
  calendarId: null,
  calendarName: DEFAULT_CALENDAR_NAME,
  themeMode: "system",
  lastSyncAt: null,
  onboardingCompleted: false,
  syncWindowDays: DEFAULT_SYNC_WINDOW_DAYS,
};

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      settings: initial,
      setSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
      resetSettings: () => set({ settings: initial }),
    }),
    {
      name: "ritmo-settings",
      version: 1,
    },
  ),
);
