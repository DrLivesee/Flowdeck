import { MonitorCog, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useSettingsStore, type ThemePreference } from "@/entities/settings";
import { cn } from "@/shared/lib/cn";

const themeOptions: Array<{ icon: typeof Moon; value: ThemePreference }> = [
  { icon: Moon, value: "dark" },
  { icon: Sun, value: "light" },
];

export function ThemeSwitcher() {
  const { t } = useTranslation();
  const theme = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);

  return (
    <div
      className="inline-flex h-[45.6px] items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.06] p-1"
      aria-label={t("theme.switcherLabel")}
    >
      <MonitorCog className="ml-2 size-4 text-slate-400" />
      {themeOptions.map((option) => {
        const Icon = option.icon;
        const isActive = theme === option.value;

        return (
          <button
            key={option.value}
            className={cn(
              "inline-flex h-[37.6px] min-w-[37.6px] items-center justify-center rounded-xl px-2.5 py-1.5 text-xs font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300",
              isActive
                ? "bg-cyan-300 text-slate-950"
                : "text-slate-400 hover:bg-white/10 hover:text-white",
            )}
            type="button"
            aria-pressed={isActive}
            aria-label={t("theme.switchTo", { theme: t(`settings.theme.${option.value}`) })}
            onClick={() => setTheme(option.value)}
          >
            <Icon className="size-4" />
          </button>
        );
      })}
    </div>
  );
}
