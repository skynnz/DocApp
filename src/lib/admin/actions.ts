"use server";

import { z } from "zod";

import { db } from "@/db";
import { users } from "@/db/schema";
import { findUserByEmail } from "@/db/queries/users";
import { hashPassword } from "@/lib/auth/password";
import { requireAdmin } from "@/lib/auth/session";

export type CreateUserState = {
  error?: string;
  success?: string;
};

const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(120, "El nombre es demasiado largo."),
  email: z
    .string()
    .trim()
    .email("Introduce un email válido.")
    .transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(12, "La contraseña temporal debe tener al menos 12 caracteres.")
    .max(200, "La contraseña es demasiado larga."),
  role: z.enum(["admin", "member"]),
});

export async function createUserAction(
  _previousState: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  await requireAdmin();

  const parsed = createUserSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    role: String(formData.get("role") ?? "member"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Revisa los datos.",
    };
  }

  const existing = await findUserByEmail(parsed.data.email);

  if (existing) {
    return { error: "Ya existe un usuario con ese email." };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await db.insert(users).values({
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash,
    role: parsed.data.role,
    mustChangePassword: true,
  });

  return {
    success: `Usuario ${parsed.data.email} creado. Debe cambiar la contraseña al entrar.`,
  };
}
