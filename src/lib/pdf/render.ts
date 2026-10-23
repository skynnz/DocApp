import "server-only";

import path from "node:path";

import { generateHTML } from "@tiptap/html";
import type { JSONContent } from "@tiptap/core";
import { load } from "cheerio";
import { eq } from "drizzle-orm";
import { chromium, type Browser } from "playwright";

import { editorExtensions } from "@/components/editor/extensions";
import { db } from "@/db";
import { assets } from "@/db/schema";
import type { DocContent } from "@/db/schema";
import { readStoredImage } from "@/lib/storage";

import type { PdfExportOptions } from "./types";

type PdfProject = {
  id: string;
  title: string;
  content: DocContent;
  authorName: string;
};

type Heading = {
  id: string;
  level: 1 | 2;
  text: string;
};

const pagedPolyfillPath = path.join(
  process.cwd(),
  "public",
  "vendor",
  "paged.polyfill.js",
);

let browserPromise: Promise<Browser> | null = null;

function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    const channel = process.env.PLAYWRIGHT_CHANNEL?.trim() || undefined;

    browserPromise = chromium
      .launch({
        headless: true,
        channel,
        args: ["--no-sandbox", "--disable-dev-shm-usage"],
      })
      .catch((error) => {
        browserPromise = null;
        throw error;
      });
  }

  return browserPromise;
}

let activeExports = 0;
const exportQueue: Array<() => void> = [];

async function acquireSlot(): Promise<void> {
  if (activeExports >= 2) {
    await new Promise<void>((resolve) => {
      exportQueue.push(resolve);
    });
  }

  activeExports += 1;
}

