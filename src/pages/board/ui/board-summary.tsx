import { useTranslation } from "react-i18next";

import { formatPercent } from "@/shared/lib";
import { Card } from "@/shared/ui";

import type { BoardStats } from "../model/board-view";

type BoardSummaryProps = {
  stats: BoardStats;
};

export function BoardSummary({ stats }: BoardSummaryProps) {
  const { t } = useTranslation();

  return (
    <Card className="grid grid-cols-3 gap-3 p-3 text-center sm:min-w-96">
      <SummaryItem label={t("common.columns")} value={stats.totalColumns} />
      <SummaryItem label={t("common.tasks")} value={stats.totalTasks} />
      <SummaryItem label={t("common.complete")} value={formatPercent(stats.completionRatio)} />
    </Card>
  );
}

function SummaryItem({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl bg-slate-900/80 p-3">
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
