import { LogOut } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/entities/session";
import { LanguageSwitcher } from "@/features/change-language";
import { ThemeSwitcher } from "@/features/change-theme";
import flowdeckLogo from "@/shared/assets/flowdeck-logo.png";

import type { NavigationItem } from "../model/navigation";
import { MobileLink } from "./navigation-links";

type AppHeaderProps = {
  navigationItems: NavigationItem[];
  pageTitle: string;
};

export function AppHeader({
  navigationItems,
  pageTitle,
}: AppHeaderProps) {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    await signOut();
    setIsSigningOut(false);
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/80 px-4 py-4 backdrop-blur-xl md:px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center justify-between gap-4">
          <MobileBrand pageTitle={pageTitle} />

          <div className="hidden lg:block">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/70">Flowdeck</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-white">
              {pageTitle}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end">
          <ThemeSwitcher />
          <LanguageSwitcher />
          <button
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] p-1 text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:opacity-50"
            type="button"
            aria-label={t("auth.logout.action")}
            disabled={isSigningOut}
            onClick={handleSignOut}
          >
            <span className="inline-flex items-center gap-2 rounded-xl px-2.5 py-1.5 transition">
              <LogOut className="size-4" />
            </span>
            <span className="hidden rounded-xl px-2.5 py-1.5 transition hover:bg-white/10 hover:text-white sm:inline">
              {isSigningOut ? t("auth.logout.submitting") : t("auth.logout.action")}
            </span>
          </button>
        </div>
      </div>

      <nav
        className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden"
        aria-label={t("app.mobileNavigation")}
      >
        {navigationItems.map((item) => (
          <MobileLink key={item.to} item={item} />
        ))}
      </nav>
    </header>
  );
}

function MobileBrand({ pageTitle }: { pageTitle: string }) {
  return (
    <div className="flex items-center gap-3 lg:hidden">
      <div className="size-10 overflow-hidden rounded-2xl border border-cyan-300/30 bg-slate-950">
        <img className="size-full object-cover" src={flowdeckLogo} alt="" aria-hidden="true" />
      </div>
      <div>
        <p className="font-black text-white">Flowdeck</p>
        <p className="text-xs text-slate-500">{pageTitle}</p>
      </div>
    </div>
  );
}
