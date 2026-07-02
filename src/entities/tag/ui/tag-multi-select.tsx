import { X } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge, Input } from "@/shared/ui";

import type { Tag, TagColor } from "../model/types";

const tagVariant: Record<TagColor, "cyan" | "emerald" | "violet" | "amber" | "rose" | "slate"> = {
  amber: "amber",
  cyan: "cyan",
  emerald: "emerald",
  rose: "rose",
  slate: "slate",
  violet: "violet",
};

type TagMultiSelectProps = {
  ariaLabel?: string;
  disabled?: boolean;
  tags: Tag[];
  value: string[];
  onChange: (value: string[]) => void;
};

export function TagMultiSelect({ ariaLabel, disabled = false, tags, value, onChange }: TagMultiSelectProps) {
  const { t } = useTranslation();
  const listboxId = useId();
  const [query, setQuery] = useState("");
  const selectedTags = useMemo(
    () => value.flatMap((tagId) => tags.find((tag) => tag.id === tagId) ?? []),
    [tags, value],
  );
  const filteredTags = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    if (!normalizedQuery) {
      return [];
    }

    return tags
      .filter((tag) => tag.name.toLocaleLowerCase().includes(normalizedQuery))
      .slice(0, 10);
  }, [query, tags]);

  function toggleTag(tagId: string) {
    if (value.includes(tagId)) {
      onChange(value.filter((selectedId) => selectedId !== tagId));
      return;
    }

    onChange([...value, tagId]);
  }

  return (
    <div className="space-y-3">
      <Input
        role="combobox"
        aria-label={ariaLabel ?? t("tagMultiSelect.searchAria")}
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={Boolean(query.trim())}
        disabled={disabled}
        value={query}
        placeholder={t("tagMultiSelect.searchPlaceholder")}
        onKeyDown={(event) => {
          if (event.key === "Escape" && query.trim()) {
            event.stopPropagation();
            setQuery("");
          }
        }}
        onChange={(event) => setQuery(event.currentTarget.value)}
      />

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label={t("tagMultiSelect.selectedLabel")}>
          {selectedTags.map((tag) => (
            <button
              key={tag.id}
              className="inline-flex max-w-full items-center gap-1 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed"
              type="button"
              disabled={disabled}
              aria-label={t("tagMultiSelect.remove", { tag: tag.name })}
              onClick={() => toggleTag(tag.id)}
            >
              <Badge className="max-w-full" variant={tagVariant[tag.color]}>
                <span className="truncate">{tag.name}</span>
                <X className="ml-1 size-3" />
              </Badge>
            </button>
          ))}
        </div>
      )}

      {query.trim() && (
        <div id={listboxId} className="max-h-52 space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/50 p-2" role="listbox">
          {filteredTags.length > 0 ? (
            filteredTags.map((tag) => {
              const isSelected = value.includes(tag.id);

              return (
                <button
                  key={tag.id}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed"
                  type="button"
                  disabled={disabled}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => toggleTag(tag.id)}
                >
                  <Badge variant={tagVariant[tag.color]}>{tag.name}</Badge>
                  <span className="text-xs font-semibold text-slate-500">
                    {isSelected ? t("tagMultiSelect.selected") : t("tagMultiSelect.select")}
                  </span>
                </button>
              );
            })
          ) : (
            <p className="px-3 py-2 text-sm text-slate-500">{t("tagMultiSelect.noResults")}</p>
          )}
        </div>
      )}
    </div>
  );
}
