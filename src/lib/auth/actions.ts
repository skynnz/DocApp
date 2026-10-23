"use server";

import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { users } from "@/db/schema";
import { getRequestMeta } from "@/lib/http";

import { hashPassword, verifyPassword } from "./password";
import {
  checkLoginRateLimit,
  clearLoginFailures,
  loginRateLimitKey,
  recordLoginFailure,
} from "./rate-limit";
import {
  createSession,
  deleteExpiredSessions,
  destroyCurrentSession,
  getCurrentSession,
  requireUser,
  revokeOtherSessions,
} from "./session";

export type LoginState = {
  error?: string;
  email?: string;
};

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Introduce un email válido.")
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Introduce tu contraseña."),
});

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const rawEmail = String(formData.get("email") ?? "");
  const parsed = loginSchema.safeParse({
    email: rawEmail,
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return {
      error: "Introduce un email y una contraseña válidos.",
      email: rawEmail,
    };
  }

  const { email, password } = parsed.data;
  const { ip } = await getRequestMeta();
  const rateLimitKey = loginRateLimitKey(email, ip);
  const rateLimit = checkLoginRateLimit(rateLimitKey);

  if (!rateLimit.allowed) {
    const minutes = Math.max(1, Math.ceil(rateLimit.retryAfterSeconds / 60));
    return {
      error: `Demasiados intentos. Vuelve a probar en ${minutes} minuto${minutes === 1 ? "" : "s"}.`,
      email,
    };
  }

  const [user] = await db
    .select({
      id: users.id,
      passwordHash: users.passwordHash,
      isActive: users.isActive,
      mustChangePassword: users.mustChangePassword,
    })
    .from(users)
    .where(sql`lower(${users.email}) = ${email}`)
    .limit(1);

  const passwordIsValid =
    user && user.isActive
      ? await verifyPassword(user.passwordHash, password)
      : false;

  if (!user || !user.isActive || !passwordIsValid) {
    recordLoginFailure(rateLimitKey);
    return {
      error: "Email o contraseña incorrectos.",
      email,
    };
  }

  clearLoginFailures(rateLimitKey);
  await deleteExpiredSessions().catch(() => undefined);
  await createSession(user.id);

  redirect(user.mustChangePassword ? "/change-password" : "/projects");
}

export type ChangePasswordState = {
  error?: string;
  success?: boolean;
};

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Introduce tu contraseña actual."),
    newPassword: z
      .string()
      .min(12, "La nueva contraseña debe tener al menos 12 caracteres.")
      .max(200, "La nueva contraseña es demasiado larga."),
    confirmPassword: z.string().min(1, "Confirma la nueva contraseña."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas nuevas no coinciden.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "La nueva contraseña debe ser distinta de la actual.",
    path: ["newPassword"],
  });

export async function changePasswordAction(
  _previousState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const user = await requireUser();
  const session = await getCurrentSession();
  const parsed = changePasswordSchema.safeParse({
    currentPassword: String(formData.get("currentPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Revisa los datos.",
    };
  }

  if (!session) {
    redirect("/login");
  }

  const [account] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!account) {
    return { error: "No se encontró la cuenta." };
  }

  const currentPasswordIsValid = await verifyPassword(
    account.passwordHash,
    parsed.data.currentPassword,
  );

  if (!currentPasswordIsValid) {
    return { error: "La contraseña actual no es correcta." };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);

  await db
    .update(users)
    .set({
      passwordHash,
      mustChangePassword: false,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  await revokeOtherSessions(user.id, session.sessionId);

  redirect("/projects?passwordChanged=1");
}

export async function logoutAction(): Promise<void> {
  await destroyCurrentSession();
  redirect("/login");
}
