import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { cn } from "@/shared/lib/cn";

import type { NavigationItem } from "../model/navigation";

export function SidebarLink({ item }: { item: NavigationItem }) {
  const { t } = useTranslation();
  const location = useLocation();
  const Icon = item.icon;
  const isBoardActive = isBoardNavigationActive(item, location.pathname);

  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300",
          isActive || isBoardActive
            ? "bg-white text-slate-950 shadow-lg shadow-cyan-950/30"
            : "text-slate-400 hover:bg-white/10 hover:text-white",
        )
      }
    >
      <Icon className="size-5" />
      {t(item.labelKey)}
    </NavLink>
  );
}

export function MobileLink({ item }: { item: NavigationItem }) {
  const { t } = useTranslation();
  const location = useLocation();
  const Icon = item.icon;
  const isBoardActive = isBoardNavigationActive(item, location.pathname);

  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300",
          isActive || isBoardActive ? "bg-cyan-300 text-slate-950" : "border border-white/10 bg-white/5 text-slate-300",
        )
      }
    >
      <Icon className="size-4" />
      {t(item.labelKey)}
    </NavLink>
  );
}

function isBoardNavigationActive(item: NavigationItem, pathname: string) {
  return item.labelKey === "navigation.board" && (pathname === "/board" || pathname.startsWith("/projects/"));
}
