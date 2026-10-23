"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { JSONContent } from "@tiptap/core";
import {
  EditorContent,
  useEditor,
  useEditorState,
} from "@tiptap/react";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ListTree,
  Loader2,
  Lock,
  RotateCcw,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { DocContent, ProjectSettings } from "@/db/schema";
import { cn, formatCount } from "@/lib/utils";

import { EditorBubbleMenu } from "./bubble-toolbar";
import { DeleteProjectButton } from "./delete-project-button";
import { editorExtensions } from "./extensions";
import { ExportPdfDialog } from "./export-pdf-dialog";
import { ImageInspector } from "./image-inspector";
import { DocumentOutline } from "./outline";
import { EditorToolbar } from "./toolbar";

type SaveStatus = "saved" | "saving" | "dirty" | "error";

type Conflict = {
  revision: number;
  updatedAt: string;
};

type SaveResponse = {
  data: {
    revision: number;
    wordCount: number;
    updatedAt: string;
  };
};

function SaveIndicator({
  status,
  onRetry,
}: {
  status: SaveStatus;
  onRetry: () => void;
}) {
  if (status === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-[11px] text-muted">
        <Loader2 className="h-3 w-3 animate-spin" />
        Guardando…
      </span>
    );
  }

  if (status === "dirty") {
    return (
      <span className="flex items-center gap-1.5 text-[11px] text-subtle">
        <span className="h-1.5 w-1.5 rounded-full bg-warning" />
        Cambios sin guardar
      </span>
    );
  }

  if (status === "error") {
    return (
      <button
        type="button"
        onClick={onRetry}
        className="flex items-center gap-1.5 text-[11px] text-danger transition-opacity hover:opacity-75"
      >
        <AlertCircle className="h-3 w-3" />
        Error al guardar
        <RotateCcw className="h-2.5 w-2.5" />
      </button>
    );
  }

  return (
    <span className="flex items-center gap-1.5 text-[11px] text-muted">
      <Check className="h-3 w-3 text-accent" />
      Guardado
    </span>
  );
}

function EditorSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[820px] px-5 py-12 sm:px-8">
      <div className="h-3 w-24 animate-pulse rounded bg-border" />
      <div className="mt-6 h-10 w-3/4 animate-pulse rounded bg-border" />
      <div className="mt-10 h-px w-full bg-border" />
      <div className="mt-8 space-y-3">
        <div className="h-4 w-full animate-pulse rounded bg-border" />
        <div className="h-4 w-11/12 animate-pulse rounded bg-border" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-border" />
      </div>
    </div>
  );
}

export function DocumentEditor({
  projectId,
  initialTitle,
  initialContent,
  initialRevision,
  initialWordCount,
  settings,
}: {
  projectId: string;
  initialTitle: string;
  initialContent: DocContent;
  initialRevision: number;
  initialWordCount: number;
  settings: ProjectSettings;
}) {
  const editor = useEditor(
    {
      extensions: editorExtensions,
      content: initialContent as JSONContent,
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class: "tiptap",
          spellcheck: "true",
          "aria-label": "Contenido del documento",
        },
      },
    },
    [projectId],
  );

  if (!editor) {
    return <EditorSkeleton />;
  }

  return (
    <EditorWorkspace
      editor={editor}
      projectId={projectId}
      initialTitle={initialTitle}
      initialRevision={initialRevision}
      initialWordCount={initialWordCount}
      settings={settings}
    />
  );
}

