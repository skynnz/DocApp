export type PdfExportOptions = {
  pageSize: "A4" | "Letter";
  orientation: "portrait" | "landscape";
  includeCover: boolean;
  coverSubtitle: string;
  includeToc: boolean;
  tocDepth: "h1" | "h1-h2";
  includeHeader: boolean;
  includeFooter: boolean;
  includePageNumbers: boolean;
  includeDate: boolean;
};

export const DEFAULT_PDF_OPTIONS: PdfExportOptions = {
  pageSize: "A4",
  orientation: "portrait",
  includeCover: true,
  coverSubtitle: "",
  includeToc: true,
  tocDepth: "h1-h2",
  includeHeader: true,
  includeFooter: true,
  includePageNumbers: true,
  includeDate: false,
};
