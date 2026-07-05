import { Tags } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useProjectStructureMutations, useTagsQuery } from "@/entities/project";
import { getPermissions, useProfileQuery } from "@/entities/profile";
import { useAuth } from "@/entities/session";
import { selectTags, type Tag, type TagColor } from "@/entities/tag";
import { Badge, Button, InlineAlert, Input, Select } from "@/shared/ui";

import { PreferenceCard } from "./preference-card";

const tagColors = ["cyan", "emerald", "violet", "amber", "rose", "slate"] as const satisfies readonly TagColor[];
const tagVariant: Record<TagColor, "cyan" | "emerald" | "violet" | "amber" | "rose" | "slate"> = {
  amber: "amber",
  cyan: "cyan",
  emerald: "emerald",
  rose: "rose",
  slate: "slate",
  violet: "violet",
};

export function SettingsTags() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: tagsById = {} } = useTagsQuery();
  const { data: currentProfile = null } = useProfileQuery(user?.id);
  const mutations = useProjectStructureMutations();
  const tags = useMemo(() => selectTags(tagsById), [tagsById]);
  const permissions = useMemo(() => getPermissions(currentProfile), [currentProfile]);
  const isReadOnly = !permissions.canManageEverything;
  const colorOptions = useMemo(
    () => tagColors.map((color) => ({ value: color, label: t(`settings.tags.colors.${color}`) })),
    [t],
  );
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<TagColor>("cyan");
  const [searchQuery, setSearchQuery] = useState("");
  const [mutationError, setMutationError] = useState<string | null>(null);
  const filteredTags = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase();

    if (!normalizedQuery) {
      return [];
    }

    return tags
      .filter((tag) => tag.name.toLocaleLowerCase().includes(normalizedQuery))
      .slice(0, 10);
  }, [searchQuery, tags]);

  async function runTagMutation(action: () => Promise<unknown>) {
    setMutationError(null);

    try {
      await action();
    } catch {
      setMutationError(t("common.mutationError"));
      throw new Error("Tag mutation failed");
    }
  }

  function createTag() {
    const name = newName.trim();

    if (!name || isReadOnly) {
      return;
    }

    void runTagMutation(() => mutations.createTag.mutateAsync({ name, color: newColor }))
      .then(() => setNewName(""))
      .catch(() => undefined);
  }

  return (
    <PreferenceCard
      icon={<Tags className="size-5" />}
      title={t("settings.tags.title")}
      description={isReadOnly ? t("settings.tags.readOnly") : t("settings.tags.description")}
    >
        {!isReadOnly && (
          <div className="grid gap-3 sm:grid-cols-[1fr_12rem_auto]">
            <Input value={newName} placeholder={t("settings.tags.placeholder")} onChange={(event) => setNewName(event.currentTarget.value)} />
            <Select ariaLabel={t("settings.tags.color")} options={colorOptions} value={newColor} onValueChange={(value) => setNewColor(value as TagColor)} />
            <Button type="button" disabled={!newName.trim()} isLoading={mutations.createTag.isPending} onClick={createTag}>{t("settings.tags.create")}</Button>
          </div>
        )}

        {mutationError && <InlineAlert className="mt-4">{mutationError}</InlineAlert>}

        <div className="mt-4 space-y-2">
          <Input
            value={searchQuery}
            placeholder={t("settings.tags.searchPlaceholder")}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
          />

          {!searchQuery.trim() && tags.length === 0 && <Badge variant="outline">{t("settings.tags.empty")}</Badge>}

          {searchQuery.trim() && (
            <div className="space-y-2">
              {filteredTags.length > 0 ? filteredTags.map((tag) => (
                <TagRow
                  key={tag.id}
                  colorOptions={colorOptions}
                  isReadOnly={isReadOnly}
                  tag={tag}
                  isDeleting={mutations.deleteTag.isPending && mutations.deleteTag.variables === tag.id}
                  isSaving={mutations.renameTag.isPending && mutations.renameTag.variables?.tagId === tag.id}
                  onDelete={() => runTagMutation(() => mutations.deleteTag.mutateAsync(tag.id))}
                  onSave={(name, color) => runTagMutation(() => mutations.renameTag.mutateAsync({ tagId: tag.id, name, color }))}
                />
              )) : <Badge variant="outline">{t("settings.tags.noResults")}</Badge>}
            </div>
          )}
        </div>
    </PreferenceCard>
  );
}

function TagRow({
  colorOptions,
  isReadOnly,
  isDeleting,
  isSaving,
  tag,
  onDelete,
  onSave,
}: {
  colorOptions: { value: string; label: string }[];
  isReadOnly: boolean;
  isDeleting: boolean;
  isSaving: boolean;
  tag: Tag;
  onDelete: () => Promise<unknown>;
  onSave: (name: string, color: TagColor) => Promise<unknown>;
}) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [name, setName] = useState(tag.name);
  const [color, setColor] = useState<TagColor>(tag.color);

  if (!isEditing) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-3">
        <Badge variant={tagVariant[tag.color]}>{tag.name}</Badge>
        {!isReadOnly && (
          isConfirmingDelete ? (
            <div className="flex flex-wrap items-center gap-2" role="alertdialog" aria-label={t("settings.tags.deleteTitle")}>
              <span className="text-xs text-slate-400">{t("settings.tags.deleteConfirm")}</span>
              <Button type="button" variant="secondary" onClick={() => setIsConfirmingDelete(false)}>{t("common.cancel")}</Button>
              <Button type="button" variant="secondary" isLoading={isDeleting} onClick={() => void onDelete().then(() => setIsConfirmingDelete(false)).catch(() => undefined)}>{t("common.delete")}</Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setIsEditing(true)}>{t("settings.tags.edit")}</Button>
              <Button type="button" variant="secondary" isLoading={isDeleting} onClick={() => setIsConfirmingDelete(true)}>{t("common.delete")}</Button>
            </div>
          )
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-3 sm:grid-cols-[1fr_12rem_auto]">
      <Input value={name} onChange={(event) => setName(event.currentTarget.value)} />
      <Select ariaLabel={t("settings.tags.color")} options={colorOptions} value={color} onValueChange={(value) => setColor(value as TagColor)} />
      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>{t("common.cancel")}</Button>
        <Button type="button" disabled={!name.trim()} isLoading={isSaving} onClick={() => void onSave(name, color).then(() => setIsEditing(false)).catch(() => undefined)}>{t("common.save")}</Button>
      </div>
    </div>
  );
}
