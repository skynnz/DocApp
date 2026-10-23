"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { Editor } from "@tiptap/react";
import { Link2, Trash2, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function normalizeUrl(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (/^(https?:\/\/|mailto:)/i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export function LinkDialog({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const isActive = editor.isActive("link");

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      setUrl(editor.getAttributes("link").href ?? "");
      setError(null);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeUrl(url);

    if (!normalized) {
      setError("Escribe una dirección.");
      return;
    }

    try {
      const { from, to } = editor.state.selection;

      if (from === to && !isActive) {
        editor
          .chain()
          .focus()
          .insertContent({
            type: "text",
            text: normalized,
            marks: [{ type: "link", attrs: { href: normalized } }],
          })
          .run();
      } else {
        editor
          .chain()
          .focus()
          .extendMarkRange("link")
          .setLink({ href: normalized })
          .run();
      }

      setOpen(false);
    } catch {
      setError("No se pudo aplicar el enlace.");
    }
  }

  function removeLink() {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setOpen(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          title="Enlace"
          aria-label="Enlace"
          onMouseDown={(event) => event.preventDefault()}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-[5px] text-muted transition-colors hover:bg-hover hover:text-ink data-[state=open]:bg-hover-strong data-[state=open]:text-ink",
            isActive && "bg-accent-soft text-accent-strong",
          )}
        >
          <Link2 className="h-3.5 w-3.5" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[1px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface p-5 shadow-float focus:outline-none">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-[15px] font-semibold tracking-[-0.01em]">
                {isActive ? "Editar enlace" : "Insertar enlace"}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-[12px] leading-5 text-muted">
                Usa una URL completa o un correo con `mailto:`.
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

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="link-url">Dirección</Label>
              <Input
                id="link-url"
                value={url}
                onChange={(event) => {
                  setUrl(event.target.value);
                  setError(null);
                }}
                placeholder="https://ejemplo.com"
                autoFocus
              />
              {error ? (
                <p className="text-[11px] text-danger">{error}</p>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              {isActive ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeLink}
                  className="text-danger hover:text-danger"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Quitar
                </Button>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-2">
                <Dialog.Close asChild>
                  <Button type="button" variant="ghost" size="sm">
                    Cancelar
                  </Button>
                </Dialog.Close>
                <Button type="submit" size="sm">
                  Aplicar
                </Button>
              </div>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
