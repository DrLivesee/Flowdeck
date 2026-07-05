import { createBrowserRouter, Navigate } from "react-router-dom";

import { AppLayout } from "@/app/layout";

import { ProtectedRoute, PublicAuthRoute } from "./auth-guards";
import {
  AnalyticsRoutePage,
  BoardRoutePage,
  LoginRoutePage,
  RegisterRoutePage,
  SettingsRoutePage,
  TaskListRoutePage,
} from "./route-pages";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/board" replace />,
      },
      {
        path: "board",
        element: <BoardRoutePage />,
      },
      {
        path: "projects/:projectId/boards/:boardId",
        element: <BoardRoutePage />,
      },
      {
        path: "tasks",
        element: <TaskListRoutePage />,
      },
      {
        path: "analytics",
        element: <AnalyticsRoutePage />,
      },
      {
        path: "settings",
        element: <SettingsRoutePage />,
      },
    ],
  },
  {
    path: "/auth/login",
    element: (
      <PublicAuthRoute>
        <LoginRoutePage />
      </PublicAuthRoute>
    ),
  },
  {
    path: "/auth/register",
    element: (
      <PublicAuthRoute>
        <RegisterRoutePage />
      </PublicAuthRoute>
    ),
  },
]);
