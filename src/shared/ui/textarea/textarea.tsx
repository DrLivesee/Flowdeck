import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/shared/lib/cn";

type TextareaProps = ComponentPropsWithoutRef<"textarea">;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full resize-y rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-slate-100 shadow-inner shadow-black/10 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
