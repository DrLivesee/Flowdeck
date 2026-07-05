import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import type { RefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import type { BoardId } from "@/entities/board";
import type { Column } from "@/entities/column";
import { cn } from "@/shared/lib";
import { CancelButton, CreateButton, InlineAlert, Input, Spinner } from "@/shared/ui";

const columnAccents = ["slate", "cyan", "blue", "violet", "fuchsia", "emerald", "amber", "rose"] as const satisfies readonly Column["accent"][];

const accentClass: Record<Column["accent"], string> = {
  amber: "border-amber-300/30 bg-amber-300/[0.12]",
  blue: "border-blue-300/30 bg-blue-300/[0.12]",
  cyan: "border-cyan-300/30 bg-cyan-300/[0.12]",
  emerald: "border-emerald-300/30 bg-emerald-300/[0.12]",
  fuchsia: "border-fuchsia-300/30 bg-fuchsia-300/[0.12]",
  rose: "border-rose-300/30 bg-rose-300/[0.12]",
  slate: "border-white/15 bg-white/[0.06]",
  violet: "border-violet-300/30 bg-violet-300/[0.12]",
};

type CreateColumnFormProps = {
  boardId: BoardId;
  isPending?: boolean;
  onCreateColumn: (input: { accent: Column["accent"]; boardId: BoardId; name: string }) => Promise<void> | void;
};

export function CreateColumnForm({ boardId, isPending = false, onCreateColumn }: CreateColumnFormProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLFormElement | null>(null);
  useDismissiblePopover({ isOpen, popoverRef, triggerRef: buttonRef, onClose: () => setIsOpen(false) });
  const schema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .trim()
          .min(1, t("createColumn.validation.nameRequired"))
          .max(40, t("createColumn.validation.nameMax")),
        accent: z.enum(columnAccents),
      }),
    [t],
  );
  type CreateColumnFormValues = z.infer<typeof schema>;
  const {
    formState: { errors, isSubmitting },
    control,
    handleSubmit,
    register,
    reset,
  } = useForm<CreateColumnFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      accent: "slate",
    },
  });
  const name = useWatch({ control, name: "name" });

  async function onSubmit(values: CreateColumnFormValues) {
    setSubmitError(null);

    try {
      await onCreateColumn({
        boardId,
        name: values.name,
        accent: values.accent,
      });
    } catch {
      setSubmitError(t("common.mutationError"));
      return;
    }

    reset();
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-300 shadow-lg shadow-black/20 transition hover:border-cyan-300/40 hover:bg-cyan-300/10 hover:text-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
        type="button"
        aria-label={t("createColumn.open")}
        disabled={isPending}
        onClick={() => setIsOpen((value) => !value)}
      >
        {isPending ? <Spinner /> : <Plus className="size-4" />}
        {t("createColumn.open")}
      </button>

      {isOpen && (
        <form
          ref={popoverRef}
          className="absolute right-0 top-12 z-30 w-80 rounded-3xl border border-white/10 bg-[#020617] p-4 shadow-2xl shadow-black/50"
          onSubmit={handleSubmit(onSubmit)}
        >
          <p className="text-sm font-bold text-white">{t("createColumn.open")}</p>
          {submitError && <InlineAlert className="mt-3">{submitError}</InlineAlert>}
        <div className="mt-4 min-w-0 flex-1">
          <label className="sr-only" htmlFor="create-column-name">
            {t("createColumn.fields.name")}
          </label>
          <Input
            id="create-column-name"
            placeholder={t("createColumn.placeholder")}
            {...register("name")}
          />
          {errors.name?.message && (
            <p className="mt-2 text-sm text-rose-300">{errors.name.message}</p>
          )}
        </div>

        <fieldset className="mt-3 grid shrink-0 grid-cols-4 gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <legend className="sr-only">{t("createColumn.fields.accent")}</legend>
          {columnAccents.map((accent) => (
            <label key={accent} className="cursor-pointer">
              <input className="peer sr-only" type="radio" value={accent} {...register("accent")} />
              <span
                className={cn(
                  "block h-9 rounded-2xl border-2 transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-cyan-300 peer-checked:border-4 peer-checked:border-white peer-checked:shadow-[0_0_0_2px_rgba(103,232,249,0.35)]",
                  accentClass[accent],
                )}
                title={t(`createColumn.colors.${accent}`)}
              />
              <span className="sr-only">{t(`createColumn.colors.${accent}`)}</span>
            </label>
          ))}
        </fieldset>

          <div className="mt-4 flex justify-end gap-2">
            <CancelButton type="button" onClick={() => setIsOpen(false)} />
            <CreateButton disabled={!name.trim() || isPending} isLoading={isSubmitting || isPending} type="submit" />
          </div>
        </form>
      )}
    </div>
  );
}

function useDismissiblePopover({
  isOpen,
  popoverRef,
  triggerRef,
  onClose,
}: {
  isOpen: boolean;
  popoverRef: RefObject<HTMLElement | null>;
  triggerRef: RefObject<HTMLElement | null>;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

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
  }, [isOpen, onClose, popoverRef, triggerRef]);
}
