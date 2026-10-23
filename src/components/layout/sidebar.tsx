"use client";

import { FileText, Search, SunMoon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NewProjectButton } from "@/components/projects/new-project-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/ui/logo";
import type { SessionUser } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

import type { SidebarProject } from "./types";
import { UserMenu } from "./user-menu";

export function Sidebar({
  appName,
  user,
  projects,
  onNavigate,
}: {
  appName: string;
  user: SessionUser;
  projects: SidebarProject[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-full flex-col bg-sidebar">
      <div className="px-3 pb-2 pt-4">
        <Link
          href="/projects"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[14px] font-semibold tracking-tight text-ink transition-colors hover:bg-hover-subtle"
        >
          <Logo size="sm" />
          <span className="truncate">{appName}</span>
        </Link>
      </div>

      <div className="px-3 pb-2 pt-2">
        <NewProjectButton />
      </div>

      <div className="px-3 pb-2 pt-1">
        <form
          action="/projects"
          method="get"
          onSubmit={() => onNavigate?.()}
          className="relative"
        >
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle" />
          <input
            name="q"
            type="search"
            placeholder="Buscar proyectos…"
            aria-label="Buscar proyectos"
            className="h-8 w-full rounded-md border border-transparent bg-hover-subtle pl-8 pr-2.5 text-[12px] text-ink outline-none transition-colors placeholder:text-subtle hover:bg-hover focus:border-border-strong focus:bg-surface focus:ring-2 focus:ring-accent/10"
          />
        </form>
      </div>

      <div className="scrollbar-subtle flex-1 overflow-y-auto px-2 pb-3">
        <div className="flex items-center justify-between px-2 pb-1.5 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-subtle">
            Proyectos
          </p>
          <span className="text-[10px] tabular-nums text-subtle">
            {projects.length}
          </span>
        </div>

        {projects.length === 0 ? (
          <div className="px-2 py-6 text-center">
            <FileText className="mx-auto h-5 w-5 text-subtle/70" />
            <p className="mt-2 text-[11px] leading-5 text-subtle">
              Todavía no hay proyectos.
            </p>
          </div>
        ) : (
          <nav aria-label="Proyectos" className="space-y-0.5">
            {projects.map((project) => {
              const href = `/projects/${project.id}`;
              const isActive = pathname === href;

              return (
                <Link
                  key={project.id}
                  href={href}
                  onClick={onNavigate}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-[5px] px-2 py-[6px] text-[12.5px] transition-colors",
                    isActive
                      ? "bg-hover-strong font-medium text-ink"
                      : "text-muted hover:bg-hover-subtle hover:text-ink",
                  )}
                >
                  <FileText
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      isActive ? "text-accent" : "text-subtle",
                    )}
                  />
                  <span className="truncate">{project.title}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      <div className="border-t border-border p-2">
        <div className="flex items-center justify-between px-2 py-1">
          <span className="flex items-center gap-2 text-[11px] text-subtle">
            <SunMoon className="h-3.5 w-3.5" />
            Tema
          </span>
          <ThemeToggle />
        </div>
        <UserMenu user={user} />
      </div>
    </div>
  );
}
