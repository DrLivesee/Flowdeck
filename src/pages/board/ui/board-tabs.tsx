import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { Board } from "@/entities/board";
import { cn } from "@/shared/lib";
import { CancelButton, CreateButton, Input, Popover, Spinner } from "@/shared/ui";

type BoardTabsProps = {
  activeBoardId: string;
  activeBoardActions?: ReactNode;
  boards: Board[];
  isReadOnly?: boolean;
  isCreatePending?: boolean;
  onBoardCreate: (name: string) => void;
  onBoardReorder: (boardId: string, targetIndex: number) => void;
  onBoardSelect: (boardId: string) => void;
};

export function BoardTabs({ activeBoardActions, activeBoardId, boards, isCreatePending = false, isReadOnly = false, onBoardCreate, onBoardReorder, onBoardSelect }: BoardTabsProps) {
  const [isCreating, setIsCreating] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;

    if (isReadOnly || !overId || activeId === overId) {
      return;
    }

    const targetIndex = boards.findIndex((board) => board.id === overId);

    if (targetIndex >= 0) {
      onBoardReorder(activeId, targetIndex);
    }
  }

  return (
    <div className="relative max-w-full">
      <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-1">
        <DndContext collisionDetection={closestCenter} sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext items={boards.map((board) => board.id)} strategy={horizontalListSortingStrategy}>
            <div className="flex items-center gap-2">
              {boards.map((board) => (
                <div key={board.id} className="flex shrink-0 items-center gap-2">
                  <BoardTabButton
                    board={board}
                    isActive={board.id === activeBoardId}
                    isReadOnly={isReadOnly}
                    onBoardSelect={onBoardSelect}
                  />
                  {board.id === activeBoardId && activeBoardActions}
                  {board.id === activeBoardId && !isReadOnly && (
                    <BoardCreateButton
                      isOpen={isCreating}
                      isPending={isCreatePending}
                      onCancel={() => setIsCreating(false)}
                      onOpenChange={setIsCreating}
                      onSubmit={(name) => {
                        onBoardCreate(name);
                        setIsCreating(false);
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

function BoardCreateButton({
  isOpen,
  isPending,
  onCancel,
  onOpenChange,
  onSubmit,
}: {
  isOpen: boolean;
  isPending: boolean;
  onCancel: () => void;
  onOpenChange: (isOpen: boolean | ((value: boolean) => boolean)) => void;
  onSubmit: (name: string) => void;
}) {
  const { t } = useTranslation();
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  return (
    <div className="relative shrink-0">
      <button
        ref={buttonRef}
        className="inline-flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-400 transition hover:border-cyan-300/40 hover:text-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
        type="button"
        disabled={isPending}
        aria-label={t("boardManager.create")}
        onClick={() => onOpenChange((value) => !value)}
      >
        {isPending ? <Spinner /> : <Plus className="size-4" />}
      </button>

      {isOpen && (
        <BoardCreatePopover
          triggerRef={buttonRef}
          isPending={isPending}
          onCancel={onCancel}
          onSubmit={onSubmit}
        />
      )}
    </div>
  );
}

function BoardTabButton({
  board,
  isActive,
  isReadOnly,
  onBoardSelect,
}: {
  board: Board;
  isActive: boolean;
  isReadOnly: boolean;
  onBoardSelect: (boardId: string) => void;
}) {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
    id: board.id,
    disabled: isReadOnly,
  });

  return (
    <button
      ref={setNodeRef}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300",
        isActive
          ? "border-cyan-300/50 bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-950/30"
          : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20 hover:bg-white/[0.08]",
        isDragging && "opacity-50",
      )}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      type="button"
      onClick={() => onBoardSelect(board.id)}
      {...attributes}
      aria-pressed={isActive}
      {...listeners}
    >
      {board.name}
    </button>
  );
}

function BoardCreatePopover({
  triggerRef,
  onCancel,
  isPending,
  onSubmit,
}: {
  triggerRef: React.RefObject<HTMLElement | null>;
  onCancel: () => void;
  isPending: boolean;
  onSubmit: (name: string) => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState("");

  return (
    <Popover
      triggerRef={triggerRef}
      title={t("boardManager.create")}
      width={288}
      onClose={onCancel}
      footer={
        <>
          <CancelButton size="sm" type="button" onClick={onCancel} />
          <CreateButton
            size="sm"
            type="button"
            disabled={!name.trim() || isPending}
            isLoading={isPending}
            onClick={() => onSubmit(name)}
          />
        </>
      }
    >
      <Input
        className="mt-3"
        value={name}
        placeholder={t("boardManager.createPlaceholder")}
        onChange={(event) => setName(event.currentTarget.value)}
      />
    </Popover>
  );
}
