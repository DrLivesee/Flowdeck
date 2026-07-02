import { useEffect } from "react";

import { useSettingsStore } from "@/entities/settings";

export function ThemeEffect() {
  const theme = useSettingsStore((state) => state.theme);
  const boardDensity = useSettingsStore((state) => state.boardDensity);

  useEffect(() => {
    const root = document.documentElement;
    const resolvedTheme = theme === "light" ? "light" : "dark";

    root.dataset.theme = resolvedTheme;
    root.dataset.themePreference = resolvedTheme;
    root.dataset.boardDensity = boardDensity;
  }, [boardDensity, theme]);

  return null;
}
