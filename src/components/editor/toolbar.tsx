"use client";

import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Baseline,
  Bold,
  Code2,
  Highlighter,
  ImagePlus,
  Italic,
  List,
  Loader2,
  ListOrdered,
  ListTodo,
  Minus,
  RemoveFormatting,
  Redo2,
  Strikethrough,
  Subscript,
  Superscript,
  Underline,
  Undo2,
} from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { ColorMenu, HIGHLIGHT_COLORS } from "./color-menu";
import { LinkDialog } from "./link-dialog";
import { TableMenu } from "./table-menu";

const CODE_LANGUAGES = [
  ["plaintext", "Texto"],
  ["typescript", "TypeScript"],
  ["javascript", "JavaScript"],
  ["python", "Python"],
  ["bash", "Bash"],
  ["json", "JSON"],
  ["sql", "SQL"],
  ["html", "HTML"],
  ["css", "CSS"],
  ["yaml", "YAML"],
  ["go", "Go"],
  ["java", "Java"],
  ["csharp", "C#"],
  ["markdown", "Markdown"],
] as const;

function ToolButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px] text-muted transition-colors",
        "hover:bg-hover hover:text-ink disabled:pointer-events-none disabled:opacity-35",
        active && "bg-accent-soft text-accent-strong",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-0.5 h-4 w-px shrink-0 bg-border" />;
}

const selectClass =
  "h-7 shrink-0 cursor-pointer rounded-[5px] border-0 bg-transparent px-1.5 text-[11.5px] font-medium text-muted outline-none transition-colors hover:bg-hover hover:text-ink focus:bg-hover focus:ring-0";

