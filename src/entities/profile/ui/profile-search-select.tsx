import { X } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Input } from "@/shared/ui";

import { selectAssignableProfiles } from "../model/selectors";
import type { Profile } from "../model/types";

type ProfileSearchSelectProps = {
  ariaLabel?: string;
  disabled?: boolean;
  profiles: Profile[];
  value: string;
  onChange: (value: string) => void;
};

export function ProfileSearchSelect({ ariaLabel, disabled = false, profiles, value, onChange }: ProfileSearchSelectProps) {
  const { t } = useTranslation();
  const listboxId = useId();
  const [query, setQuery] = useState("");
  const selectableProfiles = useMemo(
    () => selectAssignableProfiles(profiles),
    [profiles],
  );
  const selectedProfile = profiles.find((profile) => profile.id === value);
  const filteredProfiles = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    if (!normalizedQuery) {
      return [];
    }

    return selectableProfiles
      .filter((profile) => getProfileLabel(profile).toLocaleLowerCase().includes(normalizedQuery))
      .slice(0, 10);
  }, [query, selectableProfiles]);

  return (
    <div className="space-y-3">
      <SelectedProfile
        disabled={disabled}
        profile={selectedProfile}
        onClear={() => onChange("")}
      />

      <Input
        role="combobox"
        aria-label={ariaLabel ?? t("profileSearchSelect.searchAria")}
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={Boolean(query.trim())}
        disabled={disabled}
        value={query}
        placeholder={t("profileSearchSelect.searchPlaceholder")}
        onKeyDown={(event) => {
          if (event.key === "Escape" && query.trim()) {
            event.stopPropagation();
            setQuery("");
          }
        }}
        onChange={(event) => setQuery(event.currentTarget.value)}
      />

      {query.trim() && (
        <div id={listboxId} className="max-h-52 space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/50 p-2" role="listbox">
          {filteredProfiles.length > 0 ? (
            filteredProfiles.map((profile) => {
              const isSelected = profile.id === value;

              return (
                <button
                  key={profile.id}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(profile.id);
                    setQuery("");
                  }}
                >
                  <ProfileText profile={profile} />
                  <span className="text-xs font-semibold text-slate-500">
                    {isSelected ? t("profileSearchSelect.selected") : t("profileSearchSelect.select")}
                  </span>
                </button>
              );
            })
          ) : (
            <p className="px-3 py-2 text-sm text-slate-500">{t("profileSearchSelect.noResults")}</p>
          )}
        </div>
      )}
    </div>
  );
}

function SelectedProfile({
  disabled,
  profile,
  onClear,
}: {
  disabled: boolean;
  profile: Profile | undefined;
  onClear: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
      {profile ? <ProfileText profile={profile} /> : <span className="text-sm text-slate-500">{t("taskAssignee.unassigned")}</span>}
      {profile && !disabled && (
        <button
          className="rounded-xl p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
          type="button"
          aria-label={t("profileSearchSelect.clear")}
          onClick={onClear}
        >
          <X className="size-4" />
        </button>
      )}
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
