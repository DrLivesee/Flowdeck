import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import type { Column } from "@/entities/column";
import type { Profile } from "@/entities/profile";
import type { Tag } from "@/entities/tag";
import { selectChecklistProgress, type ActivityEvent, type ChecklistItemId, type Task, type TaskComment, type TaskPriority } from "@/entities/task";
import { useModalA11y } from "@/shared/lib";
import { InlineAlert } from "@/shared/ui";

import { getTaskAssigneeName } from "../model/task-assignee-options";
import {
  createTaskDetailsSchema,
  getTaskFormValues,
  priorities,
  type TaskDetailsFormValues,
} from "../model/task-details-form";
import {
  useTaskActivityEvents,
  useTaskComments,
} from "../model/use-task-details-data";
import { ActivitySection } from "./activity-section";
import { ChecklistSection } from "./checklist-section";
import { CommentsSection } from "./comments-section";
import { TaskDetailsFields } from "./task-details-fields";
import { TaskDetailsFooter } from "./task-details-footer";
import { TaskDetailsHeader } from "./task-details-header";

type TaskDetailsPanelProps = {
  task: Task;
  activityById: Record<string, ActivityEvent>;
  columns: Column[];
  commentsById: Record<string, TaskComment>;
  tags: Tag[];
  locale: string;
  profilesById: Record<string, Profile>;
  assigneeProfiles?: Profile[];
  canDelete?: boolean;
  canChooseAssignee?: boolean;
  isReadOnly?: boolean;
  onClose: () => void;
  onAddChecklistItem: (input: { boardId: string; taskId: string; title: string }) => Promise<unknown>;
  onAddTaskComment: (input: { boardId: string; message: string; taskId: string }) => Promise<unknown>;
  onDeleteChecklistItem: (input: { boardId: string; checklistItemId: ChecklistItemId; taskId: string }) => Promise<unknown>;
  onDeleteTask: (taskId: string) => Promise<unknown>;
  onDeleteTaskComment: (input: { boardId: string; commentId: string; taskId: string }) => Promise<unknown>;
  onEditTaskComment: (input: { boardId: string; commentId: string; message: string; taskId: string }) => Promise<unknown>;
  onRenameChecklistItem: (input: { boardId: string; checklistItemId: ChecklistItemId; taskId: string; title: string }) => Promise<unknown>;
  onToggleChecklistItem: (input: { boardId: string; checklistItemId: ChecklistItemId; taskId: string }) => Promise<unknown>;
  onUpdateTask: (input: {
    assigneeId?: string;
    deadline?: string;
    description?: string;
    priority: TaskPriority;
    tagIds: string[];
    targetColumnId?: string;
    taskId: string;
    title: string;
  }) => Promise<unknown>;
};

