"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import type { Editor } from "@tiptap/react";
import {
  BetweenHorizontalStart,
  BetweenVerticalStart,
  Columns3,
  Grid2X2,
  Merge,
  Rows3,
  Split,
  Table2,
  Trash2,
} from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const itemClass =
  "flex cursor-pointer select-none items-center gap-2 rounded-[5px] px-2 py-1.5 text-[12px] text-ink outline-none transition-colors data-[highlighted]:bg-hover data-[disabled]:pointer-events-none data-[disabled]:opacity-40";

function Item({
  children,
  onSelect,
  disabled,
}: {
  children: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
}) {
  return (
    <DropdownMenu.Item
      disabled={disabled}
      onSelect={onSelect}
      className={itemClass}
    >
      {children}
    </DropdownMenu.Item>
  );
}

export function TableMenu({ editor }: { editor: Editor }) {
  const inTable = editor.isActive("table");

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          title="Tabla"
          aria-label="Tabla"
          onMouseDown={(event) => event.preventDefault()}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-[5px] text-muted transition-colors hover:bg-hover hover:text-ink data-[state=open]:bg-hover-strong data-[state=open]:text-ink",
            inTable && "bg-accent-soft text-accent-strong",
          )}
        >
          <Table2 className="h-3.5 w-3.5" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={6}
          className="z-50 w-[214px] rounded-lg border border-border bg-surface p-1.5 shadow-float"
        >
          <Item
            onSelect={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
          >
            <Grid2X2 className="h-3.5 w-3.5 text-muted" />
            Insertar tabla 3 × 3
          </Item>

          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          <Item
            disabled={!inTable}
            onSelect={() => editor.chain().focus().addRowBefore().run()}
          >
            <BetweenHorizontalStart className="h-3.5 w-3.5 text-muted" />
            Fila arriba
          </Item>
          <Item
            disabled={!inTable}
            onSelect={() => editor.chain().focus().addRowAfter().run()}
          >
            <Rows3 className="h-3.5 w-3.5 text-muted" />
            Fila abajo
          </Item>
          <Item
            disabled={!inTable}
            onSelect={() => editor.chain().focus().deleteRow().run()}
          >
            <Trash2 className="h-3.5 w-3.5 text-muted" />
            Eliminar fila
          </Item>

          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          <Item
            disabled={!inTable}
            onSelect={() => editor.chain().focus().addColumnBefore().run()}
          >
            <BetweenVerticalStart className="h-3.5 w-3.5 text-muted" />
            Columna a la izquierda
          </Item>
          <Item
            disabled={!inTable}
            onSelect={() => editor.chain().focus().addColumnAfter().run()}
          >
            <Columns3 className="h-3.5 w-3.5 text-muted" />
            Columna a la derecha
          </Item>
          <Item
            disabled={!inTable}
            onSelect={() => editor.chain().focus().deleteColumn().run()}
          >
            <Trash2 className="h-3.5 w-3.5 text-muted" />
            Eliminar columna
          </Item>

          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          <Item
            disabled={!inTable}
            onSelect={() => editor.chain().focus().mergeCells().run()}
          >
            <Merge className="h-3.5 w-3.5 text-muted" />
            Combinar celdas
          </Item>
          <Item
            disabled={!inTable}
            onSelect={() => editor.chain().focus().splitCell().run()}
          >
            <Split className="h-3.5 w-3.5 text-muted" />
            Dividir celda
          </Item>
          <Item
            disabled={!inTable}
            onSelect={() => editor.chain().focus().toggleHeaderRow().run()}
          >
            <Table2 className="h-3.5 w-3.5 text-muted" />
            Alternar encabezado
          </Item>

          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          <Item
            disabled={!inTable}
            onSelect={() => editor.chain().focus().deleteTable().run()}
          >
            <Trash2 className="h-3.5 w-3.5 text-danger" />
            <span className="text-danger">Eliminar tabla</span>
          </Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
