import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

import { Spinner } from "../spinner";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-cyan-300 text-slate-950 hover:bg-cyan-200 focus-visible:outline-cyan-300",
        secondary:
          "border border-white/10 bg-white/10 text-slate-100 hover:bg-white/15 focus-visible:outline-slate-400",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-5 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    isLoading?: boolean;
    loadingLabel?: string;
  };

export function Button({ children, className, disabled, isLoading = false, loadingLabel, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading && <Spinner />}
      {isLoading && loadingLabel ? loadingLabel : children}
    </button>
  );
}
