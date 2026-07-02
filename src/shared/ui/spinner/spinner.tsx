import { LoaderCircle } from "lucide-react";

import { cn } from "@/shared/lib";

type SpinnerProps = {
  className?: string;
};

export function Spinner({ className }: SpinnerProps) {
  return <LoaderCircle className={cn("size-4 animate-spin", className)} aria-hidden="true" />;
}
