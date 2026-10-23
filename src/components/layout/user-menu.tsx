"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  ChevronDown,
  KeyRound,
  Loader2,
  LogOut,
  Settings,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";

import { logoutAction } from "@/lib/auth/actions";
import type { SessionUser } from "@/lib/auth/types";
import { cn, initials } from "@/lib/utils";

const itemClassName =
  "flex cursor-pointer select-none items-center gap-2.5 rounded-[5px] px-2.5 py-2 text-[13px] text-ink outline-none transition-colors data-[highlighted]:bg-hover";

export function UserMenu({ user }: { user: SessionUser }) {
  const [isLoggingOut, startLogout] = useTransition();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-hover-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          aria-label="Menú de usuario"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-avatar text-[11px] font-semibold text-avatar-ink">
            {initials(user.name)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-medium leading-4 text-ink">
              {user.name}
            </span>
            <span className="block truncate text-[10px] leading-4 text-subtle">
              {user.email}
            </span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-subtle" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="top"
          align="start"
          sideOffset={8}
          className="z-50 w-[236px] rounded-lg border border-border bg-surface p-1.5 shadow-float"
        >
          <div className="px-2.5 py-2">
            <p className="truncate text-[12px] font-medium text-ink">
              {user.name}
            </p>
            <p className="truncate text-[11px] text-subtle">{user.email}</p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          <DropdownMenu.Item asChild>
            <Link href="/settings" className={itemClassName}>
              <Settings className="h-3.5 w-3.5 text-muted" />
              Ajustes
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Item asChild>
            <Link href="/change-password" className={itemClassName}>
              <KeyRound className="h-3.5 w-3.5 text-muted" />
              Cambiar contraseña
            </Link>
          </DropdownMenu.Item>

          {user.role === "admin" ? (
            <DropdownMenu.Item asChild>
              <Link href="/admin/users" className={itemClassName}>
                <Shield className="h-3.5 w-3.5 text-muted" />
                Administración
              </Link>
            </DropdownMenu.Item>
          ) : null}

          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          <DropdownMenu.Item
            onSelect={() => {
              startLogout(() => {
                void logoutAction();
              });
            }}
            className={cn(itemClassName, "text-danger")}
          >
            {isLoggingOut ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <LogOut className="h-3.5 w-3.5" />
            )}
            Cerrar sesión
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
