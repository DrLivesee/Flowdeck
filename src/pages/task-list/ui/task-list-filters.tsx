import { useId, useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { Tag } from "@/entities/tag";
import {
  completionFilterValues,
  deadlineFilterValues,
  taskFilterSearchParams,
  taskPriorities,
  type TaskFilters,
} from "@/features/filter-tasks";
import { Button, Card, Input, Select } from "@/shared/ui";

import { taskListSortValues, type TaskListSortValue } from "../model/task-list-view";

type TaskListFiltersProps = {
  filters: TaskFilters;
  hasFilters: boolean;
  sort: TaskListSortValue;
  tags: Tag[];
  onClear: () => void;
  onFilterChange: (key: string, value: string, emptyValue?: string) => void;
  onSortChange: (sort: TaskListSortValue) => void;
};

export function TaskListFilters({
  filters,
  hasFilters,
  sort,
  tags,
  onClear,
  onFilterChange,
  onSortChange,
}: TaskListFiltersProps) {
  const { t } = useTranslation();
  const searchId = useId();
  const priorityOptions = useMemo(
    () => [
      { value: "all", label: t("board.filters.allPriorities") },
      ...taskPriorities.map((priority) => ({ value: priority, label: t(`taskPriority.${priority}`) })),
    ],
    [t],
  );
  const tagOptions = useMemo(
    () => [
      { value: "all", label: t("board.filters.allTags") },
      ...tags.map((tag) => ({ value: tag.id, label: tag.name })),
    ],
    [tags, t],
  );
  const deadlineOptions = useMemo(
    () => deadlineFilterValues.map((value) => ({ value, label: t(`board.filters.deadline.${value}`) })),
    [t],
  );
  const completionOptions = useMemo(
    () => completionFilterValues.map((value) => ({ value, label: t(`board.filters.completion.${value}`) })),
    [t],
  );
  const sortOptions = useMemo(
    () => taskListSortValues.map((value) => ({ value, label: t(`taskList.sort.${value}`) })),
    [t],
  );

  return (
    <Card className="p-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_repeat(5,minmax(150px,auto))_auto] lg:items-end">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500" htmlFor={searchId}>
            {t("board.filters.searchLabel")}
          </label>
          <Input
            id={searchId}
            value={filters.search}
            placeholder={t("board.filters.searchPlaceholder")}
            onChange={(event) => onFilterChange(taskFilterSearchParams.search, event.currentTarget.value, "")}
          />
        </div>

        <FilterSelect label={t("board.filters.priorityLabel")} options={priorityOptions} value={filters.priority} onValueChange={(value) => onFilterChange(taskFilterSearchParams.priority, value)} />
        <FilterSelect label={t("board.filters.tagLabel")} options={tagOptions} value={filters.tagId} onValueChange={(value) => onFilterChange(taskFilterSearchParams.tag, value)} />
        <FilterSelect label={t("board.filters.deadlineLabel")} options={deadlineOptions} value={filters.deadline} onValueChange={(value) => onFilterChange(taskFilterSearchParams.deadline, value)} />
        <FilterSelect label={t("board.filters.completionLabel")} options={completionOptions} value={filters.completion} onValueChange={(value) => onFilterChange(taskFilterSearchParams.completion, value)} />
        <FilterSelect label={t("taskList.sort.label")} options={sortOptions} value={sort} onValueChange={(value) => onSortChange(value as TaskListSortValue)} />

        <Button type="button" variant="secondary" disabled={!hasFilters && sort === "updated"} onClick={onClear}>
          {sort === "updated" ? t("board.filters.clear") : t("taskList.filters.clearWithSort")}
        </Button>
      </div>
    </Card>
  );
}

function FilterSelect({
  label,
  options,
  value,
  onValueChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <div>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </span>
      <Select ariaLabel={label} options={options} value={value} onValueChange={onValueChange} />
    </div>
  );
}
