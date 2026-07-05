import type { Board, BoardId } from "@/entities/board";
import type { Column, ColumnId } from "@/entities/column";
import type { Tag, TagId } from "@/entities/tag";
import type { ActivityEvent, ActivityEventId, CommentId, Task, TaskComment, TaskId } from "@/entities/task";

import type { Project, ProjectId } from "./types";

export type ProjectStoreState = {
  projectsById: Record<ProjectId, Project>;
  projectIds: ProjectId[];
  activeProjectId: ProjectId | null;
  boardsById: Record<BoardId, Board>;
  activeBoardId: BoardId | null;
  columnsById: Record<ColumnId, Column>;
  tasksById: Record<TaskId, Task>;
  tagsById: Record<TagId, Tag>;
  commentsById: Record<CommentId, TaskComment>;
  activityById: Record<ActivityEventId, ActivityEvent>;
};
