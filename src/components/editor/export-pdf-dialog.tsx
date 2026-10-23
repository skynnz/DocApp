"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Download, FileText, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import type { ProjectSettings } from "@/db/schema";
import {
  DEFAULT_PDF_OPTIONS,
  type PdfExportOptions,
} from "@/lib/pdf/types";
import { cn } from "@/lib/utils";

function initialOptions(settings: ProjectSettings | undefined): PdfExportOptions {
  return {
    ...DEFAULT_PDF_OPTIONS,
    pageSize: settings?.pageSize ?? DEFAULT_PDF_OPTIONS.pageSize,
    orientation: settings?.orientation ?? DEFAULT_PDF_OPTIONS.orientation,
    includeCover:
      settings?.includeCover ?? DEFAULT_PDF_OPTIONS.includeCover,
    coverSubtitle:
      settings?.coverSubtitle ?? DEFAULT_PDF_OPTIONS.coverSubtitle,
    includeToc: settings?.includeToc ?? DEFAULT_PDF_OPTIONS.includeToc,
    tocDepth: settings?.tocDepth ?? DEFAULT_PDF_OPTIONS.tocDepth,
    includeHeader:
      settings?.includeHeader ?? DEFAULT_PDF_OPTIONS.includeHeader,
    includeFooter:
      settings?.includeFooter ?? DEFAULT_PDF_OPTIONS.includeFooter,
    includePageNumbers:
      settings?.includePageNumbers ??
      DEFAULT_PDF_OPTIONS.includePageNumbers,
    includeDate: settings?.includeDate ?? DEFAULT_PDF_OPTIONS.includeDate,
  };
}

function OptionRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
        checked
          ? "border-accent/25 bg-accent-soft/55"
          : "border-border bg-surface hover:bg-canvas",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[#2f6f62]"
      />
      <span>
        <span className="block text-[12px] font-medium leading-5 text-ink">
          {title}
        </span>
        <span className="block text-[10.5px] leading-4 text-subtle">
          {description}
        </span>
      </span>
    </label>
  );
}

export function ExportPdfDialog({
  projectId,
  title,
  settings,
}: {
  projectId: string;
  title: string;
  settings: ProjectSettings | undefined;
}) {
  const defaults = useMemo(() => initialOptions(settings), [settings]);
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<PdfExportOptions>(defaults);
  const [isExporting, setIsExporting] = useState(false);

  function update<K extends keyof PdfExportOptions>(
    key: K,
    value: PdfExportOptions[K],
  ) {
    setOptions((current) => ({ ...current, [key]: value }));
  }

  async function exportPdf() {
    setIsExporting(true);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/export/pdf`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(options),
        },
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null;
        throw new Error(
          payload?.error?.message ?? "No pudimos generar el PDF.",
        );
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="([^"]+)"/);
      const filename = filenameMatch?.[1] ?? `${title || "documento"}.pdf`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      toast.success("PDF generado.");
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No pudimos generar el PDF.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="secondary" size="sm">
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Exportar PDF</span>
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[1px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-surface p-5 shadow-float focus:outline-none sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <FileText className="h-4 w-4" />
              </span>
              <div>
                <Dialog.Title className="text-[16px] font-semibold tracking-[-0.01em]">
                  Exportar a PDF
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-[12px] leading-5 text-muted">
                  Elige cómo quieres que se vea el documento final.
                </Dialog.Description>
              </div>
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

          <div className="mt-5 space-y-4">
            <section>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-subtle">
                Página
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="pdf-size" className="text-[11px] text-muted">
                    Tamaño
                  </Label>
                  <select
                    id="pdf-size"
                    value={options.pageSize}
                    onChange={(event) =>
                      update(
                        "pageSize",
                        event.target.value as PdfExportOptions["pageSize"],
                      )
                    }
                    className="h-9 w-full rounded-md border border-border-strong bg-surface px-2.5 text-[12px] text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
                  >
                    <option value="A4">A4</option>
                    <option value="Letter">Carta</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="pdf-orientation"
                    className="text-[11px] text-muted"
                  >
                    Orientación
                  </Label>
                  <select
                    id="pdf-orientation"
                    value={options.orientation}
                    onChange={(event) =>
                      update(
                        "orientation",
                        event.target
                          .value as PdfExportOptions["orientation"],
                      )
                    }
                    className="h-9 w-full rounded-md border border-border-strong bg-surface px-2.5 text-[12px] text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
                  >
                    <option value="portrait">Vertical</option>
                    <option value="landscape">Horizontal</option>
                  </select>
                </div>
              </div>
            </section>

            <section>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-subtle">
                Estructura
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <OptionRow
                  title="Portada"
                  description="Título, autor y fecha."
                  checked={options.includeCover}
                  onChange={(checked) => update("includeCover", checked)}
                />
                <OptionRow
                  title="Índice"
                  description="Secciones y números de página."
                  checked={options.includeToc}
                  onChange={(checked) => update("includeToc", checked)}
                />
              </div>

              {options.includeCover ? (
                <div className="mt-3 space-y-1.5">
                  <Label htmlFor="pdf-subtitle" className="text-[11px] text-muted">
                    Subtítulo de portada
                  </Label>
                  <Input
                    id="pdf-subtitle"
                    value={options.coverSubtitle}
                    onChange={(event) =>
                      update("coverSubtitle", event.target.value)
                    }
                    placeholder="Opcional"
                    className="h-9 text-[12px]"
                    maxLength={200}
                  />
                </div>
              ) : null}

              {options.includeToc ? (
                <div className="mt-3 space-y-1.5">
                  <Label htmlFor="pdf-toc-depth" className="text-[11px] text-muted">
                    Profundidad del índice
                  </Label>
                  <select
                    id="pdf-toc-depth"
                    value={options.tocDepth}
                    onChange={(event) =>
                      update(
                        "tocDepth",
                        event.target.value as PdfExportOptions["tocDepth"],
                      )
                    }
                    className="h-9 w-full rounded-md border border-border-strong bg-surface px-2.5 text-[12px] text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
                  >
                    <option value="h1-h2">Títulos 1 y 2</option>
                    <option value="h1">Solo títulos 1</option>
                  </select>
                </div>
              ) : null}
            </section>

            <section>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-subtle">
                Presentación
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <OptionRow
                  title="Encabezado"
                  description="Título en cada página."
                  checked={options.includeHeader}
                  onChange={(checked) => update("includeHeader", checked)}
                />
                <OptionRow
                  title="Pie de página"
                  description="Nombre de la app."
                  checked={options.includeFooter}
                  onChange={(checked) => update("includeFooter", checked)}
                />
                <OptionRow
                  title="Numeración"
                  description="Página X de Y."
                  checked={options.includePageNumbers}
                  onChange={(checked) =>
                    update("includePageNumbers", checked)
                  }
                />
                <OptionRow
                  title="Fecha"
                  description="En portada y pie."
                  checked={options.includeDate}
                  onChange={(checked) => update("includeDate", checked)}
                />
              </div>
            </section>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Dialog.Close asChild>
              <Button type="button" variant="ghost" size="sm">
                Cancelar
              </Button>
            </Dialog.Close>
            <Button
              type="button"
              size="sm"
              onClick={() => void exportPdf()}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Spinner />
                  Generando…
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  Descargar PDF
                </>
              )}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
