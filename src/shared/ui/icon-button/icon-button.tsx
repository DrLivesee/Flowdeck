import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/lib";

type IconButtonProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  label: string;
  ref?: (element: HTMLButtonElement | null) => void;
  variant?: "default" | "danger" | "drag";
  onClick?: () => void;
};

export function IconButton({
  children,
  className,
  disabled,
  label,
  ref,
  variant = "default",
  onClick,
  ...props
}: IconButtonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      ref={ref}
      className={cn(
        "rounded-full border border-white/10 bg-slate-900/95 p-2 text-slate-500 shadow-lg shadow-black/30 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:pointer-events-none disabled:opacity-30",
        variant === "default" && "hover:border-cyan-300/40 hover:text-cyan-200",
        variant === "drag" && "hover:border-white/20 hover:text-slate-100",
        variant === "danger" && "hover:border-rose-300/40 hover:text-rose-200 focus-visible:outline-rose-300",
        className,
      )}
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