function EditorWorkspace({
  editor,
  projectId,
  initialTitle,
  initialRevision,
  initialWordCount,
  settings,
}: {
  editor: NonNullable<ReturnType<typeof useEditor>>;
  projectId: string;
  initialTitle: string;
  initialRevision: number;
  initialWordCount: number;
  settings: ProjectSettings;
}) {
  const router = useRouter();
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const syncedTitleRef = useRef(initialTitle);
  const revisionRef = useRef(initialRevision);
  const titleValueRef = useRef(initialTitle);
  const contentRef = useRef<DocContent>(editor.getJSON() as unknown as DocContent);
  const dirtyRef = useRef(false);
  const changeVersionRef = useRef(0);
  const savingRef = useRef(false);
  const pendingSaveRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef<(() => Promise<void>) | null>(null);

  const [title, setTitle] = useState(initialTitle);
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [wordCount, setWordCount] = useState(initialWordCount);
  const [outlineOpen, setOutlineOpen] = useState(true);
  const [conflict, setConflict] = useState<Conflict | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const liveWords = useEditorState({
    editor,
    selector: ({ editor: current }) =>
      current.storage.characterCount.words(),
  });

  const save = useCallback(async () => {
    if (savingRef.current) {
      pendingSaveRef.current = true;
      return;
    }

    savingRef.current = true;
    pendingSaveRef.current = false;
    const versionAtStart = changeVersionRef.current;
    setStatus("saving");

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: titleValueRef.current.trim() || "Sin título",
          content: contentRef.current,
          revision: revisionRef.current,
        }),
      });

      if (response.status === 409) {
        const payload = (await response.json()) as {
          error?: { details?: Conflict };
        };

        if (payload.error?.details) {
          setConflict(payload.error.details);
        }

        setStatus("error");
        return;
      }

      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }

      const payload = (await response.json()) as SaveResponse;
      revisionRef.current = payload.data.revision;
      setWordCount(payload.data.wordCount);

      const savedTitle = titleValueRef.current.trim() || "Sin título";

      if (savedTitle !== syncedTitleRef.current) {
        syncedTitleRef.current = savedTitle;
        router.refresh();
      }

      if (changeVersionRef.current === versionAtStart) {
        dirtyRef.current = false;
        setStatus("saved");
      } else {
        setStatus("dirty");
        pendingSaveRef.current = true;
      }
    } catch {
      setStatus("error");
    } finally {
      savingRef.current = false;

      if (pendingSaveRef.current) {
        pendingSaveRef.current = false;
        void saveRef.current?.();
      }
    }
  }, [projectId, router]);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const markDirty = useCallback(() => {
    dirtyRef.current = true;
    changeVersionRef.current += 1;
    setStatus("dirty");

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      void saveRef.current?.();
    }, 900);
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      contentRef.current = editor.getJSON() as unknown as DocContent;
      markDirty();
    };

    editor.on("update", handleUpdate);

    return () => {
      editor.off("update", handleUpdate);
    };
  }, [editor, markDirty]);

  useEffect(() => {
    const element = titleRef.current;

    if (!element) {
      return;
    }

    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, [title]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveRef.current?.();
      }
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!dirtyRef.current) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden" && dirtyRef.current) {
        void saveRef.current?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  async function uploadImage(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecciona un archivo de imagen.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("La imagen supera el límite de 10 MB.");
      return;
    }

    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/projects/${projectId}/assets`, {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as
        | { data?: { url?: string }; error?: { message?: string } }
        | null;

      if (!response.ok || !payload?.data?.url) {
        throw new Error(
          payload?.error?.message ?? "No pudimos subir la imagen.",
        );
      }

      editor
        .chain()
        .focus()
        .insertContent({
          type: "image",
          attrs: {
            src: payload.data.url,
            alt: "",
            caption: "",
            width: "100%",
            align: "center",
          },
        })
        .run();

      toast.success("Imagen insertada.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No pudimos subir la imagen.",
      );
    } finally {
      setIsUploadingImage(false);

      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    titleValueRef.current = value;
    markDirty();
  }

  function handleTitleBlur() {
    if (!title.trim()) {
      setTitle("Sin título");
      titleValueRef.current = "Sin título";
      markDirty();
    }
  }

  function overwriteConflict() {
    if (!conflict) {
      return;
    }

    revisionRef.current = conflict.revision;
    setConflict(null);
    markDirty();
    void saveRef.current?.();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-14 z-30 flex h-14 items-center justify-between gap-4 border-b border-border bg-canvas/95 px-4 backdrop-blur-md sm:px-6 lg:top-0">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/projects"
            className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[12px] text-muted transition-colors hover:bg-hover hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Proyectos
          </Link>
          <span className="text-border-strong" aria-hidden="true">
            /
          </span>
          <span className="max-w-[220px] truncate text-[12px] text-subtle">
            {title || "Sin título"}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <SaveIndicator
            status={status}
            onRetry={() => void saveRef.current?.()}
          />
          <span className="hidden h-4 w-px bg-border sm:block" />
          <span className="hidden items-center gap-1.5 text-[11px] text-subtle sm:flex">
            <Lock className="h-3 w-3" />
            Privado
          </span>
          <button
            type="button"
            onClick={() => setOutlineOpen((open) => !open)}
            className={cn(
              "hidden h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-hover hover:text-ink xl:flex",
              outlineOpen && "bg-accent-soft text-accent-strong",
            )}
            title="Esquema del documento"
            aria-label="Esquema del documento"
            aria-pressed={outlineOpen}
          >
            <ListTree className="h-4 w-4" />
          </button>
          <DeleteProjectButton
            projectId={projectId}
            title={title || "Sin título"}
          />
          <ExportPdfDialog
            projectId={projectId}
            title={title || "Sin título"}
            settings={settings}
          />
        </div>
      </header>

      <EditorToolbar
        editor={editor}
        onInsertImage={() => imageInputRef.current?.click()}
        isUploadingImage={isUploadingImage}
      />

      <div className="flex flex-1 justify-center">
        <article className="w-full max-w-[820px] px-5 pb-28 pt-10 sm:px-8 lg:pt-12">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-[10.5px] text-subtle">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Documento
            </span>
            <span>{formatCount(liveWords || wordCount)} palabras</span>
          </div>

          <textarea
            ref={titleRef}
            value={title}
            onChange={(event) => handleTitleChange(event.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                editor.commands.focus("end");
              }
            }}
            rows={1}
            maxLength={200}
            placeholder="Sin título"
            aria-label="Título del documento"
            className="block w-full resize-none overflow-hidden bg-transparent text-[38px] font-semibold leading-[1.12] tracking-[-0.035em] text-ink outline-none placeholder:text-subtle/60 sm:text-[44px]"
          />

          <div className="mt-8 h-px w-full bg-border" />

          <div
            className="doc-editor mt-9"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              const file = Array.from(event.dataTransfer.files).find((item) =>
                item.type.startsWith("image/"),
              );

              if (file) {
                event.preventDefault();
                event.stopPropagation();
                void uploadImage(file);
              }
            }}
            onPaste={(event) => {
              const file = Array.from(event.clipboardData.files).find((item) =>
                item.type.startsWith("image/"),
              );

              if (file) {
                event.preventDefault();
                event.stopPropagation();
                void uploadImage(file);
              }
            }}
          >
            <EditorContent editor={editor} />
          </div>
        </article>

        {outlineOpen ? (
          <DocumentOutline
            editor={editor}
            onClose={() => setOutlineOpen(false)}
          />
        ) : null}
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            void uploadImage(file);
          }
        }}
      />

      <EditorBubbleMenu editor={editor} />
      <ImageInspector editor={editor} />

      <Dialog.Root
        open={Boolean(conflict)}
        onOpenChange={(open) => {
          if (!open) {
            setConflict(null);
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[1px]" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface p-5 shadow-float focus:outline-none">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="text-[15px] font-semibold tracking-[-0.01em]">
                  El documento cambió en otra pestaña
                </Dialog.Title>
                <Dialog.Description className="mt-1.5 text-[12px] leading-5 text-muted">
                  Hay una versión más reciente guardada. Puedes recargar para
                  verla o sobrescribirla con lo que tienes aquí.
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

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Dialog.Close asChild>
                <Button type="button" variant="ghost" size="sm">
                  Cancelar
                </Button>
              </Dialog.Close>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => window.location.reload()}
              >
                Recargar
              </Button>
              <Button type="button" size="sm" onClick={overwriteConflict}>
                Sobrescribir
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
