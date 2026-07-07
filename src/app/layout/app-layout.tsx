import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { matchPath, Outlet, useLocation, useNavigate } from "react-router-dom";

import { emptyWorkspaceSnapshot, useProjectStructureMutations, useWorkspaceQuery } from "@/entities/project";
import { getPermissions, selectProjectMemberProfiles, useProfileQuery, useProfilesQuery } from "@/entities/profile";
import { useAuth } from "@/entities/session";
import { appLimits } from "@/shared/config";
import { readLastBoardRoute, writeLastBoardRoute } from "@/shared/lib";

import { buildProjectSummaries } from "./model/layout-view";
import { getBoardPath, getNavigationItems } from "./model/navigation";
import { insertProjectId } from "./model/project-order";
import { AppHeader } from "./ui/app-header";
import { AppSidebar } from "./ui/app-sidebar";

export function AppLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: workspaceData, isError: isWorkspaceError, isLoading: isWorkspaceLoading } = useWorkspaceQuery();
  const { data: currentProfile = null } = useProfileQuery(user?.id);
  const { data: profiles = [] } = useProfilesQuery();
  const mutations = useProjectStructureMutations();
  const workspace = workspaceData ?? emptyWorkspaceSnapshot;
  const projectsById = workspace.projectsById;
  const boardsById = workspace.boardsById;
  const projectIds = workspace.projectIds;
  const routeMatch = matchPath("/projects/:projectId/boards/:boardId", location.pathname);
  const routeProjectId = routeMatch?.params.projectId;
  const routeBoardId = routeMatch?.params.boardId;
  const hasValidRouteBoard = Boolean(
    routeProjectId && routeBoardId && boardsById[routeBoardId]?.projectId === routeProjectId,
  );
  const lastBoardRoute = readLastBoardRoute();
  const fallbackProjectId = workspace.activeProjectId;
  const selectedProjectId = hasValidRouteBoard
    ? routeProjectId!
    : lastBoardRoute?.projectId && projectsById[lastBoardRoute.projectId]
      ? lastBoardRoute.projectId
      : fallbackProjectId;
  const selectedProject = selectedProjectId ? projectsById[selectedProjectId] : null;
  const selectedBoardId = hasValidRouteBoard
    ? routeBoardId!
    : lastBoardRoute?.boardId && boardsById[lastBoardRoute.boardId]?.projectId === selectedProjectId
      ? lastBoardRoute.boardId
      : selectedProject?.boardIds[0] ?? null;
  const activeBoard = selectedBoardId ? boardsById[selectedBoardId] : null;
  const permissions = useMemo(() => getPermissions(currentProfile), [currentProfile]);
  const projectMemberProfiles = useMemo(() => selectProjectMemberProfiles(profiles), [profiles]);
  const canReorderProjects = currentProfile?.role === "manager" || currentProfile?.role === "worker";
  const canViewAnalytics = currentProfile?.role === "admin" || currentProfile?.role === "manager";
  const boardPath = getBoardPath(selectedProject?.id, activeBoard?.id);
  const navigationItems = useMemo(() => getNavigationItems(boardPath, { canViewAnalytics }), [boardPath, canViewAnalytics]);
  const pageTitle = getPageTitle({ isAdmin: currentProfile?.role === "admin", pathname: location.pathname, t });
  const projectSummaries = useMemo(
    () => buildProjectSummaries({ projectIds, projectsById, projectTaskStatsById: workspace.projectTaskStatsById }),
    [projectIds, projectsById, workspace.projectTaskStatsById],
  );
  const projectCreateDisabledReason = projectSummaries.length >= appLimits.projectsTotal
    ? t("limits.projectsTotal", { limit: appLimits.projectsTotal })
    : undefined;

  useEffect(() => {
    if (hasValidRouteBoard && routeProjectId && routeBoardId) {
      writeLastBoardRoute({ boardId: routeBoardId, projectId: routeProjectId });
    }
  }, [hasValidRouteBoard, routeBoardId, routeProjectId]);

  useEffect(() => {
    if (location.pathname !== "/board" || !selectedProject?.id || !activeBoard?.id) {
      return;
    }

    writeLastBoardRoute({ boardId: activeBoard.id, projectId: selectedProject.id });
    void navigate(`${getBoardPath(selectedProject.id, activeBoard.id)}${location.search}`, { replace: true });
  }, [activeBoard?.id, location.pathname, location.search, navigate, selectedProject?.id]);

  if (isWorkspaceLoading || isWorkspaceError) {
    return <AppShellState description={isWorkspaceError ? t("common.serverError") : t("common.loading")} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flowdeck-app-bg fixed inset-0 -z-10" />

      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <AppSidebar
          activeProjectId={selectedProjectId ?? null}
          canReorderProjects={canReorderProjects}
          isProjectCreatePending={mutations.createProjectWithMembers.isPending}
          isProjectUpdatePending={mutations.renameProject.isPending || mutations.updateProjectMembers.isPending}
          isProjectManagementReadOnly={!permissions.canManageProjects}
          memberProfiles={projectMemberProfiles}
          projectCreateDisabledReason={projectCreateDisabledReason}
          projectSummaries={projectSummaries}
          navigationItems={navigationItems}
          onProjectCreate={async ({ memberIds, name }) => {
            const result = await mutations.createProjectWithMembers.mutateAsync({
              name,
              memberIds,
              defaultBoardName: t("projectDefaults.board"),
              defaultColumnNames: getDefaultColumnNames(t),
            });

            void queryClient.invalidateQueries({ queryKey: ["profile"] });
            void navigate(getBoardPath(result.projectId, result.boardId));
          }}
          onProjectDelete={(projectId) => {
            void mutations.deleteProject.mutateAsync(projectId).then(() => {
              if (projectId === selectedProjectId) {
                void navigate("/board");
              }
            }).catch(() => undefined);
          }}
          onProjectRename={async (projectId, { memberIds, name }) => {
            await mutations.renameProject.mutateAsync({
              projectId,
              name,
              description: projectsById[projectId]?.description,
            });
            await mutations.updateProjectMembers.mutateAsync({ memberIds, projectId });
            void queryClient.invalidateQueries({ queryKey: ["profile"] });
          }}
          onProjectReorder={(projectId, targetIndex) => {
            void mutations.reorderProjectMemberships.mutateAsync({
              projectIds: insertProjectId(projectIds, projectId, targetIndex),
            });
          }}
          onProjectSelect={(projectId) => {
            const project = projectsById[projectId];
            const boardId = project?.boardIds[0] ?? null;
            if (boardId) {
              writeLastBoardRoute({ boardId, projectId });
            }
            void navigate(getBoardPath(projectId, boardId));
          }}
        />

        <div className="flex min-w-0 flex-col">
          <AppHeader
            navigationItems={navigationItems}
            pageTitle={pageTitle}
          />
          <main className="min-w-0 flex-1 px-4 py-6 md:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

function AppShellState({ description }: { description: string }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flowdeck-app-bg fixed inset-0 -z-10" />
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-center shadow-2xl shadow-black/30">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200/70">Flowdeck</p>
          <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
        </div>
      </main>
    </div>
  );
}

function getDefaultColumnNames(t: (key: string) => string) {
  return ["backlog", "inProgress", "review", "done"].map((key) => t(`projectDefaults.columns.${key}`));
}

function getPageTitle({ isAdmin, pathname, t }: { isAdmin: boolean; pathname: string; t: (key: string) => string }) {
  if (pathname === "/tasks") {
    return isAdmin ? t("taskList.adminTitle") : t("navigation.tasks");
  }

  if (pathname === "/analytics") {
    return t("navigation.analytics");
  }

  if (pathname === "/settings") {
    return t("navigation.settings");
  }

  return t("navigation.board");
}
