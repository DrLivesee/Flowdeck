import type { LucideIcon } from "lucide-react";

import { Card } from "@/shared/ui";

type MetricCardProps = {
  description: string;
  icon: LucideIcon;
  label: string;
  value: string;
};

export function MetricCard({ description, icon: Icon, label, value }: MetricCardProps) {
  return (
    <Card className="p-5">
      <div className="flex size-11 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-200">
        <Icon className="size-5" />
      </div>
      <p className="mt-5 text-4xl font-black text-white">{value}</p>
      <p className="mt-2 text-sm font-semibold text-slate-300">{label}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
    </Card>
  );
}
