import { Pencil, Trash2 } from "lucide-react";
import type { ReactNode, RefObject } from "react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { Board } from "@/entities/board";
import { CancelButton, Input, Popover } from "@/shared/ui";

type BoardTitleActionsProps = {
  activeBoard: Board;
  canDelete: boolean;
  onBoardDelete: () => void;
  onBoardRename: (name: string) => void;
};

export function BoardTitleActions({
  activeBoard,
  canDelete,
  onBoardDelete,
  onBoardRename,
}: BoardTitleActionsProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"edit" | "delete" | null>(null);
  const editButtonRef = useRef<HTMLButtonElement | null>(null);
  const deleteButtonRef = useRef<HTMLButtonElement | null>(null);

  return (
    <div className="relative flex items-center gap-2">
      <IconButton ref={editButtonRef} label={t("boardManager.edit")} onClick={() => setMode("edit")}>
        <Pencil className="size-4" />
      </IconButton>
      <IconButton ref={deleteButtonRef} label={t("boardManager.delete")} disabled={!canDelete} variant="danger" onClick={() => setMode("delete")}>
        <Trash2 className="size-4" />
      </IconButton>

      {mode === "edit" && (
        <BoardNamePopover
          initialValue={activeBoard.name}
          title={t("boardManager.rename")}
          submitLabel={t("common.save")}
          triggerRef={editButtonRef}
          onCancel={() => setMode(null)}
          onSubmit={(name) => {
            onBoardRename(name);
            setMode(null);
          }}
        />
      )}
      {mode === "delete" && (
        <ConfirmDeletePopover
          triggerRef={deleteButtonRef}
          onCancel={() => setMode(null)}
          onConfirm={() => {
            onBoardDelete();
            setMode(null);
          }}
        />
      )}
    </div>
  );
}

function BoardNamePopover({
  initialValue = "",
  placeholder,
  submitLabel,
  title,
  triggerRef,
  onCancel,
  onSubmit,
}: {
  initialValue?: string;
  placeholder?: string;
  submitLabel: string;
  title: string;
  triggerRef: RefObject<HTMLElement | null>;
  onCancel: () => void;
  onSubmit: (name: string) => void;
}) {
  const [name, setName] = useState(initialValue);

  return (
    <Popover
      triggerRef={triggerRef}
      title={title}
      width={288}
      onClose={onCancel}
      footer={
        <>
          <CancelButton size="sm" type="button" onClick={onCancel} />
          <PopoverButton label={submitLabel} variant="primary" disabled={!name.trim()} onClick={() => onSubmit(name)} />
        </>
      }
    >
      <Input className="mt-3" value={name} placeholder={placeholder} onChange={(event) => setName(event.currentTarget.value)} />
    </Popover>
  );
}

function ConfirmDeletePopover({ triggerRef, onCancel, onConfirm }: { triggerRef: RefObject<HTMLElement | null>; onCancel: () => void; onConfirm: () => void }) {
  const { t } = useTranslation();

  return (
    <Popover
      triggerRef={triggerRef}
      title={t("boardManager.deleteTitle")}
      tone="danger"
      width={288}
      onClose={onCancel}
      footer={
        <>
          <CancelButton size="sm" type="button" onClick={onCancel} />
          <PopoverButton label={t("common.delete")} variant="danger" onClick={onConfirm} />
        </>
      }
    >
      <p className="mt-1 text-xs leading-5 text-slate-400">{t("boardManager.deleteDescription")}</p>
    </Popover>
  );
}

function IconButton({ children, disabled, label, ref, variant = "default", onClick }: { children: ReactNode; disabled?: boolean; label: string; ref?: RefObject<HTMLButtonElement | null>; variant?: "default" | "danger"; onClick: () => void }) {
  const variantClass = variant === "danger" ? "hover:border-rose-300/40 hover:text-rose-200 focus-visible:outline-rose-300" : "hover:border-cyan-300/40 hover:text-cyan-200 focus-visible:outline-cyan-300";

  return (
    <button ref={ref} className={`inline-flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-400 transition focus-visible:outline focus-visible:outline-2 disabled:opacity-40 ${variantClass}`} type="button" aria-label={label} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

function PopoverButton({ disabled, label, variant = "secondary", onClick }: { disabled?: boolean; label: string; variant?: "secondary" | "primary" | "danger"; onClick: () => void }) {
  const className = variant === "primary" ? "bg-cyan-300 text-slate-950" : variant === "danger" ? "bg-rose-300 text-rose-950" : "text-slate-300 hover:bg-white/10";

  return <button className={`rounded-full px-3 py-1.5 text-xs font-bold transition disabled:opacity-40 ${className}`} type="button" disabled={disabled} onClick={onClick}>{label}</button>;
}
