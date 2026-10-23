import type { Metadata } from "next";
import { Shield, ShieldCheck, UserRound, Users } from "lucide-react";

import { CreateUserForm } from "@/components/admin/create-user-form";
import { listUsers } from "@/db/queries/users";
import { requireAdmin } from "@/lib/auth/session";
import { initials } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Usuarios",
};

export default async function AdminUsersPage() {
  await requireAdmin();
  const users = await listUsers();

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
      <header className="mb-8">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">
          Administración
        </p>
        <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.025em]">
          Usuarios
        </h1>
        <p className="mt-1.5 text-[13px] leading-6 text-muted">
          Crea las cuentas del equipo y consulta quién tiene acceso.
        </p>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-[340px_1fr]">
        <section className="rounded-xl border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(55,53,47,0.03)]">
          <div className="mb-5 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-soft text-accent">
              <UserRound className="h-3.5 w-3.5" />
            </span>
            <div>
              <h2 className="text-[13px] font-semibold">Nuevo usuario</h2>
              <p className="text-[10.5px] text-subtle">
                Recibirá una contraseña temporal.
              </p>
            </div>
          </div>
          <CreateUserForm />
        </section>

        <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-[0_1px_2px_rgba(55,53,47,0.03)]">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted" />
              <h2 className="text-[13px] font-semibold">Cuentas</h2>
            </div>
            <span className="rounded-full bg-canvas px-2 py-0.5 text-[10.5px] tabular-nums text-muted">
              {users.length}
            </span>
          </div>

          <ul className="divide-y divide-border">
            {users.map((account) => (
              <li
                key={account.id}
                className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-avatar text-[10px] font-semibold text-avatar-ink">
                    {initials(account.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-medium text-ink">
                      {account.name}
                    </p>
                    <p className="truncate text-[11px] text-subtle">
                      {account.email}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pl-11 sm:justify-end sm:pl-0">
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-canvas px-2 py-0.5 text-[10px] font-medium text-muted">
                    {account.role === "admin" ? (
                      <ShieldCheck className="h-2.5 w-2.5" />
                    ) : (
                      <Shield className="h-2.5 w-2.5" />
                    )}
                    {account.role === "admin" ? "Admin" : "Miembro"}
                  </span>
                  {account.mustChangePassword ? (
                    <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-medium text-warning">
                      Cambio pendiente
                    </span>
                  ) : null}
                  {!account.isActive ? (
                    <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[10px] font-medium text-danger">
                      Inactivo
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
