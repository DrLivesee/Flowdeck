import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/shared/lib/cn";

const badgeVariants = cva(
  "inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold leading-none",
  {
    variants: {
      variant: {
        cyan: "border-cyan-300/20 bg-cyan-300/10 text-cyan-200",
        emerald: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
        violet: "border-violet-300/20 bg-violet-300/10 text-violet-200",
        amber: "border-amber-300/20 bg-amber-300/10 text-amber-200",
        rose: "border-rose-300/20 bg-rose-300/10 text-rose-200",
        slate: "border-white/10 bg-white/10 text-slate-300",
        outline: "border-white/10 bg-transparent text-slate-400",
      },
    },
    defaultVariants: {
      variant: "slate",
    },
  },
);

type BadgeProps = ComponentPropsWithoutRef<"span"> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
