import { MessageSquare, Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import type { TaskComment } from "@/entities/task";
import { formatDateTime } from "@/shared/lib";
import { Button, Textarea } from "@/shared/ui";

type CommentsSectionProps = {
  comments: TaskComment[];
  editingCommentId: string | null;
  editingCommentMessage: string;
  isReadOnly?: boolean;
  locale: string;
  newCommentMessage: string;
  onAdd: () => void;
  onCancelEdit: () => void;
  onDelete: (comment: TaskComment) => void;
  onEditMessageChange: (message: string) => void;
  onNewMessageChange: (message: string) => void;
  onSaveEdit: () => void;
  onStartEdit: (comment: TaskComment) => void;
};

export function CommentsSection({
  comments,
  editingCommentId,
  editingCommentMessage,
  isReadOnly = false,
  locale,
  newCommentMessage,
  onAdd,
  onCancelEdit,
  onDelete,
  onEditMessageChange,
  onNewMessageChange,
  onSaveEdit,
  onStartEdit,
}: CommentsSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
      <SectionHeader
        icon={<MessageSquare className="size-5" />}
        title={t("taskDetails.comments.title")}
        description={
          comments.length > 0
            ? t("taskDetails.comments.count", { count: comments.length })
            : t("taskDetails.comments.empty")
        }
      />

      <div className="mt-4 space-y-3">
        {comments.map((comment) => (
          <article key={comment.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-white">{comment.author}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatDateTime(comment.updatedAt ?? comment.createdAt, locale)}
                  {comment.updatedAt && ` · ${t("taskDetails.comments.edited")}`}
                </p>
              </div>
              {!isReadOnly && <CommentActions comment={comment} onDelete={onDelete} onStartEdit={onStartEdit} />}
            </div>

            {editingCommentId === comment.id ? (
              <CommentEditor
                author={comment.author}
                message={editingCommentMessage}
                onCancel={onCancelEdit}
                onChange={onEditMessageChange}
                onSave={onSaveEdit}
              />
            ) : (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                {comment.message}
              </p>
            )}
          </article>
        ))}
      </div>

      {!isReadOnly && (
        <div className="mt-4 space-y-2">
          <Textarea
            className="min-h-24"
            value={newCommentMessage}
            placeholder={t("taskDetails.comments.placeholder")}
            aria-label={t("taskDetails.comments.newAria")}
            onChange={(event) => onNewMessageChange(event.currentTarget.value)}
          />
          <div className="flex justify-end">
            <Button className="gap-2" type="button" disabled={!newCommentMessage.trim()} onClick={onAdd}>
              <Plus className="size-4" />
              {t("taskDetails.comments.add")}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

function SectionHeader({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="rounded-2xl bg-cyan-300/10 p-2 text-cyan-200">{icon}</span>
      <div>
        <h3 className="font-bold text-white">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function CommentActions({
  comment,
  onDelete,
  onStartEdit,
}: {
  comment: TaskComment;
  onDelete: (comment: TaskComment) => void;
  onStartEdit: (comment: TaskComment) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex shrink-0 items-center gap-1">
      <button className="rounded-xl px-2 py-1 text-xs font-semibold text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300" type="button" onClick={() => onStartEdit(comment)}>
        {t("taskDetails.comments.edit")}
      </button>
      <button className="rounded-xl p-2 text-slate-500 transition hover:bg-rose-300/10 hover:text-rose-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-300" type="button" aria-label={t("taskDetails.comments.delete", { author: comment.author })} onClick={() => onDelete(comment)}>
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

function CommentEditor({
  author,
  message,
  onCancel,
  onChange,
  onSave,
}: {
  author: string;
  message: string;
  onCancel: () => void;
  onChange: (message: string) => void;
  onSave: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="mt-3 space-y-2">
      <Textarea
        className="min-h-24"
        value={message}
        aria-label={t("taskDetails.comments.editAria", { author })}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>{t("taskDetails.comments.cancelEdit")}</Button>
        <Button type="button" disabled={!message.trim()} onClick={onSave}>{t("taskDetails.comments.saveEdit")}</Button>
      </div>
    </div>
  );
}