function releaseSlot(): void {
  activeExports -= 1;
  exportQueue.shift()?.();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cssString(value: string): string {
  return `"${value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, " ")}"`;
}

function formatDate(): string {
  return new Intl.DateTimeFormat("es", {
    dateStyle: "long",
    timeZone: process.env.TZ || "America/Asuncion",
  }).format(new Date());
}

async function inlineProjectImages(
  $: ReturnType<typeof load>,
  projectId: string,
): Promise<void> {
  const projectAssets = await db
    .select({
      id: assets.id,
      storageKey: assets.storageKey,
      mimeType: assets.mimeType,
    })
    .from(assets)
    .where(eq(assets.projectId, projectId));

  const dataUris = new Map<string, string>();

  await Promise.all(
    projectAssets.map(async (asset) => {
      try {
        const buffer = await readStoredImage(asset.storageKey);
        dataUris.set(
          asset.id,
          `data:${asset.mimeType};base64,${buffer.toString("base64")}`,
        );
      } catch {
        // Una imagen ausente no debe romper la exportación completa.
      }
    }),
  );

  $("img").each((_, element) => {
    const source = $(element).attr("src");
    const match = source?.match(/\/api\/assets\/([^/?#]+)/);

    if (!match) {
      $(element).remove();
      return;
    }

    const dataUri = dataUris.get(match[1]);

    if (!dataUri) {
      $(element).closest("figure").remove();
      return;
    }

    $(element).attr("src", dataUri);
    $(element).removeAttr("loading");
  });
}

function buildToc(headings: Heading[], depth: PdfExportOptions["tocDepth"]) {
  const selected = headings.filter(
    (heading) => heading.level === 1 || (depth === "h1-h2" && heading.level === 2),
  );

  if (selected.length === 0) {
    return "";
  }

  return `
    <section class="pdf-toc">
      <p class="pdf-toc-kicker">Contenido</p>
      <h1 class="pdf-toc-title">Índice</h1>
      <ol>
        ${selected
          .map(
            (heading) => `
              <li class="toc-level-${heading.level}">
                <a href="#${heading.id}">${escapeHtml(heading.text)}</a>
              </li>`,
          )
          .join("")}
      </ol>
    </section>
  `;
}

function buildCover(project: PdfProject, options: PdfExportOptions) {
  const date = formatDate();

  return `
    <section class="pdf-cover">
      <p class="pdf-cover-kicker">Documentación</p>
      <h1>${escapeHtml(project.title)}</h1>
      ${
        options.coverSubtitle.trim()
          ? `<p class="pdf-cover-subtitle">${escapeHtml(options.coverSubtitle.trim())}</p>`
          : ""
      }
      <div class="pdf-cover-meta">
        <p>${escapeHtml(project.authorName)}</p>
        ${options.includeDate ? `<p>${escapeHtml(date)}</p>` : ""}
      </div>
    </section>
  `;
}

function buildCss(
  project: PdfProject,
  options: PdfExportOptions,
  hasCover: boolean,
) {
  const pageSize = `${options.pageSize} ${options.orientation}`;
  const date = formatDate();
  const headerContent = options.includeHeader
    ? `content: ${cssString(project.title)};`
    : "content: none;";
  const footerLeftParts: string[] = [];

  if (options.includeFooter) {
    footerLeftParts.push(process.env.APP_NAME?.trim() || "DocApp");
  }

  if (options.includeDate) {
    footerLeftParts.push(date);
  }

  const footerLeft =
    footerLeftParts.length > 0
      ? `content: ${cssString(footerLeftParts.join(" · "))};`
      : "content: none;";
  const pageNumbers = options.includePageNumbers
    ? 'content: "Página " counter(page) " de " counter(pages);'
    : "content: none;";

  return `
    @page {
      size: ${pageSize};
      margin: 22mm 20mm 20mm;
      @top-center {
        ${headerContent}
        color: #9b9a97;
        font-family: "Inter", "Segoe UI", Arial, sans-serif;
        font-size: 7.5pt;
        letter-spacing: 0.02em;
      }
      @bottom-left {
        ${footerLeft}
        color: #9b9a97;
        font-family: "Inter", "Segoe UI", Arial, sans-serif;
        font-size: 7.5pt;
      }
      @bottom-right {
        ${pageNumbers}
        color: #9b9a97;
        font-family: "Inter", "Segoe UI", Arial, sans-serif;
        font-size: 7.5pt;
      }
    }

    ${
      hasCover
        ? `
      @page:first {
        @top-center { content: none; }
        @bottom-left { content: none; }
        @bottom-right { content: none; }
      }
    `
        : ""
    }

    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
    }

    body {
      color: #37352f;
      font-family: "Inter", "Segoe UI", Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.65;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    a {
      color: #2f6f62;
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    h1,
    h2,
    h3 {
      color: #23221f;
      font-weight: 600;
      letter-spacing: -0.02em;
    }

    h1 {
      margin: 0 0 4mm;
      font-size: 21pt;
      line-height: 1.18;
    }

    h2 {
      margin: 7mm 0 2.5mm;
      font-size: 14pt;
      line-height: 1.3;
    }

    h3 {
      margin: 5mm 0 2mm;
      font-size: 11.5pt;
      line-height: 1.35;
    }

    p {
      margin: 0 0 3.2mm;
      orphans: 3;
      widows: 3;
    }

    ul,
    ol {
      margin: 2mm 0 4mm;
      padding-left: 5.5mm;
    }

    li {
      margin: 1.1mm 0;
    }

    li > p {
      margin: 0;
    }

    blockquote {
      margin: 4mm 0;
      border-left: 2.5pt solid #2f6f62;
      padding: 1mm 0 1mm 4mm;
      color: #6f6d68;
    }

    blockquote p {
      margin: 0;
    }

    code {
      border: 0.5pt solid #e2e2de;
      border-radius: 2pt;
      background: #f4f4f1;
      padding: 0.5pt 2pt;
      color: #8f3d35;
      font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
      font-size: 8.5pt;
    }

    pre {
      margin: 4mm 0;
      border: 0.5pt solid #e2e2de;
      border-radius: 3pt;
      background: #f7f7f5;
      padding: 4mm;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
      font-size: 8.2pt;
      line-height: 1.55;
      break-inside: avoid;
    }

    pre code {
      border: 0;
      background: none;
      padding: 0;
      color: inherit;
      font-size: inherit;
    }

    table {
      width: 100%;
      margin: 4mm 0;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 9pt;
      break-inside: avoid;
    }

    th,
    td {
      border: 0.5pt solid #d9d9d6;
      padding: 2.2mm 2.5mm;
      text-align: left;
      vertical-align: top;
      overflow-wrap: anywhere;
    }

    th {
      background: #f6f6f3;
      font-weight: 600;
    }

    figure {
      margin: 5mm 0;
      break-inside: avoid;
    }

    figure img {
      display: block;
      max-width: 100%;
      height: auto;
      border-radius: 3pt;
      border: 0.5pt solid #e9e9e7;
    }

    figure.doc-image {
      margin-right: auto;
      margin-left: auto;
    }

    figure.doc-image[data-align="left"] {
      margin-left: 0;
    }

    figure.doc-image[data-align="right"] {
      margin-right: 0;
    }

    figcaption {
      margin-top: 2mm;
      color: #787774;
      font-size: 8.5pt;
      font-style: italic;
      line-height: 1.45;
      text-align: center;
    }

    hr {
      margin: 6mm 0;
      border: 0;
      border-top: 0.5pt solid #d9d9d6;
    }

    mark {
      padding: 0 1pt;
    }

    sub,
    sup {
      font-size: 70%;
      line-height: 0;
    }

    .pdf-cover {
      display: flex;
      min-height: 150mm;
      flex-direction: column;
      justify-content: center;
      break-after: page;
    }

    .pdf-cover-kicker,
    .pdf-toc-kicker {
      margin: 0 0 5mm;
      color: #2f6f62;
      font-size: 8pt;
      font-weight: 600;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }

    .pdf-cover h1 {
      max-width: 150mm;
      margin: 0;
      border-top: 2pt solid #2f6f62;
      padding-top: 7mm;
      font-size: 32pt;
      line-height: 1.08;
      letter-spacing: -0.04em;
    }

    .pdf-cover-subtitle {
      max-width: 130mm;
      margin: 5mm 0 0;
      color: #6f6d68;
      font-size: 13pt;
      line-height: 1.5;
    }

    .pdf-cover-meta {
      margin-top: 24mm;
      color: #787774;
      font-size: 9pt;
    }

    .pdf-cover-meta p {
      margin: 0 0 1.2mm;
    }

    .pdf-toc {
      break-after: page;
    }

    .pdf-toc-title {
      margin: 0 0 8mm;
      font-size: 22pt;
    }

    .pdf-toc ol {
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .pdf-toc li {
      margin: 0;
      border-bottom: 0.5pt solid #ecece9;
      padding: 2.6mm 0;
      font-size: 10.5pt;
    }

    .pdf-toc li.toc-level-2 {
      padding-left: 6mm;
      color: #6f6d68;
      font-size: 9.5pt;
    }

    .pdf-toc a {
      display: block;
      color: inherit;
      text-decoration: none;
    }

    .pdf-toc a::after {
      float: right;
      color: #9b9a97;
      content: target-counter(attr(href), page);
    }

    .pdf-content > h1 {
      margin-top: 9mm;
      break-after: avoid;
    }

    .pdf-content > h1:first-child {
      margin-top: 0;
    }

    .pdf-content h2,
    .pdf-content h3 {
      break-after: avoid;
    }
  `;
}

async function buildHtml(
  project: PdfProject,
  options: PdfExportOptions,
): Promise<string> {
  const rawHtml = generateHTML(
    project.content as unknown as JSONContent,
    editorExtensions,
  );
  const $ = load(rawHtml, null, false);
  const headings: Heading[] = [];
  let headingIndex = 0;

  $("h1, h2").each((_, element) => {
    const tagName = element.tagName.toLowerCase();
    const level: 1 | 2 = tagName === "h1" ? 1 : 2;

    if (level === 2 && options.tocDepth === "h1") {
      return;
    }

    headingIndex += 1;
    const id = `section-${headingIndex}`;
    $(element).attr("id", id);
    headings.push({
      id,
      level,
      text: $(element).text().replace(/\s+/g, " ").trim(),
    });
  });

  await inlineProjectImages($, project.id);

  const contentHtml = $.html();
  const hasCover = options.includeCover;
  const toc = options.includeToc ? buildToc(headings, options.tocDepth) : "";
  const cover = hasCover ? buildCover(project, options) : "";
  const css = buildCss(project, options, hasCover);

  return `<!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(project.title)}</title>
        <style>${css}</style>
      </head>
      <body>
        ${cover}
        ${toc}
        <main class="pdf-content">${contentHtml}</main>
      </body>
    </html>`;
}

export async function generateProjectPdf({
  project,
  options,
}: {
  project: PdfProject;
  options: PdfExportOptions;
}): Promise<Buffer> {
  const html = await buildHtml(project, options);
  await acquireSlot();

  let context: Awaited<ReturnType<Browser["newContext"]>> | null = null;

  try {
    const browser = await getBrowser();
    context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultTimeout(30_000);
    await page.setContent(html, { waitUntil: "networkidle" });

    try {
      await page.evaluate(() => {
        const pagedWindow = window as unknown as {
          PagedConfig?: { auto: boolean };
        };
        pagedWindow.PagedConfig = { auto: false };
      });
      await page.addScriptTag({ path: pagedPolyfillPath });
      await page.evaluate(async () => {
        const pagedWindow = window as unknown as {
          PagedPolyfill: { preview: () => Promise<unknown> };
        };
        await pagedWindow.PagedPolyfill.preview();
      });
      await page.waitForSelector(".pagedjs_page", { timeout: 30_000 });
      await page.evaluate(() => document.fonts.ready);
    } catch (error) {
      console.warn(
        "Paged.js no pudo paginar; se usará la impresión nativa del navegador.",
        error,
      );
    }

    const pdf = await page.pdf({
      preferCSSPageSize: true,
      printBackground: true,
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
      },
    });

    return Buffer.from(pdf);
  } finally {
    await context?.close().catch(() => undefined);
    releaseSlot();
  }
}
