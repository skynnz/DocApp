import { ArrowLeft, FileQuestion } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/ui/logo";
import { buttonClassName } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-6 py-12">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <Logo />
          <span className="text-sm font-semibold tracking-tight">DocApp</span>
        </div>

        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface text-subtle shadow-sm">
          <FileQuestion className="h-5 w-5" />
        </div>

        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">
          Error 404
        </p>
        <h1 className="mt-2 text-[24px] font-semibold tracking-[-0.02em]">
          No encontramos esta página
        </h1>
        <p className="mt-2 text-[13px] leading-6 text-muted">
          Puede que el enlace ya no exista o que el documento se haya eliminado.
        </p>

        <Link
          href="/projects"
          className={buttonClassName({ variant: "secondary", className: "mt-6" })}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a proyectos
        </Link>
      </div>
    </main>
  );
}
