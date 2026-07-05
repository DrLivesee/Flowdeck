import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useAuth, useDeleteAccountMutation } from "@/entities/session";
import { Button } from "@/shared/ui";

import { PreferenceCard } from "./preference-card";

export function AccountDangerZone() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const deleteAccount = useDeleteAccountMutation();
  const [isConfirming, setIsConfirming] = useState(false);

  async function confirmDelete() {
    try {
      await deleteAccount.mutateAsync();
    } catch {
      return;
    }

    try {
      await signOut();
    } finally {
      void navigate("/auth/login", { replace: true });
    }
  }

  return (
    <PreferenceCard
      icon={<Trash2 className="size-5" />}
      title={t("settings.accountDelete.title")}
      description={t("settings.accountDelete.description")}
    >
      {isConfirming ? (
        <div className="rounded-2xl border border-rose-300/20 bg-rose-300/10 p-4">
          <p className="text-sm font-semibold text-rose-100">
            {t("settings.accountDelete.confirmTitle")}
          </p>
          <p className="mt-2 text-sm leading-6 text-rose-100/80">
            {t("settings.accountDelete.confirmDescription")}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsConfirming(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              className="bg-rose-300 text-rose-950 hover:bg-rose-200 focus-visible:outline-rose-300"
              type="button"
              disabled={deleteAccount.isPending}
              onClick={() => void confirmDelete()}
            >
              {deleteAccount.isPending ? t("settings.accountDelete.deleting") : t("settings.accountDelete.confirmAction")}
            </Button>
          </div>
          {deleteAccount.isError && (
            <p className="mt-3 text-sm text-rose-100">
              {t("settings.accountDelete.error")}
            </p>
          )}
        </div>
      ) : (
        <Button type="button" variant="secondary" onClick={() => setIsConfirming(true)}>
          {t("settings.accountDelete.openConfirm")}
        </Button>
      )}
    </PreferenceCard>
  );
}
