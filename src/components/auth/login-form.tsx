"use client";

import { AlertCircle } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { loginAction, type LoginState } from "@/lib/auth/actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
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

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tu@email.com"
          defaultValue={state.email}
          aria-invalid={Boolean(state.error)}
          required
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="password">Contraseña</Label>
          <span className="text-[11px] text-subtle">
            La gestiona el administrador
          </span>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••••••"
          aria-invalid={Boolean(state.error)}
          required
        />
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Spinner />
            Entrando…
          </>
        ) : (
          "Entrar"
        )}
      </Button>

      <p className="text-center text-[12px] leading-5 text-subtle">
        ¿No puedes entrar? Pide al administrador que restablezca tu contraseña.
      </p>
    </form>
  );
}
