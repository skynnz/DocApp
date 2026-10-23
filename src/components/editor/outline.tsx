"use client";

import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { ListTree, X } from "lucide-react";

import { cn } from "@/lib/utils";

type HeadingItem = {
  level: number;
  text: string;
  pos: number;
};

export function DocumentOutline({
  editor,
  onClose,
}: {
  editor: Editor;
  onClose: () => void;
}) {
  const headings = useEditorState({
    editor,
    selector: ({ editor: current }) => {
      const items: HeadingItem[] = [];

      current.state.doc.descendants((node, pos) => {
        if (node.type.name === "heading") {
          items.push({
            level: Number(node.attrs.level) || 1,
            text: node.textContent.trim() || "Sin título",
            pos,
          });
        }
      });

      return items;
    },
  });

  function goTo(heading: HeadingItem) {
    editor.chain().focus().setTextSelection(heading.pos + 1).run();
    const element = editor.view.nodeDOM(heading.pos);

    if (element instanceof HTMLElement) {
      const top =
        element.getBoundingClientRect().top + window.scrollY - 132;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }

  return (
    <aside className="sticky top-28 hidden max-h-[calc(100vh-9rem)] w-[210px] shrink-0 overflow-y-auto pl-6 xl:block">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-subtle">
          <ListTree className="h-3 w-3" />
          Esquema
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-[5px] text-subtle transition-colors hover:bg-hover hover:text-ink"
          aria-label="Cerrar esquema"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {headings.length === 0 ? (
        <p className="text-[11px] leading-5 text-subtle">
          Añade títulos H1, H2 o H3 para ver el esquema del documento.
        </p>
      ) : (
        <nav aria-label="Esquema del documento" className="space-y-0.5">
          {headings.map((heading) => (
            <button
              key={`${heading.pos}-${heading.text}`}
              type="button"
              onClick={() => goTo(heading)}
              className={cn(
                "block w-full truncate rounded-[5px] py-1 pr-2 text-left text-[11.5px] leading-5 text-muted transition-colors hover:bg-hover hover:text-ink",
                heading.level === 1 && "font-medium text-ink",
                heading.level === 2 && "pl-3",
                heading.level === 3 && "pl-6 text-[11px]",
              )}
              title={heading.text}
            >
              {heading.text}
            </button>
          ))}
        </nav>
      )}
    </aside>
  );
}
