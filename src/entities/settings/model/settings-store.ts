import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemePreference = "dark" | "light";
export type BoardDensity = "comfortable" | "compact" | "spacious";

type SettingsState = {
  boardDensity: BoardDensity;
  theme: ThemePreference;
};

type SettingsActions = {
  setBoardDensity: (density: BoardDensity) => void;
  setTheme: (theme: ThemePreference) => void;
};

export type SettingsStore = SettingsState & SettingsActions;

const legacySettingsStorageKey = "projectflow.preferences";

export const settingsStorageKey = "flowdeck.preferences";

function migrateLegacySettingsStorage() {
  if (typeof window === "undefined") {
    return;
  }

  const currentSettings = window.localStorage.getItem(settingsStorageKey);
  const legacySettings = window.localStorage.getItem(legacySettingsStorageKey);

  if (!currentSettings && legacySettings) {
    window.localStorage.setItem(settingsStorageKey, legacySettings);
  }
}

migrateLegacySettingsStorage();

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      boardDensity: "comfortable",
      theme: "dark",
      setBoardDensity: (boardDensity) => set({ boardDensity }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: settingsStorageKey,
      partialize: (state) => ({ boardDensity: state.boardDensity, theme: state.theme }),
    },
  ),
);
