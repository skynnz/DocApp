"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-6 py-12">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-danger/15 bg-danger-soft text-danger">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em]">
          Algo salió mal
        </h1>
        <p className="mt-2 text-[13px] leading-6 text-muted">
          No pudimos completar la operación. Vuelve a intentarlo; si el problema
          continúa, revisa los registros del servidor.
        </p>
        {error.digest ? (
          <p className="mt-3 font-mono text-[10px] text-subtle">
            Referencia: {error.digest}
          </p>
        ) : null}
        <Button className="mt-6" onClick={reset}>
          <RotateCcw className="h-3.5 w-3.5" />
          Reintentar
        </Button>
      </div>
    </main>
  );
}
