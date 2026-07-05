import { useTranslation } from "react-i18next";

import { Badge, Card } from "@/shared/ui";

import type { AppRole } from "../model/types";

export function RoleCapabilityHint({ role }: { role: AppRole }) {
  const { t } = useTranslation();
  const variant = role === "admin" || role === "worker" ? "violet" : role === "guest" ? "slate" : "cyan";

  return (
    <Card className="flex flex-col gap-3 border-cyan-300/15 bg-cyan-300/[0.04] p-4 sm:flex-row sm:items-center">
      <Badge className="shrink-0" variant={variant}>
        {t(`auth.roles.${role}`)}
      </Badge>
      <p className="text-sm leading-6 text-slate-400">{t(`board.roleHint.${role}`)}</p>
    </Card>
  );
}
