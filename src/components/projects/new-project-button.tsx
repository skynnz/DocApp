"use client";

import { Plus } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { createProjectAction } from "@/lib/projects/actions";

function SubmitButton({ compact = false }: { compact?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={compact ? "secondary" : "primary"}
      className={compact ? "w-full justify-start" : "w-full justify-start"}
      disabled={pending}
    >
      {pending ? <Spinner /> : <Plus className="h-4 w-4" />}
      {pending ? "Creando…" : "Nuevo proyecto"}
    </Button>
  );
}

export function NewProjectButton({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <form action={createProjectAction}>
      <SubmitButton compact={compact} />
    </form>
  );
}
