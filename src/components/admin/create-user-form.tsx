"use client";

import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  createUserAction,
  type CreateUserState,
} from "@/lib/admin/actions";

const initialState: CreateUserState = {};

export function CreateUserForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    createUserAction,
    initialState,
  );

  useEffect(() => {
    if (state.success) {
      toast.success(state.success);
      formRef.current?.reset();
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {state.error ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-md border border-danger/15 bg-danger-soft px-3 py-2.5 text-[12px] leading-5 text-danger"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{state.error}</span>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" placeholder="Ana Martínez" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="ana@empresa.com"
          autoComplete="off"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña temporal</Label>
        <Input
          id="password"
          name="password"
          type="password"
          minLength={12}
          autoComplete="new-password"
          required
        />
        <p className="text-[10.5px] leading-4 text-subtle">
          Mínimo 12 caracteres. La persona deberá cambiarla al entrar.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Rol</Label>
        <select
          id="role"
          name="role"
          defaultValue="member"
          className="h-10 w-full rounded-md border border-border-strong bg-surface px-3 text-sm text-ink shadow-[0_1px_1px_rgba(55,53,47,0.03)] transition-colors hover:border-border-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
        >
          <option value="member">Miembro</option>
          <option value="admin">Administrador</option>
        </select>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Spinner />
            Creando…
          </>
        ) : (
          "Crear usuario"
        )}
      </Button>
    </form>
  );
}