export function EditorToolbar({
  editor,
  onInsertImage,
  isUploadingImage,
}: {
  editor: Editor;
  onInsertImage?: () => void;
  isUploadingImage?: boolean;
}) {
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current.isActive("bold"),
      italic: current.isActive("italic"),
      underline: current.isActive("underline"),
      strike: current.isActive("strike"),
      code: current.isActive("code"),
      superscript: current.isActive("superscript"),
      subscript: current.isActive("subscript"),
      bulletList: current.isActive("bulletList"),
      orderedList: current.isActive("orderedList"),
      taskList: current.isActive("taskList"),
      blockquote: current.isActive("blockquote"),
      codeBlock: current.isActive("codeBlock"),
      inTable: current.isActive("table"),
      link: current.isActive("link"),
      block: current.isActive("heading", { level: 1 })
        ? "h1"
        : current.isActive("heading", { level: 2 })
          ? "h2"
          : current.isActive("heading", { level: 3 })
            ? "h3"
            : current.isActive("blockquote")
              ? "blockquote"
              : current.isActive("codeBlock")
                ? "codeBlock"
                : "paragraph",
      align: current.isActive({ textAlign: "center" })
        ? "center"
        : current.isActive({ textAlign: "right" })
          ? "right"
          : current.isActive({ textAlign: "justify" })
            ? "justify"
            : "left",
      fontFamily: (current.getAttributes("textStyle").fontFamily as string) ?? "",
      fontSize: (current.getAttributes("textStyle").fontSize as string) ?? "",
      lineHeight: (current.getAttributes("textStyle").lineHeight as string) ?? "",
      color: (current.getAttributes("textStyle").color as string) ?? "",
      highlight: (current.getAttributes("highlight").color as string) ?? "",
      codeLanguage:
        (current.getAttributes("codeBlock").language as string) ?? "plaintext",
      canUndo: current.can().undo(),
      canRedo: current.can().redo(),
    }),
  });

  function setBlock(value: string) {
    const chain = editor.chain().focus();

    if (value === "paragraph") {
      chain.setParagraph().run();
      return;
    }

    if (value === "h1" || value === "h2" || value === "h3") {
      chain
        .toggleHeading({ level: Number(value.slice(1)) as 1 | 2 | 3 })
        .run();
      return;
    }

    if (value === "blockquote") {
      chain.toggleBlockquote().run();
      return;
    }

    if (value === "codeBlock") {
      chain.toggleCodeBlock().run();
    }
  }

  return (
    <div className="sticky top-28 z-20 border-b border-border bg-canvas/95 backdrop-blur-md lg:top-14">
      <div className="mx-auto flex max-w-[1080px] flex-wrap items-center gap-0.5 px-3 py-1.5">
        <select
          aria-label="Tipo de bloque"
          value={state.block}
          onChange={(event) => setBlock(event.target.value)}
          className={cn(selectClass, "w-[92px]")}
        >
          <option value="paragraph">Párrafo</option>
          <option value="h1">Título 1</option>
          <option value="h2">Título 2</option>
          <option value="h3">Título 3</option>
          <option value="blockquote">Cita</option>
          <option value="codeBlock">Código</option>
        </select>

        <Divider />

        <ToolButton
          label="Deshacer"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!state.canUndo}
        >
          <Undo2 className="h-3.5 w-3.5" />
        </ToolButton>
        <ToolButton
          label="Rehacer"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!state.canRedo}
        >
          <Redo2 className="h-3.5 w-3.5" />
        </ToolButton>

        <Divider />

        <ToolButton
          label="Negrita"
          active={state.bold}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolButton>
        <ToolButton
          label="Cursiva"
          active={state.italic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolButton>
        <ToolButton
          label="Subrayado"
          active={state.underline}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Underline className="h-3.5 w-3.5" />
        </ToolButton>
        <ToolButton
          label="Tachado"
          active={state.strike}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolButton>
        <ToolButton
          label="Código en línea"
          active={state.code}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code2 className="h-3.5 w-3.5" />
        </ToolButton>

        <Divider />

        <select
          aria-label="Fuente"
          value={state.fontFamily}
          onChange={(event) => {
            const value = event.target.value;
            if (value) {
              editor.chain().focus().setFontFamily(value).run();
            } else {
              editor.chain().focus().unsetFontFamily().run();
            }
          }}
          className={cn(selectClass, "w-[104px]")}
        >
          <option value="">Fuente</option>
          <option value="Inter">Inter</option>
          <option value="Source Serif 4">Source Serif</option>
          <option value="Lora">Lora</option>
          <option value="JetBrains Mono">JetBrains Mono</option>
          <option value="Georgia">Georgia</option>
          <option value="Arial">Arial</option>
        </select>

        <select
          aria-label="Tamaño de fuente"
          value={state.fontSize.replace("px", "")}
          onChange={(event) => {
            const value = event.target.value;
            if (value) {
              editor.chain().focus().setFontSize(`${value}px`).run();
            } else {
              editor.chain().focus().unsetFontSize().run();
            }
          }}
          className={cn(selectClass, "w-[78px]")}
        >
          <option value="">Tamaño</option>
          {[12, 14, 16, 18, 20, 24, 28, 32].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>

        <select
          aria-label="Altura de línea"
          value={state.lineHeight}
          onChange={(event) => {
            const value = event.target.value;
            if (value) {
              editor.chain().focus().setLineHeight(value).run();
            } else {
              editor.chain().focus().unsetLineHeight().run();
            }
          }}
          className={cn(selectClass, "w-[54px]")}
          title="Altura de línea"
        >
          <option value="">¶</option>
          <option value="1.2">1.2</option>
          <option value="1.4">1.4</option>
          <option value="1.6">1.6</option>
          <option value="1.8">1.8</option>
          <option value="2">2.0</option>
        </select>

        <ColorMenu
          label="Color de texto"
          color={state.color}
          icon={<Baseline className="h-3.5 w-3.5" />}
          onChange={(color) => editor.chain().focus().setColor(color).run()}
          onClear={() => editor.chain().focus().unsetColor().run()}
        />
        <ColorMenu
          label="Fondo"
          color={state.highlight}
          colors={HIGHLIGHT_COLORS}
          icon={<Highlighter className="h-3.5 w-3.5" />}
          onChange={(color) =>
            editor.chain().focus().setHighlight({ color }).run()
          }
          onClear={() => editor.chain().focus().unsetHighlight().run()}
        />

        <Divider />

        <ToolButton
          label="Alinear a la izquierda"
          active={state.align === "left"}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolButton>
        <ToolButton
          label="Centrar"
          active={state.align === "center"}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolButton>
        <ToolButton
          label="Alinear a la derecha"
          active={state.align === "right"}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight className="h-3.5 w-3.5" />
        </ToolButton>
        <ToolButton
          label="Justificar"
          active={state.align === "justify"}
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        >
          <AlignJustify className="h-3.5 w-3.5" />
        </ToolButton>

        <Divider />

        <ToolButton
          label="Lista con viñetas"
          active={state.bulletList}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-3.5 w-3.5" />
        </ToolButton>
        <ToolButton
          label="Lista numerada"
          active={state.orderedList}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolButton>
        <ToolButton
          label="Lista de tareas"
          active={state.taskList}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          <ListTodo className="h-3.5 w-3.5" />
        </ToolButton>
        <ToolButton
          label="Cita"
          active={state.blockquote}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <span className="text-[15px] font-semibold leading-none">”</span>
        </ToolButton>

        <Divider />

        <TableMenu editor={editor} />
        <ToolButton
          label={isUploadingImage ? "Subiendo imagen…" : "Insertar imagen"}
          onClick={() => onInsertImage?.()}
          disabled={!onInsertImage || isUploadingImage}
        >
          {isUploadingImage ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ImagePlus className="h-3.5 w-3.5" />
          )}
        </ToolButton>
        <LinkDialog editor={editor} />
        <ToolButton
          label="Bloque de código"
          active={state.codeBlock}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code2 className="h-3.5 w-3.5" />
        </ToolButton>
        <ToolButton
          label="Separador"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="h-3.5 w-3.5" />
        </ToolButton>

        <Divider />

        <ToolButton
          label="Superíndice"
          active={state.superscript}
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
        >
          <Superscript className="h-3.5 w-3.5" />
        </ToolButton>
        <ToolButton
          label="Subíndice"
          active={state.subscript}
          onClick={() => editor.chain().focus().toggleSubscript().run()}
        >
          <Subscript className="h-3.5 w-3.5" />
        </ToolButton>
        <ToolButton
          label="Limpiar formato"
          onClick={() =>
            editor.chain().focus().unsetAllMarks().clearNodes().run()
          }
        >
          <RemoveFormatting className="h-3.5 w-3.5" />
        </ToolButton>

        {state.codeBlock ? (
          <>
            <Divider />
            <select
              aria-label="Lenguaje del bloque de código"
              value={state.codeLanguage}
              onChange={(event) =>
                editor
                  .chain()
                  .focus()
                  .updateAttributes("codeBlock", {
                    language: event.target.value,
                  })
                  .run()
              }
              className={cn(selectClass, "w-[92px]")}
            >
              {CODE_LANGUAGES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </>
        ) : null}
      </div>
    </div>
  );
}
