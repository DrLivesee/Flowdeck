import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/shared/lib";

export type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = {
  value: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
  disabled?: boolean;
  ariaLabel?: string;
};

export function Select({
  value,
  options,
  onValueChange,
  disabled,
  ariaLabel,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        event.stopImmediatePropagation();
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className="relative">
      <button
        className={cn(
          "flex h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-left text-sm text-slate-100 shadow-inner shadow-black/10 outline-none transition hover:bg-white/[0.09] focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-50",
          isOpen && "border-cyan-300/60 ring-2 ring-cyan-300/20",
        )}
        type="button"
        aria-label={ariaLabel}
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        disabled={disabled}
        onKeyDown={(event) => {
          if (event.key === "Escape" && isOpen) {
            event.stopPropagation();
            setIsOpen(false);
          }
        }}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="truncate">{selectedOption?.label}</span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-slate-400 transition", isOpen && "rotate-180")}
        />
      </button>

      {isOpen && (
        <div
          id={listboxId}
          className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-1 shadow-2xl shadow-black/40 ring-1 ring-cyan-300/10"
          role="listbox"
        >
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                className={cn(
                  "flex w-full cursor-pointer items-center rounded-xl px-3 py-2.5 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300",
                  isSelected
                    ? "bg-cyan-300 text-slate-950"
                    : "text-slate-300 hover:bg-white/10 hover:text-white",
                )}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onValueChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