export function TaskDetailsPanel({
  task,
  activityById,
  columns,
  commentsById,
  tags,
  locale,
  profilesById,
  assigneeProfiles,
  canDelete = false,
  canChooseAssignee = false,
  isReadOnly = false,
  onClose,
  onAddChecklistItem,
  onAddTaskComment,
  onDeleteChecklistItem,
  onDeleteTask,
  onDeleteTaskComment,
  onEditTaskComment,
  onRenameChecklistItem,
  onToggleChecklistItem,
  onUpdateTask,
}: TaskDetailsPanelProps) {
  const { t } = useTranslation();
  const drawerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [newCommentMessage, setNewCommentMessage] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentMessage, setEditingCommentMessage] = useState("");
  const [isConfirmingTaskDelete, setIsConfirmingTaskDelete] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const checklistProgress = selectChecklistProgress(task);
  const comments = useTaskComments(task, commentsById);
  const displayComments = useMemo(
    () => comments.map((comment) => ({ ...comment, author: profilesById[comment.author]?.fullName || profilesById[comment.author]?.email || comment.author })),
    [comments, profilesById],
  );
  const activityEvents = useTaskActivityEvents(task, activityById);
  const schema = useMemo(() => createTaskDetailsSchema(t), [t]);
  const {
    formState: { errors, isSubmitting },
    control,
    handleSubmit,
    register,
    reset,
  } = useForm<TaskDetailsFormValues>({
    resolver: zodResolver(schema),
    defaultValues: getTaskFormValues(task),
  });
  const priorityOptions = useMemo(
    () => priorities.map((priority) => ({ value: priority, label: t(`taskPriority.${priority}`) })),
    [t],
  );
  const columnOptions = useMemo(
    () => columns.map((column) => ({ value: column.id, label: column.name })),
    [columns],
  );
  const profiles = useMemo(() => assigneeProfiles ?? Object.values(profilesById), [assigneeProfiles, profilesById]);
  const assigneeName = getTaskAssigneeName(task.assigneeId, profilesById);
  const title = useWatch({ control, name: "title" });
  const isSaveDisabled = !title.trim();

  useEffect(() => {
    reset(getTaskFormValues(task));
  }, [reset, task]);

  useModalA11y({ containerRef: drawerRef, onClose });

  async function onSubmit(values: TaskDetailsFormValues) {
    if (isReadOnly) {
      return;
    }

    setMutationError(null);

    try {
      await onUpdateTask({
        taskId: task.id,
        assigneeId: canChooseAssignee ? values.assigneeId || undefined : task.assigneeId,
        title: values.title,
        description: values.description || undefined,
        priority: values.priority,
        tagIds: values.tagIds,
        targetColumnId: values.columnId !== task.columnId ? values.columnId : undefined,
        deadline: values.deadline || undefined,
      });
    } catch {
      setMutationError(t("common.mutationError"));
      return;
    }

    onClose();
  }

  async function addChecklistItemFromInput() {
    setMutationError(null);

    try {
      await onAddChecklistItem({ boardId: task.boardId, taskId: task.id, title: newChecklistTitle });
    } catch {
      setMutationError(t("common.mutationError"));
      return;
    }

    setNewChecklistTitle("");
  }

  async function addCommentFromInput() {
    setMutationError(null);

    try {
      await onAddTaskComment({
        boardId: task.boardId,
        taskId: task.id,
        message: newCommentMessage,
      });
    } catch {
      setMutationError(t("common.mutationError"));
      return;
    }

    setNewCommentMessage("");
  }

  function startEditingComment(comment: TaskComment) {
    setEditingCommentId(comment.id);
    setEditingCommentMessage(comment.message);
  }

  async function saveEditedComment() {
    if (!editingCommentId) {
      return;
    }

    setMutationError(null);

    try {
      await onEditTaskComment({
        boardId: task.boardId,
        taskId: task.id,
        commentId: editingCommentId,
        message: editingCommentMessage,
      });
    } catch {
      setMutationError(t("common.mutationError"));
      return;
    }

    setEditingCommentId(null);
    setEditingCommentMessage("");
  }

  async function confirmTaskDelete() {
    setMutationError(null);

    try {
      await onDeleteTask(task.id);
    } catch {
      setMutationError(t("common.mutationError"));
      return;
    }

    onClose();
  }

  function runSecondaryAction(action: () => Promise<unknown>) {
    setMutationError(null);

    void action().catch(() => setMutationError(t("common.mutationError")));
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}>
      <button
        className="flowdeck-modal-backdrop absolute inset-0 backdrop-blur-sm"
        type="button"
        tabIndex={-1}
        aria-label={t("taskDetails.close")}
        onClick={onClose}
      />

      <aside ref={drawerRef} className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col border-l border-white/10 bg-slate-950 shadow-2xl shadow-black/50">
        <TaskDetailsHeader assigneeName={assigneeName} descriptionId={descriptionId} task={task} locale={locale} titleId={titleId} onClose={onClose} />

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit(onSubmit)}>
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
            {mutationError && <InlineAlert>{mutationError}</InlineAlert>}

            <TaskDetailsFields
              canChooseAssignee={canChooseAssignee}
              columnOptions={columnOptions}
              control={control}
              disabled={isReadOnly}
              errors={errors}
              profiles={profiles}
              priorityOptions={priorityOptions}
              register={register}
              tags={tags}
              taskTitle={task.title}
            />

            <ChecklistSection
              isReadOnly={isReadOnly}
              newChecklistTitle={newChecklistTitle}
              progress={checklistProgress}
              task={task}
              onAdd={addChecklistItemFromInput}
              onDelete={(checklistItemId) => runSecondaryAction(() => onDeleteChecklistItem({ boardId: task.boardId, taskId: task.id, checklistItemId }))}
              onRename={(checklistItemId, title) => runSecondaryAction(() => onRenameChecklistItem({ boardId: task.boardId, taskId: task.id, checklistItemId, title }))}
              onTitleChange={setNewChecklistTitle}
              onToggle={(checklistItemId) => runSecondaryAction(() => onToggleChecklistItem({ boardId: task.boardId, taskId: task.id, checklistItemId }))}
            />

            <CommentsSection
              comments={displayComments}
              editingCommentId={editingCommentId}
              editingCommentMessage={editingCommentMessage}
              isReadOnly={isReadOnly}
              locale={locale}
              newCommentMessage={newCommentMessage}
              onAdd={addCommentFromInput}
              onCancelEdit={() => {
                setEditingCommentId(null);
                setEditingCommentMessage("");
              }}
              onDelete={(comment) => runSecondaryAction(() => onDeleteTaskComment({ boardId: task.boardId, taskId: task.id, commentId: comment.id }))}
              onEditMessageChange={setEditingCommentMessage}
              onNewMessageChange={setNewCommentMessage}
              onSaveEdit={saveEditedComment}
              onStartEdit={startEditingComment}
            />

            <ActivitySection events={activityEvents} locale={locale} />
          </div>

          <TaskDetailsFooter
            isConfirmingDelete={isConfirmingTaskDelete}
            canDelete={canDelete}
            isReadOnly={isReadOnly}
            isSaveDisabled={isSaveDisabled}
            isSubmitting={isSubmitting}
            onCancel={onClose}
            onCancelDelete={() => setIsConfirmingTaskDelete(false)}
            onConfirmDelete={confirmTaskDelete}
            onRequestDelete={() => setIsConfirmingTaskDelete(true)}
          />
        </form>
      </aside>
    </div>
  );
}
