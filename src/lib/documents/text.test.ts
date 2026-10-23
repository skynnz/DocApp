import { describe, expect, it } from "vitest";

import type { DocContent } from "@/db/schema";

import { countWords, extractDocumentText } from "./text";

const document: DocContent = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 1 },
      content: [{ type: "text", text: "Introducción" }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Una guía " },
        { type: "text", text: "rápida", marks: [{ type: "bold" }] },
        { type: "text", text: " para DocApp." },
      ],
    },
    {
      type: "table",
      content: [
        {
          type: "tableRow",
          content: [
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Campo" }],
                },
              ],
            },
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Valor" }],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "image",
      attrs: {
        caption: "Figura de prueba",
        alt: "Diagrama",
      },
    },
  ],
};

describe("extractDocumentText", () => {
  it("extrae texto de bloques, tablas e imágenes", () => {
    const text = extractDocumentText(document);
    expect(text).toContain("Introducción");
    expect(text).toContain("Una guía rápida para DocApp.");
    expect(text).toContain("Campo");
    expect(text).toContain("Valor");
    expect(text).toContain("Figura de prueba");
    expect(text).toContain("Diagrama");
  });

  it("cuenta palabras ignorando signos", () => {
    expect(countWords("Hola, mundo. Esto es DocApp.")).toBe(5);
    expect(countWords("")).toBe(0);
    expect(countWords("  \n ")).toBe(0);
  });
});
