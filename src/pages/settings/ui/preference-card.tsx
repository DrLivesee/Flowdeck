import type { ReactNode } from "react";

import { Card, CardDescription, CardTitle } from "@/shared/ui";

type PreferenceCardProps = {
  children: ReactNode;
  description: string;
  icon: ReactNode;
  title: string;
};

export function PreferenceCard({ children, description, icon, title }: PreferenceCardProps) {
  return (
    <Card className="p-5">
      <div className="flex size-11 items-center justify-center rounded-2xl bg-white/10 text-cyan-200">
        {icon}
      </div>
      <CardTitle className="mt-5 text-xl">{title}</CardTitle>
      <CardDescription className="mt-3">{description}</CardDescription>
      <div className="mt-5">{children}</div>
    </Card>
  );
}
