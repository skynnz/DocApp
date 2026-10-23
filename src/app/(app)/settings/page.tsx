import type { Metadata } from "next";
import { KeyRound, LogOut, Shield, UserRound } from "lucide-react";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button, buttonClassName } from "@/components/ui/button";
import { logoutAction } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/session";
import { APP_NAME } from "@/lib/constants";
import { initials } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ajustes",
};

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
      <header className="mb-8">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">
          Cuenta
        </p>
        <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.025em]">
          Ajustes
        </h1>
        <p className="mt-1.5 text-[13px] leading-6 text-muted">
          Tu perfil y las opciones de acceso.
        </p>
      </header>

      <div className="space-y-4">
        <section className="rounded-xl border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(55,53,47,0.03)] sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-avatar text-[13px] font-semibold text-avatar-ink">
                {initials(user.name)}
              </span>
              <div>
                <p className="text-[14px] font-medium text-ink">{user.name}</p>
                <p className="mt-0.5 text-[12px] text-muted">{user.email}</p>
              </div>
            </div>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-canvas px-2.5 py-1 text-[10.5px] font-medium text-muted">
              <Shield className="h-3 w-3" />
              {user.role === "admin" ? "Administrador" : "Miembro"}
            </span>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(55,53,47,0.03)] sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[13px] font-semibold text-ink">Apariencia</h2>
              <p className="mt-1 text-[12px] leading-5 text-muted">
                Cambia entre modo claro y oscuro.
              </p>
            </div>
            <ThemeToggle className="h-8 w-8 border border-border bg-canvas" />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(55,53,47,0.03)] sm:p-6">
          <h2 className="text-[13px] font-semibold text-ink">Seguridad</h2>
          <p className="mt-1 text-[12px] leading-5 text-muted">
            Cambia tu contraseña cuando lo necesites. Se cerrarán las sesiones
            abiertas en otros dispositivos.
          </p>
          <div className="mt-4">
            <Link
              href="/change-password"
              className={buttonClassName({ variant: "secondary", size: "sm" })}
            >
              <KeyRound className="h-3.5 w-3.5" />
              Cambiar contraseña
            </Link>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(55,53,47,0.03)] sm:p-6">
          <h2 className="text-[13px] font-semibold text-ink">Sesión</h2>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12px] leading-5 text-muted">
              Has iniciado sesión como {user.email}.
            </p>
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" size="sm">
                <LogOut className="h-3.5 w-3.5" />
                Cerrar sesión
              </Button>
            </form>
          </div>
        </section>

        <section className="flex items-start gap-3 rounded-xl border border-border bg-canvas px-5 py-4 text-[11.5px] leading-5 text-muted sm:px-6">
          <UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-subtle" />
          <p>
            {APP_NAME} es un espacio privado. Tus proyectos solo son visibles
            para ti; el administrador no puede abrirlos desde la aplicación.
          </p>
        </section>
      </div>
    </div>
  );
}
