import { z } from "zod";

import type { DocContent } from "@/db/schema";

const nodeSchema: z.ZodType<DocContent> = z.lazy(() =>
  z.object({
    type: z.string().min(1).max(80),
    attrs: z.record(z.string(), z.unknown()).optional(),
    content: z.array(nodeSchema).max(20_000).optional(),
    marks: z.array(z.record(z.string(), z.unknown())).max(80).optional(),
    text: z.string().max(500_000).optional(),
  }),
);

export const documentSchema = nodeSchema.refine(
  (document) => document.type === "doc",
  "El documento debe ser de tipo doc.",
);

export const projectSettingsSchema = z
  .object({
    pageSize: z.enum(["A4", "Letter"]).optional(),
    orientation: z.enum(["portrait", "landscape"]).optional(),
    includeCover: z.boolean().optional(),
    coverSubtitle: z.string().max(200).optional(),
    includeToc: z.boolean().optional(),
    tocDepth: z.enum(["h1", "h1-h2"]).optional(),
    includeHeader: z.boolean().optional(),
    includeFooter: z.boolean().optional(),
    includePageNumbers: z.boolean().optional(),
    includeDate: z.boolean().optional(),
  })
  .strict();

export const updateProjectSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "El título no puede estar vacío.")
      .max(200, "El título es demasiado largo.")
      .optional(),
    content: documentSchema.optional(),
    revision: z.number().int().nonnegative().optional(),
    settings: projectSettingsSchema.optional(),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.content !== undefined ||
      value.settings !== undefined,
    "No hay cambios para guardar.",
  );

export const pdfExportSchema = z.object({
  pageSize: z.enum(["A4", "Letter"]).default("A4"),
  orientation: z.enum(["portrait", "landscape"]).default("portrait"),
  includeCover: z.boolean().default(true),
  coverSubtitle: z.string().max(200).default(""),
  includeToc: z.boolean().default(true),
  tocDepth: z.enum(["h1", "h1-h2"]).default("h1-h2"),
  includeHeader: z.boolean().default(true),
  includeFooter: z.boolean().default(true),
  includePageNumbers: z.boolean().default(true),
  includeDate: z.boolean().default(false),
});

export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

export function documentByteSize(content: DocContent): number {
  return Buffer.byteLength(JSON.stringify(content), "utf8");
}
