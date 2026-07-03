import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { useId } from "react";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { ProfileSearchSelect, isAssignableProfile, type Profile } from "@/entities/profile";
import { TagMultiSelect, type Tag } from "@/entities/tag";
import { Input, Select, Textarea } from "@/shared/ui";

import type { TaskDetailsFormValues } from "../model/task-details-form";
import { FormField } from "./form-field";

type TaskDetailsFieldsProps = {
  canChooseAssignee?: boolean;
  columnOptions: { value: string; label: string }[];
  control: Control<TaskDetailsFormValues>;
  disabled?: boolean;
  errors: FieldErrors<TaskDetailsFormValues>;
  profiles: Profile[];
  priorityOptions: { value: string; label: string }[];
  register: UseFormRegister<TaskDetailsFormValues>;
  tags: Tag[];
  taskTitle: string;
};

export function TaskDetailsFields({
  canChooseAssignee = false,
  columnOptions,
  control,
  disabled = false,
  errors,
  profiles,
  priorityOptions,
  register,
  tags,
  taskTitle,
}: TaskDetailsFieldsProps) {
  const { t } = useTranslation();
  const titleFieldId = useId();
  const descriptionFieldId = useId();
  const deadlineFieldId = useId();

  return (
    <>
      <FormField error={errors.title?.message} htmlFor={titleFieldId} label={t("taskDetails.fields.title")}>
        <Input id={titleFieldId} disabled={disabled} {...register("title")} />
      </FormField>

      <FormField error={errors.description?.message} htmlFor={descriptionFieldId} label={t("taskDetails.fields.description")}>
        <Textarea id={descriptionFieldId} className="min-h-36" disabled={disabled} {...register("description")} />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField error={errors.priority?.message} label={t("taskDetails.fields.priority")}>
          <Controller
            control={control}
            name="priority"
            render={({ field }) => (
              <Select
                ariaLabel={t("taskDetails.fields.priority")}
                disabled={disabled}
                options={priorityOptions}
                value={field.value}
                onValueChange={field.onChange}
              />
            )}
          />
        </FormField>

        <FormField error={errors.deadline?.message} htmlFor={deadlineFieldId} label={t("taskDetails.fields.deadline")}>
          <Input id={deadlineFieldId} disabled={disabled} type="date" {...register("deadline")} />
        </FormField>
      </div>

      <FormField label={t("taskDetails.fields.assignee")}>
        <Controller
          control={control}
          name="assigneeId"
          render={({ field }) => (
            <ProfileSearchSelect
              ariaLabel={t("taskDetails.fields.assignee")}
              disabled={disabled || !canChooseAssignee || !profiles.some(isAssignableProfile)}
              profiles={profiles}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </FormField>

      <FormField label={t("taskDetails.fields.column")}>
        <Controller
          control={control}
          name="columnId"
          render={({ field }) => (
            <Select
              ariaLabel={t("taskDetails.move.columnAria", { task: taskTitle })}
              disabled={disabled}
              options={columnOptions}
              value={field.value}
              onValueChange={field.onChange}
            />
          )}
        />
        <span className="mt-2 block text-xs text-slate-500">
          {t("taskDetails.move.helper")}
        </span>
      </FormField>

      <FormField label={t("taskDetails.fields.tags")}> 
        <Controller
          control={control}
          name="tagIds"
          render={({ field }) => (
            <TagMultiSelect ariaLabel={t("taskDetails.fields.tags")} disabled={disabled} tags={tags} value={field.value} onChange={field.onChange} />
          )}
        />
      </FormField>
    </>
  );
}
