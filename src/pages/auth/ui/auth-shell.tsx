import type { ReactNode } from "react";

import flowdeckLogo from "@/shared/assets/flowdeck-logo.png";

type AuthShellProps = {
  children: ReactNode;
  description: string;
  title: string;
};

export function AuthShell({ children, description, title }: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-100">
      <div className="flowdeck-app-bg fixed inset-0 -z-10" />
      <section className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="size-11 overflow-hidden rounded-2xl border border-cyan-300/30 bg-slate-950 shadow-lg shadow-cyan-950/40">
            <img className="size-full object-cover" src={flowdeckLogo} alt="" aria-hidden="true" />
          </div>
          <div>
            <p className="text-lg font-black tracking-tight text-white">Flowdeck</p>
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-cyan-200/70">
              Kanban OS
            </p>
          </div>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
        <div className="mt-6">{children}</div>
      </section>
    </main>
  );
}
