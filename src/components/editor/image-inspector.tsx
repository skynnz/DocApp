"use client";

import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Image as ImageIcon,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const WIDTHS = ["25%", "50%", "75%", "100%"];

export function ImageInspector({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      isImage: current.isActive("image"),
      position: current.state.selection.from,
      caption: (current.getAttributes("image").caption as string) ?? "",
      alt: (current.getAttributes("image").alt as string) ?? "",
      width: (current.getAttributes("image").width as string) ?? "100%",
      align: (current.getAttributes("image").align as string) ?? "center",
    }),
  });

  if (!state.isImage) {
    return null;
  }

  function updateAttributes(attributes: Record<string, unknown>) {
    editor.commands.updateAttributes("image", attributes);
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-30 w-[calc(100%-2rem)] max-w-[560px] -translate-x-1/2 rounded-xl border border-border bg-surface p-3.5 shadow-float sm:bottom-6">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-soft text-accent">
          <ImageIcon className="h-3.5 w-3.5" />
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">
          Imagen
        </p>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="image-caption"
            className="text-[10.5px] font-medium text-muted"
          >
            Leyenda
          </label>
          <Input
            id="image-caption"
            value={state.caption}
            onChange={(event) =>
              updateAttributes({ caption: event.target.value })
            }
            placeholder="Una leyenda en cursiva"
            className="h-8 text-[12px]"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="image-alt"
            className="text-[10.5px] font-medium text-muted"
          >
            Texto alternativo
          </label>
          <Input
            id="image-alt"
            value={state.alt}
            onChange={(event) => updateAttributes({ alt: event.target.value })}
            placeholder="Describe la imagen"
            className="h-8 text-[12px]"
          />
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {WIDTHS.map((width) => (
            <button
              key={width}
              type="button"
              onClick={() => updateAttributes({ width })}
              className={cn(
                "h-7 rounded-[5px] px-2 text-[10.5px] font-medium text-muted transition-colors hover:bg-hover hover:text-ink",
                state.width === width && "bg-accent-soft text-accent-strong",
              )}
            >
              {width}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-0.5">
          {[
            { value: "left", label: "Izquierda", icon: AlignLeft },
            { value: "center", label: "Centro", icon: AlignCenter },
            { value: "right", label: "Derecha", icon: AlignRight },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              title={label}
              aria-label={label}
              onClick={() => updateAttributes({ align: value })}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-[5px] text-muted transition-colors hover:bg-hover hover:text-ink",
                state.align === value && "bg-accent-soft text-accent-strong",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
