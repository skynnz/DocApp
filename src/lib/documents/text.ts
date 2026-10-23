import type { DocContent } from "@/db/schema";

const BLOCK_SEPARATOR_TYPES = new Set([
  "paragraph",
  "heading",
  "blockquote",
  "listItem",
  "codeBlock",
  "tableRow",
  "horizontalRule",
]);

export function extractDocumentText(document: DocContent): string {
  const walk = (node: DocContent): string => {
    if (node.type === "text") {
      return node.text ?? "";
    }

    if (node.type === "hardBreak") {
      return "\n";
    }

    if (node.type === "image") {
      const caption =
        typeof node.attrs?.caption === "string" ? node.attrs.caption : "";
      const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "";
      return [caption, alt].filter(Boolean).join(" ");
    }

    const children = (node.content ?? []).map(walk).join("");

    if (node.type === "tableCell" || node.type === "tableHeader") {
      return `${children}\t`;
    }

    if (BLOCK_SEPARATOR_TYPES.has(node.type)) {
      return `${children}\n`;
    }

    return children;
  };

  return walk(document)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function countWords(text: string): number {
  if (!text.trim()) {
    return 0;
  }

  const matches = text.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu);
  return matches?.length ?? 0;
}
