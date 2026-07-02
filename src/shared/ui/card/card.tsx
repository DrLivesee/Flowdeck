import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/shared/lib/cn";

export function Card({ className, ...props }: ComponentPropsWithoutRef<"article">) {
  return (
    <article
      className={cn(
        "rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("space-y-2", className)} {...props} />;
}

export function CardTitle({ className, ...props }: ComponentPropsWithoutRef<"h3">) {
  return <h3 className={cn("font-bold text-white", className)} {...props} />;
}

export function CardDescription({
  className,
  ...props
}: ComponentPropsWithoutRef<"p">) {
  return <p className={cn("leading-7 text-slate-400", className)} {...props} />;
}

export function CardContent({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("p-5", className)} {...props} />;
}
