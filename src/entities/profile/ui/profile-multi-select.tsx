import { X } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/shared/lib/cn";
import { Input } from "@/shared/ui";

import { selectProjectMemberProfiles } from "../model/selectors";
import type { Profile } from "../model/types";

type ProfileMultiSelectProps = {
  ariaLabel?: string;
  disabled?: boolean;
  emptyText?: string;
  profiles: Profile[];
  value: string[];
  onChange: (value: string[]) => void;
};

export function ProfileMultiSelect({ ariaLabel, disabled = false, emptyText, profiles, value, onChange }: ProfileMultiSelectProps) {
  const { t } = useTranslation();
  const listboxId = useId();
  const [query, setQuery] = useState("");
  const selectableProfiles = useMemo(() => selectProjectMemberProfiles(profiles), [profiles]);
  const selectedIds = useMemo(() => new Set(value), [value]);
  const selectedProfiles = useMemo(
    () => selectableProfiles.filter((profile) => selectedIds.has(profile.id)),
    [selectableProfiles, selectedIds],
  );
  const filteredProfiles = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return selectableProfiles.filter((profile) => {
      if (!normalizedQuery) {
        return true;
      }

      return getProfileLabel(profile).toLocaleLowerCase().includes(normalizedQuery);
    });
  }, [query, selectableProfiles]);

  function toggleProfile(profileId: string) {
    if (selectedIds.has(profileId)) {
      onChange(value.filter((id) => id !== profileId));
      return;
    }

    onChange([...value, profileId]);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2">
        {selectedProfiles.length > 0 ? (
          selectedProfiles.map((profile) => (
            <button
              key={profile.id}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-cyan-300/10 px-2.5 py-1 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-300/15 disabled:pointer-events-none disabled:opacity-60"
              type="button"
              disabled={disabled}
              onClick={() => toggleProfile(profile.id)}
            >
              <span className="truncate">{getProfileLabel(profile)}</span>
              <X className="size-3.5 shrink-0" />
            </button>
          ))
        ) : (
          <span className="px-1 py-1 text-sm text-slate-500">{emptyText ?? t("profileMultiSelect.emptySelection")}</span>
        )}
      </div>

      <Input
        role="combobox"
        aria-label={ariaLabel ?? t("profileMultiSelect.searchAria")}
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded="true"
        disabled={disabled || selectableProfiles.length === 0}
        value={query}
        placeholder={t("profileMultiSelect.searchPlaceholder")}
        onChange={(event) => setQuery(event.currentTarget.value)}
      />

      <div id={listboxId} className="max-h-48 space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/50 p-2" role="listbox">
        {filteredProfiles.length > 0 ? (
          filteredProfiles.map((profile) => {
            const isSelected = selectedIds.has(profile.id);

            return (
              <button
                key={profile.id}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300",
                  isSelected ? "bg-cyan-300/10 text-cyan-100" : "hover:bg-white/10",
                )}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={disabled}
                onClick={() => toggleProfile(profile.id)}
              >
                <ProfileText profile={profile} />
                <span className="shrink-0 text-xs font-semibold text-slate-500">
                  {isSelected ? t("profileMultiSelect.selected") : t("profileMultiSelect.select")}
                </span>
              </button>
            );
          })
        ) : (
          <p className="px-3 py-2 text-sm text-slate-500">{t("profileMultiSelect.noResults")}</p>
        )}
      </div>
    </div>
  );
}

function ProfileText({ profile }: { profile: Profile }) {
  const { t } = useTranslation();

  return (
    <span className="min-w-0">
      <span className="block truncate text-sm font-semibold text-white">{getProfileLabel(profile)}</span>
      <span className="block text-xs text-slate-500">{t(`settings.profile.roles.${profile.role}`)}</span>
    </span>
  );
}

function getProfileLabel(profile: Profile) {
  return profile.fullName || profile.email;
}
