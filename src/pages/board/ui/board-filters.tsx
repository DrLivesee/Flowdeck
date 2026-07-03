import { useId, useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { Tag } from "@/entities/tag";
import {
  deadlineFilterValues,
  taskFilterSearchParams,
  taskPriorities,
  type CompletionFilterValue,
  type TaskFilters,
} from "@/features/filter-tasks";
import { Badge, Button, Card, Input, Select } from "@/shared/ui";

type BoardFiltersProps = {
  filters: TaskFilters;
  hasFilters: boolean;
  tags: Tag[];
  totalTaskCount: number;
  visibleTaskCount: number;
  onClear: () => void;
  onFilterChange: (key: string, value: string, emptyValue?: string) => void;
};

export function BoardFilters({
  filters,
  hasFilters,
  tags,
  totalTaskCount,
  visibleTaskCount,
  onClear,
  onFilterChange,
}: BoardFiltersProps) {
  const { t } = useTranslation();
  const searchId = useId();
  const priorityOptions = useMemo(
    () => [
      { value: "all", label: t("board.filters.allPriorities") },
      ...taskPriorities.map((priority) => ({
        value: priority,
        label: t(`taskPriority.${priority}`),
      })),
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
    () =>
      deadlineFilterValues.map((value) => ({
        value,
        label: t(`board.filters.deadline.${value}`),
      })),
    [t],
  );
  const completionOptions = useMemo(
    () =>
      (["all", "open", "completed"] as const satisfies readonly CompletionFilterValue[]).map(
        (value) => ({ value, label: t(`board.filters.completion.${value}`) }),
      ),
    [t],
  );

  return (
    <Card className="p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Badge variant={hasFilters ? "cyan" : "slate"}>
          {t("board.filters.visibleCount", { visible: visibleTaskCount, total: totalTaskCount })}
        </Badge>
      </div>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
        <div className="min-w-0 flex-1">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500" htmlFor={searchId}>
            {t("board.filters.searchLabel")}
          </label>
          <Input
            id={searchId}
            value={filters.search}
            placeholder={t("board.filters.searchPlaceholder")}
            onChange={(event) =>
              onFilterChange(taskFilterSearchParams.search, event.currentTarget.value, "")
            }
          />
        </div>

        <FilterSelect
          label={t("board.filters.priorityLabel")}
          options={priorityOptions}
          value={filters.priority}
          onValueChange={(value) => onFilterChange(taskFilterSearchParams.priority, value)}
        />
        <FilterSelect
          label={t("board.filters.tagLabel")}
          options={tagOptions}
          value={filters.tagId}
          onValueChange={(value) => onFilterChange(taskFilterSearchParams.tag, value)}
        />
        <FilterSelect
          label={t("board.filters.deadlineLabel")}
          options={deadlineOptions}
          value={filters.deadline}
          onValueChange={(value) => onFilterChange(taskFilterSearchParams.deadline, value)}
        />
        <FilterSelect
          label={t("board.filters.completionLabel")}
          options={completionOptions}
          value={filters.completion}
          onValueChange={(value) => onFilterChange(taskFilterSearchParams.completion, value)}
        />

        <Button type="button" variant="secondary" disabled={!hasFilters} onClick={onClear}>
          {t("board.filters.clear")}
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
    <div className="min-w-44">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </span>
      <Select ariaLabel={label} options={options} value={value} onValueChange={onValueChange} />
    </div>
  );
}
