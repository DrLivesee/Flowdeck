import { lazy, Suspense, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import flowdeckLogo from "@/shared/assets/flowdeck-logo.png";

const AnalyticsPage = lazy(() => import("@/pages/analytics").then((module) => ({ default: module.AnalyticsPage })));
const BoardPage = lazy(() => import("@/pages/board").then((module) => ({ default: module.BoardPage })));
const LoginPage = lazy(() => import("@/pages/auth").then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import("@/pages/auth").then((module) => ({ default: module.RegisterPage })));
const SettingsPage = lazy(() => import("@/pages/settings").then((module) => ({ default: module.SettingsPage })));
const TaskListPage = lazy(() => import("@/pages/task-list").then((module) => ({ default: module.TaskListPage })));

export function AnalyticsRoutePage() {
  return <RoutePage element={<AnalyticsPage />} />;
}

export function BoardRoutePage() {
  return <RoutePage element={<BoardPage />} />;
}

export function LoginRoutePage() {
  return <RoutePage element={<LoginPage />} fullScreen />;
}

export function RegisterRoutePage() {
  return <RoutePage element={<RegisterPage />} fullScreen />;
}

export function SettingsRoutePage() {
  return <RoutePage element={<SettingsPage />} />;
}

export function TaskListRoutePage() {
  return <RoutePage element={<TaskListPage />} />;
}

function RoutePage({ element, fullScreen = false }: { element: ReactNode; fullScreen?: boolean }) {
  return <Suspense fallback={<RoutePageFallback fullScreen={fullScreen} />}>{element}</Suspense>;
}

function RoutePageFallback({ fullScreen = false }: { fullScreen?: boolean }) {
  const { t } = useTranslation();

  return (
    <section className={fullScreen ? "flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100" : "flex min-h-[40vh] items-center justify-center"}>
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-center shadow-2xl shadow-black/30">
        <img className="mx-auto mb-3 size-12 rounded-2xl object-cover" src={flowdeckLogo} alt="" aria-hidden="true" />
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200/70">Flowdeck</p>
        <p className="mt-3 text-sm text-slate-400">{t("common.loading")}</p>
      </div>
    </section>
  );
}
