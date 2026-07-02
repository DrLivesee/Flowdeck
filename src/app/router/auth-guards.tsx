import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/entities/session";
import flowdeckLogo from "@/shared/assets/flowdeck-logo.png";

type RouteGuardProps = {
  children: ReactNode;
};

type LoginLocationState = {
  from?: { pathname: string; search: string };
};

export function ProtectedRoute({ children }: RouteGuardProps) {
  const location = useLocation();
  const { status } = useAuth();

  if (status === "loading") {
    return <AuthRouteLoading />;
  }

  if (status === "anonymous") {
    return (
      <Navigate
        to="/auth/login"
        replace
        state={{ from: { pathname: location.pathname, search: location.search } }}
      />
    );
  }

  return children;
}

export function PublicAuthRoute({ children }: RouteGuardProps) {
  const location = useLocation();
  const { status } = useAuth();
  const state = location.state as LoginLocationState | null;
  const from = state?.from ? `${state.from.pathname}${state.from.search}` : "/board";

  if (status === "loading") {
    return <AuthRouteLoading />;
  }

  if (status === "authenticated") {
    return <Navigate to={from} replace />;
  }

  return children;
}

function AuthRouteLoading() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-center shadow-2xl shadow-black/30">
        <img className="mx-auto mb-3 size-12 rounded-2xl object-cover" src={flowdeckLogo} alt="" aria-hidden="true" />
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200/70">
          Flowdeck
        </p>
        <p className="mt-3 text-sm text-slate-400">{t("auth.loading")}</p>
      </div>
    </div>
  );
}
