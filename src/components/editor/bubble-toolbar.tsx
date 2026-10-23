"use client";

import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { Bold, Code2, Italic, Strikethrough, Underline } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

function BubbleButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-[5px] text-white/65 transition-colors hover:bg-white/10 hover:text-white",
        active && "bg-white/15 text-white",
      )}
    >
      {children}
    </button>
  );
}

export function EditorBubbleMenu({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current.isActive("bold"),
      italic: current.isActive("italic"),
      underline: current.isActive("underline"),
      strike: current.isActive("strike"),
      code: current.isActive("code"),
    }),
  });

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: "top", offset: 8 }}
      className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-[#2f2f2b] p-1 shadow-float"
    >
      <BubbleButton
        label="Negrita"
        active={state.bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-3.5 w-3.5" />
      </BubbleButton>
      <BubbleButton
        label="Cursiva"
        active={state.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-3.5 w-3.5" />
      </BubbleButton>
      <BubbleButton
        label="Subrayado"
        active={state.underline}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Underline className="h-3.5 w-3.5" />
      </BubbleButton>
      <BubbleButton
        label="Tachado"
        active={state.strike}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </BubbleButton>
      <BubbleButton
        label="Código en línea"
        active={state.code}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code2 className="h-3.5 w-3.5" />
      </BubbleButton>
    </BubbleMenu>
  );
}
