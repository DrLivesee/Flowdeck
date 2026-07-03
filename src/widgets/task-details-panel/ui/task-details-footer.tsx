import { Save, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/ui";

type TaskDetailsFooterProps = {
  canDelete?: boolean;
  isConfirmingDelete: boolean;
  isReadOnly?: boolean;
  isSaveDisabled?: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  onRequestDelete: () => void;
};

export function TaskDetailsFooter({
  canDelete = false,
  isConfirmingDelete,
  isReadOnly = false,
  isSaveDisabled = false,
  isSubmitting,
  onCancel,
  onCancelDelete,
  onConfirmDelete,
  onRequestDelete,
}: TaskDetailsFooterProps) {
  const { t } = useTranslation();

  return (
    <footer className="flex flex-col gap-3 border-t border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        {!canDelete ? null : isConfirmingDelete ? (
          <div className="flex items-center gap-2" role="alertdialog" aria-label={t("taskDetails.deleteTask.title")} aria-describedby="task-delete-confirm-description">
            <span id="task-delete-confirm-description" className="sr-only">
              {t("taskDetails.deleteTask.description")}
            </span>
            <Button type="button" variant="secondary" onClick={onCancelDelete}>
              {t("taskDetails.deleteTask.keep")}
            </Button>
            <button
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-rose-300 px-5 text-base font-bold text-rose-950 transition hover:bg-rose-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300"
              type="button"
              onClick={onConfirmDelete}
            >
              <Trash2 className="size-4" />
              {t("taskDetails.deleteTask.confirm")}
            </button>
          </div>
        ) : (
          <button
            className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-rose-300/20 bg-rose-300/10 px-5 text-base font-medium text-rose-200 transition hover:bg-rose-300/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300"
            type="button"
            onClick={onRequestDelete}
          >
            <Trash2 className="size-4" />
            {t("taskDetails.deleteTask.action")}
          </button>
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {isReadOnly ? t("common.close") : t("taskDetails.cancel")}
        </Button>
        {!isReadOnly && (
          <Button className="gap-2" disabled={isSaveDisabled} isLoading={isSubmitting} type="submit">
            <Save className="size-4" />
            {t("taskDetails.save")}
          </Button>
        )}
      </div>
    </footer>
  );
}
