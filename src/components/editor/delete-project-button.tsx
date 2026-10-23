"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DeleteProjectButton({
  projectId,
  title,
}: {
  projectId: string;
  title: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  async function deleteProject() {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null;
        throw new Error(
          payload?.error?.message ?? "No pudimos eliminar el proyecto.",
        );
      }

      toast.success("Proyecto eliminado.");
      router.push("/projects");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No pudimos eliminar el proyecto.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          title="Eliminar proyecto"
          aria-label="Eliminar proyecto"
          className="flex h-8 w-8 items-center justify-center rounded-md text-subtle transition-colors hover:bg-danger-soft hover:text-danger"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/25 backdrop-blur-[1px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface p-5 shadow-float focus:outline-none">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-[15px] font-semibold tracking-[-0.01em]">
                Eliminar proyecto
              </Dialog.Title>
              <Dialog.Description className="mt-1.5 text-[12px] leading-5 text-muted">
                Se eliminarán el documento y sus imágenes. Esta acción no se
                puede deshacer.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-subtle transition-colors hover:bg-hover hover:text-ink"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-[11px] leading-5 text-muted">
              Escribe <strong className="font-semibold text-ink">{title}</strong>{" "}
              para confirmar.
            </p>
            <Input
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder={title}
              autoFocus
            />
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Dialog.Close asChild>
              <Button type="button" variant="ghost" size="sm">
                Cancelar
              </Button>
            </Dialog.Close>
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={confirmation !== title || isDeleting}
              onClick={() => void deleteProject()}
            >
              {isDeleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Eliminar
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
