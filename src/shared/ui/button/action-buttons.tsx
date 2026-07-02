import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button, type ButtonProps } from "./button";

type ActionButtonProps = Omit<ButtonProps, "children"> & {
  label?: string;
};

export function CreateButton({ className, label, ...props }: ActionButtonProps) {
  const { t } = useTranslation();

  return (
    <Button className={className} {...props}>
      <Plus className="size-4" />
      {label ?? t("common.actions.create")}
    </Button>
  );
}

export function CancelButton({ label, variant = "secondary", ...props }: ActionButtonProps) {
  const { t } = useTranslation();

  return (
    <Button variant={variant} {...props}>
      {label ?? t("common.actions.cancel")}
    </Button>
  );
}
