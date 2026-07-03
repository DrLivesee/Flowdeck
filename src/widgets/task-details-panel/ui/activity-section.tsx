import { History } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { ActivityEvent } from "@/entities/task";
import { formatDateTime } from "@/shared/lib";

type ActivitySectionProps = {
  events: ActivityEvent[];
  locale: string;
};

export function ActivitySection({ events, locale }: ActivitySectionProps) {
  const { t } = useTranslation();

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start gap-3">
        <span className="rounded-2xl bg-violet-300/10 p-2 text-violet-200">
          <History className="size-5" />
        </span>
        <div>
          <h3 className="font-bold text-white">{t("taskDetails.activity.title")}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {events.length > 0
              ? t("taskDetails.activity.count", { count: events.length })
              : t("taskDetails.activity.empty")}
          </p>
        </div>
      </div>

      {events.length > 0 && (
        <ol className="mt-4 space-y-3">
          {events.map((event) => (
            <ActivityTimelineItem key={event.id} event={event} locale={locale} />
          ))}
        </ol>
      )}
    </section>
  );
}

function ActivityTimelineItem({ event, locale }: { event: ActivityEvent; locale: string }) {
  const { t } = useTranslation();

  return (
    <li className="grid grid-cols-[auto_1fr] gap-3">
      <span className="mt-1 size-2.5 rounded-full bg-violet-300 shadow-[0_0_18px_rgba(196,181,253,0.65)]" />
      <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
        <p className="text-sm font-semibold text-slate-100">
          {t(`taskDetails.activity.events.${event.type}`)}
        </p>
        <p className="mt-1 text-xs text-slate-500">{formatDateTime(event.createdAt, locale)}</p>
      </div>
    </li>
  );
}
