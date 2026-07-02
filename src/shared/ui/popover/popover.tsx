import type { ReactNode, RefObject } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/shared/lib/cn";

type PopoverAlign = "end" | "start";
type PopoverTone = "default" | "danger";

type PopoverProps = {
  align?: PopoverAlign;
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
  offset?: number;
  title?: ReactNode;
  tone?: PopoverTone;
  triggerRef: RefObject<HTMLElement | null>;
  width?: number;
  onClose: () => void;
};

type PopoverPosition = {
  left: number;
  top: number;
};

export function Popover({
  align = "end",
  children,
  className,
  footer,
  offset = 8,
  title,
  tone = "default",
  triggerRef,
  width = 288,
  onClose,
}: PopoverProps) {
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<PopoverPosition | null>(null);

  useLayoutEffect(() => {
    setPosition(getPopoverPosition({ align, offset, trigger: triggerRef.current, width }));
  }, [align, offset, triggerRef, width]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (popoverRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }

      onClose();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, triggerRef]);

  return (
    <div
      ref={popoverRef}
      className={cn(
        "fixed z-50 rounded-2xl border bg-[#020617] p-3 shadow-2xl shadow-black/50",
        tone === "danger" ? "border-rose-300/20" : "border-white/10",
        !position && "invisible",
        className,
      )}
      style={{ left: position?.left ?? 0, top: position?.top ?? 0, width }}
    >
      {title && <p className="text-sm font-bold text-white">{title}</p>}
      {children}
      {footer && <div className="mt-3 flex justify-end gap-2">{footer}</div>}
    </div>
  );
}

function getPopoverPosition({
  align,
  offset,
  trigger,
  width,
}: {
  align: PopoverAlign;
  offset: number;
  trigger: HTMLElement | null;
  width: number;
}) {
  const margin = 16;

  if (!trigger) {
    return { left: margin, top: margin };
  }

  const rect = trigger.getBoundingClientRect();
  const preferredLeft = align === "end" ? rect.right - width : rect.left;
  const left = Math.min(Math.max(preferredLeft, margin), window.innerWidth - width - margin);
  const top = Math.min(rect.bottom + offset, window.innerHeight - margin);

  return { left, top };
}
