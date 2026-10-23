import type { Metadata } from "next";
import { Check, Feather, LockKeyhole } from "lucide-react";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/ui/logo";
import { getCurrentUser } from "@/lib/auth/session";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Entrar",
};

const benefits = [
  "Escribe con formato completo, tablas, imágenes y código.",
  "Exporta a PDF con portada, índice y numeración.",
  "Tus proyectos, privados y siempre a mano.",
];

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(user.mustChangePassword ? "/change-password" : "/projects");
  }

  return (
    <main className="relative min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr]">
      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>
      <section className="relative hidden overflow-hidden bg-[#204d44] px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="brand-grid absolute inset-0 opacity-40" />
        <div className="relative flex items-center gap-3">
          <Logo className="bg-white/12 text-white shadow-none" />
          <span className="text-[15px] font-semibold tracking-tight">
            {APP_NAME}
          </span>
        </div>

        <div className="relative max-w-md pb-10">
          <p className="mb-4 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-white/60">
            <Feather className="h-3.5 w-3.5" />
            Documentación sin fricción
          </p>
          <h1 className="text-balance text-[42px] font-semibold leading-[1.08] tracking-[-0.03em]">
            La documentación que da gusto leer.
          </h1>
          <p className="mt-5 max-w-sm text-[15px] leading-7 text-white/70">
            Un espacio tranquilo para convertir ideas, procesos y guías en
            documentos claros y bien terminados.
          </p>

          <ul className="mt-9 space-y-3.5">
            {benefits.map((benefit) => (
              <li
                key={benefit}
                className="flex items-start gap-3 text-[13px] leading-6 text-white/75"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <Check className="h-3 w-3" />
                </span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[11px] text-white/40">
          {APP_NAME} · Tu espacio privado de documentación
        </p>
      </section>

      <section className="flex min-h-screen flex-col bg-canvas">
        <header className="flex items-center gap-2.5 px-6 py-6 lg:hidden">
          <Logo />
          <span className="text-sm font-semibold tracking-tight">{APP_NAME}</span>
        </header>

        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-[360px]">
            <div className="mb-8">
              <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-accent shadow-sm lg:hidden">
                <LockKeyhole className="h-[18px] w-[18px]" />
              </div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-subtle">
                Acceso privado
              </p>
              <h2 className="text-[28px] font-semibold leading-tight tracking-[-0.02em] text-ink">
                Bienvenido de nuevo
              </h2>
              <p className="mt-2 text-[13px] leading-6 text-muted">
                Entra para continuar con tus documentos.
              </p>
            </div>

            <LoginForm />
          </div>
        </div>

        <footer className="px-6 pb-6 text-center text-[11px] text-subtle">
          {APP_NAME} · Un espacio privado para tu documentación
        </footer>
      </section>
    </main>
  );
}
