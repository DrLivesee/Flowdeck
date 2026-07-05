import type { ReactNode } from "react";

import { cn } from "@/shared/lib";

type ActionRailProps = {
  children: ReactNode;
  className?: string;
  isVisible?: boolean;
  mode?: "controlled" | "project" | "task";
};

export function ActionRail({
  children,
  className,
  isVisible,
  mode = "task",
}: ActionRailProps) {
  return (
    <div
      className={cn(
        "absolute -right-2 -top-4 z-20 flex items-center gap-1 opacity-0 transition focus-within:opacity-100",
        mode === "task" && "group-hover/taskCard:opacity-100",
        mode === "project" && "group-hover/project:opacity-100",
        mode === "controlled" && isVisible && "opacity-100",
        className,
      )}
    >
      {children}
    </div>
  );
}
