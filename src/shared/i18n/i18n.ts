import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import { defaultLanguage, resources, type SupportedLanguage } from "./resources";

const legacyLanguageStorageKey = "projectflow.language";
const languageStorageKey = "flowdeck.language";

function isSupportedLanguage(language: string | null): language is SupportedLanguage {
  return language === "ru" || language === "en";
}

function getInitialLanguage(): SupportedLanguage {
  if (typeof window === "undefined") {
    return defaultLanguage;
  }

  const storedLanguage = window.localStorage.getItem(languageStorageKey) ?? window.localStorage.getItem(legacyLanguageStorageKey);

  return isSupportedLanguage(storedLanguage) ? storedLanguage : defaultLanguage;
}

void i18next.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: defaultLanguage,
  supportedLngs: ["ru", "en"],
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
  returnNull: false,
});

i18next.on("languageChanged", (language) => {
  if (!isSupportedLanguage(language) || typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(languageStorageKey, language);
  document.documentElement.lang = language;
});

if (typeof document !== "undefined") {
  document.documentElement.lang = i18next.language;
}

export { i18next };
