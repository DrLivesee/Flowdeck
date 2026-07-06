import { z } from "zod";

import type { AppRole } from "@/entities/profile";
import { getTodayISODate } from "@/shared/lib";

export type RegistrationRole = Exclude<AppRole, "admin">;

export const registrationRoles = ["manager", "worker", "guest"] as const satisfies readonly RegistrationRole[];

export function createRegisterSchema(t: (key: string) => string) {
  return z.object({
    firstName: z.string().trim().min(1, t("auth.register.validation.firstNameRequired")),
    lastName: z.string().trim().min(1, t("auth.register.validation.lastNameRequired")),
    middleName: z.string().trim(),
    birthDate: z
      .string()
      .refine((value) => !value || value <= getTodayISODate(), t("auth.register.validation.birthDateFuture")),
    email: z.string().trim().email(t("auth.register.validation.emailInvalid")),
    password: z
      .string()
      .trim()
      .min(8, t("auth.register.validation.passwordMin"))
      .regex(/\p{L}/u, t("auth.register.validation.passwordLetter"))
      .regex(/\d/u, t("auth.register.validation.passwordDigit")),
    role: z.enum(registrationRoles),
  });
}

export type RegisterFormValues = z.infer<ReturnType<typeof createRegisterSchema>>;
