import { describe, expect, it } from "vitest";

import {
  MAX_DOCUMENT_BYTES,
  documentByteSize,
  documentSchema,
  pdfExportSchema,
} from "./validation";

describe("documentSchema", () => {
  it("acepta un documento Tiptap", () => {
    const result = documentSchema.safeParse({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Hola" }],
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rechaza un nodo raíz distinto de doc", () => {
    const result = documentSchema.safeParse({
      type: "paragraph",
      content: [],
    });

    expect(result.success).toBe(false);
  });

  it("calcula el tamaño en bytes", () => {
    const size = documentByteSize({
      type: "doc",
      content: [{ type: "text", text: "á" }],
    });

    expect(size).toBeGreaterThan(0);
    expect(size).toBeLessThan(MAX_DOCUMENT_BYTES);
  });
});

describe("pdfExportSchema", () => {
  it("aplica valores por defecto", () => {
    const result = pdfExportSchema.parse({});

    expect(result.pageSize).toBe("A4");
    expect(result.includeCover).toBe(true);
    expect(result.includePageNumbers).toBe(true);
  });

  it("rechaza un tamaño desconocido", () => {
    const result = pdfExportSchema.safeParse({ pageSize: "A3" });

    expect(result.success).toBe(false);
  });
});
