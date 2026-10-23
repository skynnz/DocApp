import type { Metadata } from "next";
import { ArrowLeft, KeyRound } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/ui/logo";
import { getCurrentUser } from "@/lib/auth/session";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Cambiar contraseña",
};

export default async function ChangePasswordPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-canvas px-6 py-12">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex items-center gap-2.5">
          <Logo />
          <span className="text-sm font-semibold tracking-tight">{APP_NAME}</span>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-soft sm:p-8">
          <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <KeyRound className="h-5 w-5" />
          </div>

          <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.02em]">
            {user.mustChangePassword ? "Elige tu contraseña" : "Cambiar contraseña"}
          </h1>
          <p className="mt-2 text-[13px] leading-6 text-muted">
            {user.mustChangePassword
              ? "Es tu primer acceso. Define una contraseña personal antes de continuar."
              : "Actualiza la contraseña de tu cuenta."}
          </p>

          <div className="mt-6">
            <ChangePasswordForm />
          </div>
        </div>

        {!user.mustChangePassword ? (
          <Link
            href="/projects"
            className="mt-6 inline-flex items-center gap-1.5 text-[12px] text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver a proyectos
          </Link>
        ) : null}
      </div>
    </main>
  );
}
