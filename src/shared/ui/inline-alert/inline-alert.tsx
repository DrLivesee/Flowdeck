import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/shared/lib";

type InlineAlertProps = ComponentPropsWithoutRef<"div">;

export function InlineAlert({ className, children, ...props }: InlineAlertProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm leading-6 text-rose-100",
        className,
      )}
      role="alert"
      aria-live="polite"
      {...props}
    >
      {children}
    </div>
  );
}
