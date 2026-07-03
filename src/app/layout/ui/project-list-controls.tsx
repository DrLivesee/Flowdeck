import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import type { RefObject, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { ProfileMultiSelect, useProjectMembersQuery, type Profile } from "@/entities/profile";
import { ActionRail, IconButton, Spinner } from "@/shared/ui";

import type { ProjectSummary } from "../model/layout-view";

type ProjectCreateButtonProps = {
  isPending?: boolean;
  memberProfiles: Profile[];
  onCreate: (input: { memberIds: string[]; name: string }) => Promise<unknown>;
};

export function ProjectCreateButton({ isPending = false, memberProfiles, onCreate }: ProjectCreateButtonProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const canSubmit = Boolean(name.trim() && memberIds.length > 0 && !isPending);
  useDismissiblePopover({ isOpen, popoverRef, triggerRef: buttonRef, onClose: () => setIsOpen(false) });

  async function createProject() {
    if (!canSubmit) {
      return;
    }

    setSubmitError(null);

    try {
      await onCreate({ memberIds, name });
    } catch {
      setSubmitError(t("common.mutationError"));
      return;
    }

    setName("");
    setMemberIds([]);
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        className="rounded-full p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
        type="button"
        disabled={isPending}
        aria-label={t("projectActions.create")}
        onClick={() => setIsOpen((value) => !value)}
      >
        {isPending ? <Spinner /> : <Plus className="size-4" />}
      </button>

      {isOpen && (
        <div ref={popoverRef} className="absolute left-0 top-8 z-[100] w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-white/10 bg-[#020617] p-3 opacity-100 shadow-2xl shadow-black/50">
          <p className="text-sm font-bold text-white">{t("projectActions.create")}</p>
          <input
            className="mt-3 h-10 w-full rounded-xl border border-white/10 bg-slate-900 px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/50"
            aria-label={t("projectActions.createPlaceholder")}
            value={name}
            placeholder={t("projectActions.createPlaceholder")}
            onChange={(event) => setName(event.currentTarget.value)}
          />
          <div className="mt-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("projectActions.members")}</p>
            <ProfileMultiSelect
              disabled={isPending}
              emptyText={t("projectActions.membersEmpty")}
              profiles={memberProfiles}
              value={memberIds}
              onChange={setMemberIds}
            />
          </div>
          {submitError && <p className="mt-3 text-xs leading-5 text-rose-200">{submitError}</p>}
          <div className="mt-3 flex justify-end gap-2">
            <PopoverButton label={t("common.cancel")} onClick={() => setIsOpen(false)} />
            <PopoverButton
              label={t("projectActions.create")}
              variant="primary"
              disabled={!canSubmit}
              isLoading={isPending}
              onClick={() => void createProject()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

type ProjectInlineActionsProps = {
  canDelete: boolean;
  dragHandle?: ReactNode;
  isPending?: boolean;
  memberProfiles: Profile[];
  project: ProjectSummary;
  onDelete: (projectId: string) => void;
  onRename: (projectId: string, input: { memberIds: string[]; name: string }) => Promise<unknown>;
};

export function ProjectInlineActions({
  canDelete,
  dragHandle,
  isPending = false,
  memberProfiles,
  project,
  onDelete,
  onRename,
}: ProjectInlineActionsProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"edit" | "delete" | null>(null);

  return (
    <>
      <ActionRail mode="project">
        {dragHandle ?? null}
        <IconButton label={t("projectActions.rename", { project: project.name })} onClick={() => setMode("edit")}>
          <Pencil className="size-4" />
        </IconButton>
        <IconButton
          label={t("projectActions.delete", { project: project.name })}
          disabled={!canDelete}
          variant="danger"
          onClick={() => setMode("delete")}
        >
          <Trash2 className="size-4" />
        </IconButton>
      </ActionRail>

      {mode === "edit" && (
        <ProjectEditPopover
          project={project}
          isPending={isPending}
          memberProfiles={memberProfiles}
          onCancel={() => setMode(null)}
          onRename={async (input) => {
            await onRename(project.id, input);
            setMode(null);
          }}
        />
      )}
      {mode === "delete" && (
        <ProjectDeletePopover
          onCancel={() => setMode(null)}
          onConfirm={() => {
            onDelete(project.id);
            setMode(null);
          }}
        />
      )}
    </>
  );
}

export function ProjectReorderActions({ dragHandle }: { dragHandle: ReactNode }) {
  return <ActionRail mode="project">{dragHandle}</ActionRail>;
}

function ProjectEditPopover({
  isPending,
  memberProfiles,
  project,
  onCancel,
  onRename,
}: {
  isPending: boolean;
  memberProfiles: Profile[];
  project: ProjectSummary;
  onCancel: () => void;
  onRename: (input: { memberIds: string[]; name: string }) => Promise<unknown>;
}) {
  const { t } = useTranslation();
  const { data: projectMembers, isError: isProjectMembersError, isLoading: isProjectMembersLoading } = useProjectMembersQuery(project.id);
  const [name, setName] = useState(project.name);
  const [editedMemberIds, setEditedMemberIds] = useState<string[] | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const memberIds = editedMemberIds ?? projectMembers?.map((profile) => profile.id) ?? [];
  const canSubmit = Boolean(name.trim() && memberIds.length > 0 && !isPending && !isProjectMembersLoading);
  useDismissiblePopover({ isOpen: true, popoverRef, onClose: onCancel });

  async function saveProject() {
    if (!canSubmit) {
      return;
    }

    setSubmitError(null);

    try {
      await onRename({ memberIds, name });
    } catch {
      setSubmitError(t("common.mutationError"));
    }
  }

  return (
    <div ref={popoverRef} className="absolute right-auto left-full top-0 z-[100] ml-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-white/10 bg-[#020617] p-3 opacity-100 shadow-2xl shadow-black/50">
      <p className="text-sm font-bold text-white">{t("projectActions.editTitle")}</p>
      <input className="mt-3 h-10 w-full rounded-xl border border-white/10 bg-slate-900 px-3 text-sm text-white outline-none focus:border-cyan-300/50" aria-label={t("projectActions.rename", { project: project.name })} value={name} onChange={(event) => setName(event.currentTarget.value)} />
      <div className="mt-3 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("projectActions.members")}</p>
        {isProjectMembersLoading ? (
          <p className="text-sm text-slate-500">{t("projectActions.membersLoading")}</p>
        ) : (
          <ProfileMultiSelect
            disabled={isPending || isProjectMembersError}
            emptyText={t("projectActions.membersEmpty")}
            profiles={memberProfiles}
            value={memberIds}
            onChange={setEditedMemberIds}
          />
        )}
        {isProjectMembersError && <p className="text-xs leading-5 text-rose-200">{t("projectActions.membersError")}</p>}
      </div>
      {submitError && <p className="mt-3 text-xs leading-5 text-rose-200">{submitError}</p>}
      <div className="mt-3 flex justify-end gap-2">
        <PopoverButton label={t("common.cancel")} onClick={onCancel} />
        <PopoverButton label={t("common.save")} variant="primary" disabled={!canSubmit} isLoading={isPending} onClick={() => void saveProject()} />
      </div>
    </div>
  );
}

function ProjectDeletePopover({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  const { t } = useTranslation();
  const popoverRef = useRef<HTMLDivElement | null>(null);
  useDismissiblePopover({ isOpen: true, popoverRef, onClose: onCancel });

  return (
    <div ref={popoverRef} className="absolute right-auto left-full top-0 z-[100] ml-2 w-64 max-w-[calc(100vw-2rem)] rounded-2xl border border-rose-300/20 bg-[#020617] p-3 opacity-100 shadow-2xl shadow-black/50">
      <p className="text-sm font-bold text-white">{t("projectActions.deleteTitle")}</p>
      <p className="mt-1 text-xs leading-5 text-slate-400">{t("projectActions.deleteDescription")}</p>
      <div className="mt-3 flex justify-end gap-2">
        <PopoverButton label={t("common.cancel")} onClick={onCancel} />
        <PopoverButton label={t("common.delete")} variant="danger" onClick={onConfirm} />
      </div>
    </div>
  );
}

export function ProjectDragHandle({
  attributes,
  label,
  listeners,
  setRef,
}: {
  attributes: DraggableAttributes;
  label: string;
  listeners: DraggableSyntheticListeners;
  setRef: (element: HTMLElement | null) => void;
}) {
  return (
    <IconButton
      ref={setRef}
      label={label}
      variant="drag"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="size-4" />
    </IconButton>
  );
}

function PopoverButton({ disabled, isLoading = false, label, variant = "secondary", onClick }: { disabled?: boolean; isLoading?: boolean; label: string; variant?: "secondary" | "primary" | "danger"; onClick: () => void }) {
  const className = variant === "primary" ? "bg-cyan-300 text-slate-950" : variant === "danger" ? "bg-rose-300 text-rose-950" : "text-slate-300 hover:bg-white/10";

  return <button className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition disabled:opacity-40 ${className}`} type="button" disabled={disabled || isLoading} aria-busy={isLoading || undefined} onClick={onClick}>{isLoading && <Spinner className="size-3.5" />}{label}</button>;
}

function useDismissiblePopover({
  isOpen,
  popoverRef,
  triggerRef,
  onClose,
}: {
  isOpen: boolean;
  popoverRef: RefObject<HTMLElement | null>;
  triggerRef?: RefObject<HTMLElement | null>;
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

      if (popoverRef.current?.contains(target) || triggerRef?.current?.contains(target)) {
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
