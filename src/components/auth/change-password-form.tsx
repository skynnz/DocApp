"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  changePasswordAction,
  type ChangePasswordState,
} from "@/lib/auth/actions";

const initialState: ChangePasswordState = {};

export function ChangePasswordForm({
  requireCurrentPassword = true,
}: {
  requireCurrentPassword?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    changePasswordAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-md border border-danger/15 bg-danger-soft px-3 py-2.5 text-[13px] leading-5 text-danger"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      ) : null}

      {state.success ? (
        <div className="flex items-start gap-2.5 rounded-md border border-accent/15 bg-accent-soft px-3 py-2.5 text-[13px] leading-5 text-accent-strong">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Contraseña actualizada.</span>
        </div>
      ) : null}

      {requireCurrentPassword ? (
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Contraseña actual</Label>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            autoFocus
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="newPassword">Nueva contraseña</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
        />
        <p className="text-[11px] leading-5 text-subtle">
          Mínimo 12 caracteres. Usa una frase que puedas recordar.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Repite la nueva contraseña</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Spinner />
            Guardando…
          </>
        ) : (
          "Guardar contraseña"
        )}
      </Button>
    </form>
  );
}
