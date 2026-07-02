import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

import { supportedLanguages, type SupportedLanguage } from "@/shared/i18n";
import { cn } from "@/shared/lib/cn";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const currentLanguage = i18n.language as SupportedLanguage;

  function changeLanguage(language: SupportedLanguage) {
    void i18n.changeLanguage(language);
  }

  return (
    <div
      className="inline-flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.06] p-1"
      aria-label={t("language.switcherLabel")}
    >
      <Languages className="ml-2 size-4 text-slate-400" />
      {supportedLanguages.map((language) => {
        const isActive = currentLanguage === language.code;

        return (
          <button
            key={language.code}
            className={cn(
              "rounded-xl px-2.5 py-1.5 text-xs font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300",
              isActive
                ? "bg-cyan-300 text-slate-950"
                : "text-slate-400 hover:bg-white/10 hover:text-white",
            )}
            type="button"
            aria-pressed={isActive}
            aria-label={t("language.switchTo", { language: language.label })}
            onClick={() => changeLanguage(language.code)}
          >
            {language.shortLabel}
          </button>
        );
      })}
    </div>
  );
}
