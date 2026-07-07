import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import type { Profile } from "@/entities/profile";
import { cn } from "@/shared/lib/cn";

import type { ProjectSummary } from "../model/layout-view";
import { ProjectCreateButton, ProjectDragHandle, ProjectInlineActions, ProjectReorderActions } from "./project-list-controls";

type ProjectListProps = {
  activeProjectId: string | null;
  isReadOnly?: boolean;
  isProjectCreatePending?: boolean;
  isProjectUpdatePending?: boolean;
  canReorderProjects?: boolean;
  memberProfiles: Profile[];
  projectCreateDisabledReason?: string;
  projectSummaries: ProjectSummary[];
  onProjectCreate: (input: { memberIds: string[]; name: string }) => Promise<unknown>;
  onProjectDelete: (projectId: string) => void;
  onProjectRename: (projectId: string, input: { memberIds: string[]; name: string }) => Promise<unknown>;
  onProjectReorder: (projectId: string, targetIndex: number) => void;
  onProjectSelect: (projectId: string) => void;
};

export function ProjectList({
  activeProjectId,
  isReadOnly = false,
  isProjectCreatePending = false,
  isProjectUpdatePending = false,
  canReorderProjects = false,
  memberProfiles,
  projectCreateDisabledReason,
  projectSummaries,
  onProjectCreate,
  onProjectDelete,
  onProjectRename,
  onProjectReorder,
  onProjectSelect,
}: ProjectListProps) {
  const { t } = useTranslation();
  const isDragEnabled = canReorderProjects && projectSummaries.length > 1;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;

    if (!overId || activeId === overId) {
      return;
    }

    const targetIndex = projectSummaries.findIndex((project) => project.id === overId);

    if (targetIndex >= 0) {
      onProjectReorder(activeId, targetIndex);
    }
  }

  return (
    <section className="mt-6" aria-labelledby="project-sidebar-title">
      <ProjectListHeader
        createDisabledReason={projectCreateDisabledReason}
        isProjectCreatePending={isProjectCreatePending}
        isReadOnly={isReadOnly}
        memberProfiles={memberProfiles}
        onProjectCreate={onProjectCreate}
      />

      {projectSummaries.length > 0 && isDragEnabled ? (
        <DndContext collisionDetection={closestCenter} sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext items={projectSummaries.map((project) => project.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {projectSummaries.map((project) => (
                <SortableProjectButton
                  key={project.id}
                  canDelete={true}
                  isActive={project.id === activeProjectId}
                  isProjectUpdatePending={isProjectUpdatePending}
                  isReadOnly={isReadOnly}
                  memberProfiles={memberProfiles}
                  project={project}
                  onDelete={() => onProjectDelete(project.id)}
                  onRename={(input) => onProjectRename(project.id, input)}
                  onSelect={() => onProjectSelect(project.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : projectSummaries.length > 0 ? (
        <div className="space-y-2">
          {projectSummaries.map((project) => (
            <ProjectButton
              key={project.id}
              isActive={project.id === activeProjectId}
              project={project}
              isReadOnly={isReadOnly}
              isProjectUpdatePending={isProjectUpdatePending}
              memberProfiles={memberProfiles}
              canDelete={true}
              onDelete={() => onProjectDelete(project.id)}
              onRename={(input) => onProjectRename(project.id, input)}
              onSelect={() => onProjectSelect(project.id)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-500">
          <p className="font-semibold text-slate-300">{t("projectSidebar.emptyTitle")}</p>
          <p className="mt-2 leading-6">{t("projectSidebar.emptyDescription")}</p>
        </div>
      )}
    </section>
  );
}

function ProjectListHeader({
  createDisabledReason,
  isReadOnly,
  isProjectCreatePending,
  memberProfiles,
  onProjectCreate,
}: {
  createDisabledReason?: string;
  isProjectCreatePending: boolean;
  isReadOnly: boolean;
  memberProfiles: Profile[];
  onProjectCreate: ProjectListProps["onProjectCreate"];
}) {
  const { t } = useTranslation();

  return (
    <div className="mb-3 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h2 id="project-sidebar-title" className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
          {t("projectSidebar.title")}
        </h2>
        {!isReadOnly && <ProjectCreateButton disabledReason={createDisabledReason} isPending={isProjectCreatePending} memberProfiles={memberProfiles} onCreate={onProjectCreate} />}
      </div>
      {!isReadOnly && createDisabledReason && <p className="text-xs leading-5 text-amber-200/90">{createDisabledReason}</p>}
    </div>
  );
}

function ProjectButton(props: {
  canDelete: boolean;
  project: ProjectSummary;
  isActive: boolean;
  isProjectUpdatePending: boolean;
  isReadOnly: boolean;
  dragHandle?: ReactNode;
  memberProfiles: Profile[];
  onDelete: () => void;
  onRename: (input: { memberIds: string[]; name: string }) => Promise<unknown>;
  onSelect: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="group/project relative">
      <button className={getProjectButtonClassName(props.isActive)} type="button" aria-pressed={props.isActive} aria-label={t("projectSidebar.switchTo", { project: props.project.name })} onClick={props.onSelect}>
        <ProjectButtonContent project={props.project} isActive={props.isActive} />
      </button>
      {!props.isReadOnly && (
        <ProjectInlineActions
          canDelete={props.canDelete}
          isPending={props.isProjectUpdatePending}
          memberProfiles={props.memberProfiles}
          project={props.project}
          onDelete={() => props.onDelete()}
          onRename={(_projectId, input) => props.onRename(input)}
        />
      )}
      {props.isReadOnly && props.dragHandle && <ProjectReorderActions dragHandle={props.dragHandle} />}
    </div>
  );
}

function SortableProjectButton(props: {
  canDelete: boolean;
  project: ProjectSummary;
  isActive: boolean;
  isProjectUpdatePending: boolean;
  isReadOnly: boolean;
  memberProfiles: Profile[];
  onDelete: () => void;
  onRename: (input: { memberIds: string[]; name: string }) => Promise<unknown>;
  onSelect: () => void;
}) {
  const { t } = useTranslation();
  const { attributes, isDragging, listeners, setActivatorNodeRef, setNodeRef, transform, transition } = useSortable({ id: props.project.id });

  return (
    <div ref={setNodeRef} className={cn("group/project relative", isDragging && "opacity-40")} style={{ transform: CSS.Transform.toString(transform), transition }}>
      <ProjectButton
        {...props}
        dragHandle={
          <ProjectDragHandle
            attributes={attributes}
            label={t("projectActions.drag", { project: props.project.name })}
            listeners={listeners}
            setRef={setActivatorNodeRef}
          />
        }
      />
    </div>
  );
}

function ProjectButtonContent({ project, isActive }: { project: ProjectSummary; isActive: boolean }) {
  const { t } = useTranslation();

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-white">{project.name}</p>
          {project.description && <p className="mt-1 line-clamp-2 text-xs leading-4 text-slate-500">{project.description}</p>}
        </div>
        <span className={cn("mt-1 size-2.5 shrink-0 rounded-full", isActive ? "bg-cyan-300" : "bg-slate-700")} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-[0.65rem] font-semibold text-slate-400">
        <span className="rounded-full bg-white/10 px-2 py-1">{t("projectSidebar.boardsCount", { count: project.boardCount })}</span>
        <span className="rounded-full bg-white/10 px-2 py-1">{t("projectSidebar.tasksCount", { count: project.taskCount })}</span>
        <span className="rounded-full bg-white/10 px-2 py-1">{t("projectSidebar.completedCount", { count: project.completedCount })}</span>
        {project.archived && <span className="rounded-full bg-amber-300/10 px-2 py-1 text-amber-200">{t("projectSidebar.archived")}</span>}
      </div>
    </>
  );
}

function getProjectButtonClassName(isActive: boolean) {
  return cn(
    "w-full rounded-2xl border p-3 pr-16 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300",
    isActive
      ? "border-cyan-300/40 bg-cyan-300/10 shadow-lg shadow-cyan-950/20"
      : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.07]",
  );
}
