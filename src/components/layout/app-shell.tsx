"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/ui/logo";
import type { SessionUser } from "@/lib/auth/types";

import { Sidebar } from "./sidebar";
import type { SidebarProject } from "./types";

const SIDEBAR_WIDTH = 264;

export function AppShell({
  appName,
  user,
  projects,
  children,
}: {
  appName: string;
  user: SessionUser;
  projects: SidebarProject[];
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas">
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden border-r border-border lg:block"
        style={{ width: SIDEBAR_WIDTH }}
      >
        <Sidebar appName={appName} user={user} projects={projects} />
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-canvas/90 px-4 backdrop-blur-md lg:hidden">
        <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
          <Dialog.Trigger asChild>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-hover hover:text-ink"
              aria-label="Abrir menú"
            >
              <Menu className="h-[18px] w-[18px]" />
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=open]:animate-in" />
            <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-[290px] border-r border-border bg-sidebar shadow-float outline-none">
              <Dialog.Title className="sr-only">Navegación</Dialog.Title>
              <Dialog.Description className="sr-only">
                Proyectos y opciones de tu cuenta.
              </Dialog.Description>
              <Sidebar
                appName={appName}
                user={user}
                projects={projects}
                onNavigate={() => setMobileOpen(false)}
              />
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-hover hover:text-ink"
                  aria-label="Cerrar menú"
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        <div className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="text-[13px] font-semibold tracking-tight">
            {appName}
          </span>
        </div>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      <main className="min-h-screen lg:pl-[264px]">{children}</main>
    </div>
  );
}
