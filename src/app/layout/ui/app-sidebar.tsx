import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

import flowdeckLogo from "@/shared/assets/flowdeck-logo.png";
import type { Profile } from "@/entities/profile";

import type { ProjectSummary } from "../model/layout-view";
import type { NavigationItem } from "../model/navigation";
import { SidebarLink } from "./navigation-links";
import { ProjectList } from "./project-list";

type AppSidebarProps = {
  activeProjectId: string | null;
  isProjectCreatePending?: boolean;
  isProjectUpdatePending?: boolean;
  canReorderProjects?: boolean;
  memberProfiles: Profile[];
  isProjectManagementReadOnly?: boolean;
  projectCreateDisabledReason?: string;
  projectSummaries: ProjectSummary[];
  navigationItems: NavigationItem[];
  onProjectCreate: (input: { memberIds: string[]; name: string }) => Promise<unknown>;
  onProjectDelete: (projectId: string) => void;
  onProjectRename: (projectId: string, input: { memberIds: string[]; name: string }) => Promise<unknown>;
  onProjectReorder: (projectId: string, targetIndex: number) => void;
  onProjectSelect: (projectId: string) => void;
};

export function AppSidebar({
  activeProjectId,
  isProjectCreatePending = false,
  isProjectUpdatePending = false,
  canReorderProjects = false,
  isProjectManagementReadOnly = false,
  memberProfiles,
  projectCreateDisabledReason,
  projectSummaries,
  navigationItems,
  onProjectCreate,
  onProjectDelete,
  onProjectRename,
  onProjectReorder,
  onProjectSelect,
}: AppSidebarProps) {
  const { t } = useTranslation();

  return (
    <aside className="relative z-50 hidden overflow-visible border-r border-white/10 bg-slate-950/70 p-5 backdrop-blur-xl lg:flex lg:flex-col">
      <BrandBlock />
      <ProjectList
        activeProjectId={activeProjectId}
        canReorderProjects={canReorderProjects}
        isProjectCreatePending={isProjectCreatePending}
        isProjectUpdatePending={isProjectUpdatePending}
        isReadOnly={isProjectManagementReadOnly}
        memberProfiles={memberProfiles}
        projectCreateDisabledReason={projectCreateDisabledReason}
        projectSummaries={projectSummaries}
        onProjectCreate={onProjectCreate}
        onProjectDelete={onProjectDelete}
        onProjectRename={onProjectRename}
        onProjectReorder={onProjectReorder}
        onProjectSelect={onProjectSelect}
      />

      <nav className="mt-6 space-y-2" aria-label={t("app.primaryNavigation")}>
        {navigationItems.map((item) => <SidebarLink key={item.to} item={item} />)}
      </nav>

      <div className="mt-auto rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm text-cyan-50">
        <div className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
          <Sparkles className="size-5" />
        </div>
        <p className="font-semibold">{t("app.portfolioMode")}</p>
        <p className="mt-2 leading-6 text-cyan-100/75">{t("app.portfolioDescription")}</p>
      </div>
    </aside>
  );
}

function BrandBlock() {
  const { t } = useTranslation();

  return (
      <div className="flex items-center gap-3">
      <div className="size-11 overflow-hidden rounded-2xl border border-cyan-300/30 bg-slate-950 shadow-lg shadow-cyan-950/40">
        <img className="size-full object-cover" src={flowdeckLogo} alt="" aria-hidden="true" />
      </div>
      <div>
        <p className="text-lg font-black tracking-tight text-white">Flowdeck</p>
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-cyan-200/70">
          {t("app.productSubtitle")}
        </p>
      </div>
    </div>
  );
}
