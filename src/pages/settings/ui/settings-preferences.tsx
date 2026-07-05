import { Palette } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useSettingsStore, type BoardDensity } from "@/entities/settings";
import { Select } from "@/shared/ui";

import { PreferenceCard } from "./preference-card";

const boardDensityValues = ["comfortable", "spacious", "compact"] as const satisfies readonly BoardDensity[];

export function SettingsPreferences() {
  const { t } = useTranslation();
  const boardDensity = useSettingsStore((state) => state.boardDensity);
  const setBoardDensity = useSettingsStore((state) => state.setBoardDensity);
  const densityOptions = useMemo(
    () => boardDensityValues.map((value) => ({ value, label: t(`settings.density.${value}`) })),
    [t],
  );

  return (
    <PreferenceCard
      icon={<Palette className="size-5" />}
      title={t("settings.items.density.title")}
      description={t("settings.items.density.description")}
    >
      <Select
        ariaLabel={t("settings.items.density.title")}
        options={densityOptions}
        value={boardDensity}
        onValueChange={(value) => setBoardDensity(value as BoardDensity)}
      />
    </PreferenceCard>
  );
}
