import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import type { BoardId } from "@/entities/board";
import type { Column } from "@/entities/column";
import { ProfileSearchSelect, isAssignableProfile, type Profile } from "@/entities/profile";
import { TagMultiSelect, type Tag } from "@/entities/tag";
import type { TaskPriority } from "@/entities/task";
import { getAppLimitErrorMessage, useModalA11y } from "@/shared/lib";
import { CancelButton, CreateButton, InlineAlert, Input, Select, Textarea } from "@/shared/ui";

import { FormField } from "./form-field";

const priorities = ["low", "medium", "high", "urgent"] as const satisfies readonly TaskPriority[];

type CreateTaskFormProps = {
  boardId: BoardId;
  canChooseAssignee?: boolean;
  columns: Column[];
  currentUserId?: string;
  profiles: Profile[];
  tags: Tag[];
  onClose: () => void;
  onCreateTask: (input: {
    assigneeId?: string;
    boardId: BoardId;
    columnId: string;
    deadline?: string;
    description?: string;
    priority: TaskPriority;
    tagIds: string[];
    title: string;
  }) => Promise<unknown>;
};

export function CreateTaskForm({ boardId, canChooseAssignee = false, columns, currentUserId, profiles, tags, onClose, onCreateTask }: CreateTaskFormProps) {
  const { t } = useTranslation();
  const drawerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const titleFieldId = useId();
  const descriptionFieldId = useId();
  const deadlineFieldId = useId();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const schema = useMemo(
    () =>
      z.object({
        title: z
          .string()
          .trim()
          .min(1, t("createTask.validation.titleRequired"))
          .max(120, t("createTask.validation.titleMax")),
        description: z.string().max(600, t("createTask.validation.descriptionMax")),
        priority: z.enum(priorities),
        deadline: z.string(),
        columnId: z.string().min(1, t("createTask.validation.columnRequired")),
        assigneeId: z.string(),
        tagIds: z.array(z.string()),
      }),
    [t],
  );
  type CreateTaskFormValues = z.infer<typeof schema>;
  const {
    formState: { errors, isSubmitting },
    control,
    handleSubmit,
    register,
    reset,
  } = useForm<CreateTaskFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      deadline: "",
      columnId: columns[0]?.id ?? "",
      assigneeId: currentUserId ?? "",
      tagIds: [],
    },
  });
  const columnOptions = useMemo(
    () => columns.map((column) => ({ value: column.id, label: column.name })),
    [columns],
  );
  const priorityOptions = useMemo(
    () => priorities.map((priority) => ({ value: priority, label: t(`taskPriority.${priority}`) })),
    [t],
  );
  const title = useWatch({ control, name: "title" });
  const isSubmitDisabled = columns.length === 0 || !title.trim();
  useModalA11y({ containerRef: drawerRef, onClose });

  async function onSubmit(values: CreateTaskFormValues) {
    setSubmitError(null);

    try {
      await onCreateTask({
        boardId,
        columnId: values.columnId,
        assigneeId: canChooseAssignee ? values.assigneeId || undefined : currentUserId,
        title: values.title,
        description: values.description || undefined,
        priority: values.priority,
        tagIds: values.tagIds,
        deadline: values.deadline || undefined,
      });
    } catch (error) {
      setSubmitError(getAppLimitErrorMessage(error, t) ?? t("common.mutationError"));
      return;
    }

    reset({
      title: "",
      description: "",
      priority: values.priority,
      deadline: "",
      columnId: values.columnId,
      assigneeId: canChooseAssignee ? values.assigneeId : currentUserId ?? "",
      tagIds: [],
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}>
      <button
        className="flowdeck-modal-backdrop absolute inset-0 backdrop-blur-sm"
        type="button"
        tabIndex={-1}
        aria-label={t("createTask.close")}
        onClick={onClose}
      />

      <aside ref={drawerRef} className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col border-l border-white/10 bg-slate-950 shadow-2xl shadow-black/50">
        <header className="border-b border-white/10 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200/70">
                {t("createTask.eyebrow")}
              </p>
              <h3 id={titleId} className="mt-2 text-3xl font-black tracking-tight text-white">
                {t("createTask.title")}
              </h3>
              <p id={descriptionId} className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                {t("createTask.description")}
              </p>
            </div>
            <button
              className="rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
              type="button"
              aria-label={t("createTask.close")}
              onClick={onClose}
            >
              <X className="size-5" />
            </button>
          </div>
        </header>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit(onSubmit)}>
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
            {submitError && <InlineAlert>{submitError}</InlineAlert>}

            <div className="grid gap-4 sm:grid-cols-[1.2fr_0.8fr]">
              <FormField error={errors.title?.message} htmlFor={titleFieldId} label={t("createTask.fields.title")}>
                <Input id={titleFieldId} placeholder={t("createTask.placeholders.title")} {...register("title")} />
              </FormField>

              <FormField error={errors.columnId?.message} label={t("createTask.fields.column")}>
                <Controller
                  control={control}
                  name="columnId"
                  render={({ field }) => (
                    <Select
                      ariaLabel={t("createTask.fields.column")}
                      disabled={columns.length === 0}
                      options={columnOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                    />
                  )}
                />
              </FormField>
            </div>

            <FormField
              error={errors.description?.message}
              htmlFor={descriptionFieldId}
              label={t("createTask.fields.description")}
            >
              <Textarea
                id={descriptionFieldId}
                className="min-h-36"
                placeholder={t("createTask.placeholders.description")}
                {...register("description")}
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField error={errors.priority?.message} label={t("createTask.fields.priority")}>
                <Controller
                  control={control}
                  name="priority"
                  render={({ field }) => (
                    <Select
                      ariaLabel={t("createTask.fields.priority")}
                      options={priorityOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                    />
                  )}
                />
              </FormField>

              <FormField error={errors.deadline?.message} htmlFor={deadlineFieldId} label={t("createTask.fields.deadline")}>
                <Input id={deadlineFieldId} type="date" {...register("deadline")} />
              </FormField>
            </div>

            <FormField label={t("createTask.fields.assignee")}>
              <Controller
                control={control}
                name="assigneeId"
                render={({ field }) => (
                    <ProfileSearchSelect
                      ariaLabel={t("createTask.fields.assignee")}
                      disabled={!canChooseAssignee || !profiles.some(isAssignableProfile)}
                      profiles={profiles}
                      value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </FormField>

            <FormField label={t("createTask.fields.tags")}> 
              <Controller
                control={control}
                name="tagIds"
                render={({ field }) => (
                  <TagMultiSelect ariaLabel={t("createTask.fields.tags")} tags={tags} value={field.value} onChange={field.onChange} />
                )}
              />
            </FormField>
          </div>

          <footer className="flex items-center justify-end gap-3 border-t border-white/10 p-5">
            <CancelButton type="button" onClick={onClose} />
            <CreateButton disabled={isSubmitDisabled} isLoading={isSubmitting} type="submit" />
          </footer>
        </form>
      </aside>
    </div>
  );
}
