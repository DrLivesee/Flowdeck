import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

type OverflowTooltipProps = {
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  text: string;
};

export function OverflowTooltip({
  children,
  className,
  contentClassName,
  text,
}: OverflowTooltipProps) {
  return (
    <span className={cn("block min-w-0 max-w-full", className)}>
      <span className={cn("block max-w-full truncate", contentClassName)}>
        {children ?? text}
      </span>
    </span>
  );
}
