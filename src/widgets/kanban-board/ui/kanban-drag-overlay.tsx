import { TaskCard } from "@/entities/task";
import type { Task } from "@/entities/task";
import type { Tag } from "@/entities/tag";
import { Badge, Card, OverflowTooltip } from "@/shared/ui";

import type { KanbanColumnView } from "../model/types";
import { columnAccentSurfaceClass } from "../model/view";

type KanbanDragOverlayProps = {
  activeColumn?: KanbanColumnView;
  activeTask?: Task;
  locale: string;
  tagsById: Record<string, Tag>;
};

export function KanbanDragOverlay({
  activeColumn,
  activeTask,
  locale,
  tagsById,
}: KanbanDragOverlayProps) {
  if (activeTask) {
    return (
      <div className="w-80 max-w-[80vw]">
        <TaskCard
          locale={locale}
          tags={activeTask.tagIds.flatMap((tagId) => tagsById[tagId] ?? [])}
          task={activeTask}
        />
      </div>
    );
  }

  if (!activeColumn) {
    return null;
  }

  return (
    <Card className={`w-80 max-w-[80vw] p-4 shadow-2xl shadow-black/40 ${columnAccentSurfaceClass[activeColumn.column.accent]}`}>
      <div className="flex min-w-0 items-center gap-3">
        <OverflowTooltip
          text={activeColumn.column.name}
          className="min-w-0 flex-1"
          contentClassName="font-bold text-white"
        />
        <Badge className="py-0.5" variant="slate">
          {activeColumn.tasks.length}
        </Badge>
      </div>
    </Card>
  );
}
