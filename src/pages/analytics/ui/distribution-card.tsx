import type { ReactNode } from "react";

import type { AnalyticsBreakdownItem } from "../model/analytics-view";

type DistributionCardProps = {
  emptyText: string;
  items: AnalyticsBreakdownItem[];
  title: string;
  renderLabel?: (item: AnalyticsBreakdownItem) => ReactNode;
};

export function DistributionCard({ emptyText, items, title, renderLabel }: DistributionCardProps) {
  const hasValues = items.some((item) => item.count > 0);

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
      <h3 className="font-bold text-white">{title}</h3>
      <div className="mt-5 space-y-4">
        {hasValues ? (
          items.map((item) => (
            <div key={item.id}>
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-medium text-slate-300">
                  {renderLabel ? renderLabel(item) : item.label}
                </span>
                <span className="shrink-0 text-slate-500">{item.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-900">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-300"
                  style={{ width: `${Math.max(item.ratio * 100, item.count > 0 ? 6 : 0)}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm leading-6 text-slate-500">{emptyText}</p>
        )}
      </div>
    </section>
  );
}
