import type { BoardId } from "@/entities/board";
import type { ColumnId } from "@/entities/column";
import type { TagId } from "@/entities/tag";

export type TaskId = string;
export type ChecklistItemId = string;
export type CommentId = string;
export type ActivityEventId = string;

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type ChecklistItem = {
  id: ChecklistItemId;
  title: string;
  completed: boolean;
  createdAt: string;
};

export type TaskComment = {
  id: CommentId;
  taskId: TaskId;
  author: string;
  message: string;
  createdAt: string;
  updatedAt?: string;
};

export type ActivityEventType =
  | "task.created"
  | "task.updated"
  | "task.moved"
  | "task.priorityChanged"
  | "task.deadlineChanged"
  | "task.checklistUpdated"
  | "task.commentAdded"
  | "task.commentUpdated"
  | "task.commentDeleted";

export type ActivityEvent = {
  id: ActivityEventId;
  taskId: TaskId;
  type: ActivityEventType;
  message: string;
  createdAt: string;
};

export type Task = {
  id: TaskId;
  boardId: BoardId;
  columnId: ColumnId;
  assigneeId?: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  tagIds: TagId[];
  checklist: ChecklistItem[];
  commentIds: CommentId[];
  activityIds: ActivityEventId[];
  deadline?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
};
