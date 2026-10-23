"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const TEXT_COLORS = [
  "#37352F",
  "#787774",
  "#9B9A97",
  "#C2413B",
  "#D9730D",
  "#B7791F",
  "#2F6F62",
  "#2F6F9F",
  "#6940A5",
  "#A33A6B",
];

const HIGHLIGHT_COLORS = [
  "#FDE68A",
  "#FECACA",
  "#FBCFE8",
  "#DDD6FE",
  "#BFDBFE",
  "#BBF7D0",
  "#FEF3C7",
  "#E5E7EB",
];

export function ColorMenu({
  label,
  color,
  colors = TEXT_COLORS,
  icon,
  onChange,
  onClear,
}: {
  label: string;
  color?: string;
  colors?: string[];
  icon: ReactNode;
  onChange: (color: string) => void;
  onClear: () => void;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          title={label}
          aria-label={label}
          onMouseDown={(event) => event.preventDefault()}
          className="relative flex h-7 w-7 items-center justify-center rounded-[5px] text-muted transition-colors hover:bg-hover hover:text-ink data-[state=open]:bg-hover-strong data-[state=open]:text-ink"
        >
          {icon}
          <span
            className="absolute bottom-[3px] left-1/2 h-[2px] w-4 -translate-x-1/2 rounded-full"
            style={{ backgroundColor: color || "transparent" }}
          />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={6}
          className="z-50 w-[186px] rounded-lg border border-border bg-surface p-2 shadow-float"
        >
          <p className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle">
            {label}
          </p>
          <div className="grid grid-cols-5 gap-1">
            {colors.map((swatch) => {
              const selected = color?.toLowerCase() === swatch.toLowerCase();

              return (
                <DropdownMenu.Item key={swatch} asChild>
                  <button
                    type="button"
                    title={swatch}
                    aria-label={`${label}: ${swatch}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => onChange(swatch)}
                    className={cn(
                      "relative flex h-7 w-7 items-center justify-center rounded-[5px] border border-black/10 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
                      selected && "ring-2 ring-accent/45 ring-offset-1",
                    )}
                    style={{ backgroundColor: swatch }}
                  >
                    {selected ? (
                      <Check
                        className="h-3 w-3"
                        style={{
                          color:
                            swatch === "#FDE68A" ||
                            swatch === "#FEF3C7" ||
                            swatch === "#E5E7EB" ||
                            swatch === "#BBF7D0"
                              ? "#37352F"
                              : "#FFFFFF",
                        }}
                      />
                    ) : null}
                  </button>
                </DropdownMenu.Item>
              );
            })}
          </div>

          <div className="mt-2 border-t border-border pt-1">
            <DropdownMenu.Item asChild>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={onClear}
                className="flex w-full items-center gap-2 rounded-[5px] px-2 py-1.5 text-left text-[12px] text-muted outline-none transition-colors hover:bg-hover hover:text-ink data-[highlighted]:bg-hover"
              >
                <RotateCcw className="h-3 w-3" />
                Quitar color
              </button>
            </DropdownMenu.Item>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export { HIGHLIGHT_COLORS, TEXT_COLORS };
