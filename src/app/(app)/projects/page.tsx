import type { Metadata } from "next";
import { ArrowUpRight, FileText, SearchX } from "lucide-react";
import Link from "next/link";

import { NewProjectButton } from "@/components/projects/new-project-button";
import { listProjects } from "@/db/queries/projects";
import { requireUser } from "@/lib/auth/session";
import { formatCount } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export const metadata: Metadata = {
  title: "Proyectos",
};

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const rawQuery = Array.isArray(params.q) ? params.q[0] : params.q;
  const query = rawQuery?.trim() ?? "";
  const projects = await listProjects(user.id, query);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
      <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">
            Biblioteca
          </p>
          <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.025em] text-ink">
            Proyectos
          </h1>
          <p className="mt-1.5 text-[13px] leading-6 text-muted">
            {query
              ? `${projects.length} resultado${projects.length === 1 ? "" : "s"} para “${query}”.`
              : "Tus guías, manuales y documentos, en un solo lugar."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {query ? (
            <Link
              href="/projects"
              className="text-[12px] text-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
            >
              Limpiar búsqueda
            </Link>
          ) : null}
          {projects.length > 0 || query ? (
            <div className="hidden sm:block">
              <NewProjectButton />
            </div>
          ) : null}
        </div>
      </header>

      {projects.length === 0 && !query ? (
        <section className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-border-strong bg-surface/55 px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface text-accent shadow-sm">
            <FileText className="h-5 w-5" />
          </div>
          <h2 className="mt-5 text-[18px] font-semibold tracking-[-0.01em]">
            Tu primer proyecto te espera
          </h2>
          <p className="mt-1.5 max-w-sm text-[13px] leading-6 text-muted">
            Crea un documento en blanco y empieza a darle forma. Después podrás
            exportarlo a PDF con el aspecto que elijas.
          </p>
          <div className="mt-6">
            <NewProjectButton />
          </div>
        </section>
      ) : null}

      {projects.length === 0 && query ? (
        <section className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border-strong bg-surface/55 px-6 py-14 text-center">
          <SearchX className="h-7 w-7 text-subtle" />
          <h2 className="mt-4 text-[16px] font-semibold">
            No encontramos proyectos
          </h2>
          <p className="mt-1.5 max-w-sm text-[13px] leading-6 text-muted">
            Prueba con otra palabra o vuelve a la biblioteca completa.
          </p>
          <Link
            href="/projects"
            className="mt-5 text-[12px] font-medium text-accent underline-offset-4 hover:underline"
          >
            Ver todos los proyectos
          </Link>
        </section>
      ) : null}

      {projects.length > 0 ? (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="group relative flex min-h-[156px] flex-col rounded-lg border border-border bg-surface p-4 shadow-[0_1px_2px_rgba(55,53,47,0.03)] transition-all duration-150 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-soft"
            >
              <div className="flex items-start justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent-soft text-accent">
                  <FileText className="h-4 w-4" />
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 text-subtle opacity-0 transition-opacity group-hover:opacity-100" />
              </div>

              <h2 className="mt-4 line-clamp-2 text-[14px] font-medium leading-5 text-ink">
                {project.title}
              </h2>

              <div className="mt-auto flex items-center gap-2 pt-4 text-[10.5px] text-subtle">
                <span>
                  {formatDistanceToNow(project.updatedAt, {
                    addSuffix: true,
                    locale: es,
                  })}
                </span>
                <span aria-hidden="true">·</span>
                <span>{formatCount(project.wordCount)} palabras</span>
              </div>
            </Link>
          ))}

          <div className="flex min-h-[156px] flex-col items-center justify-center rounded-lg border border-dashed border-border-strong bg-transparent p-4 text-center sm:hidden">
            <NewProjectButton />
          </div>
        </section>
      ) : null}
    </div>
  );
}
