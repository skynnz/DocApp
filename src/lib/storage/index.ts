import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";
import type { OutputInfo } from "sharp";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export class StorageError extends Error {
  constructor(
    message: string,
    public readonly code: "INVALID_TYPE" | "TOO_LARGE" | "EMPTY" | "PROCESSING",
  ) {
    super(message);
    this.name = "StorageError";
  }
}

export function getUploadDir(): string {
  return path.resolve(
    /* turbopackIgnore: true */
    process.env.UPLOAD_DIR || path.join(process.cwd(), "data", "uploads"),
  );
}

export type StoredImage = {
  storageKey: string;
  mimeType: string;
  byteSize: number;
  width: number;
  height: number;
  originalName: string;
};

export async function storeImage({
  file,
  userId,
  projectId,
}: {
  file: File;
  userId: string;
  projectId: string;
}): Promise<StoredImage> {
  const maxBytes =
    Number(process.env.MAX_UPLOAD_MB || "10") * 1024 * 1024;

  if (file.size === 0) {
    throw new StorageError("El archivo está vacío.", "EMPTY");
  }

  if (file.size > maxBytes) {
    throw new StorageError(
      `La imagen supera el límite de ${Math.round(maxBytes / 1024 / 1024)} MB.`,
      "TOO_LARGE",
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(buffer);

  if (!detected || !ALLOWED_MIME_TYPES.has(detected.mime)) {
    throw new StorageError(
      "Formato no soportado. Usa JPEG, PNG, WebP o GIF.",
      "INVALID_TYPE",
    );
  }

  let processed: { data: Buffer; info: OutputInfo };

  try {
    processed = await sharp(buffer, { failOn: "error" })
      .rotate()
      .resize({
        width: 2400,
        height: 2400,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 88 })
      .toBuffer({ resolveWithObject: true });
  } catch {
    throw new StorageError(
      "No pudimos procesar la imagen. Prueba con otro archivo.",
      "PROCESSING",
    );
  }

  const storageKey = path.posix.join(
    userId,
    projectId,
    `${randomUUID()}.webp`,
  );
  const absolutePath = path.join(
    /* turbopackIgnore: true */
    getUploadDir(),
    storageKey,
  );

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(/* turbopackIgnore: true */ absolutePath, processed.data);

  return {
    storageKey,
    mimeType: "image/webp",
    byteSize: processed.info.size,
    width: processed.info.width,
    height: processed.info.height,
    originalName: file.name.slice(0, 255) || "imagen",
  };
}

export async function readStoredImage(storageKey: string): Promise<Buffer> {
  const root = getUploadDir();
  const absolutePath = path.resolve(root, storageKey);

  if (
    absolutePath !== root &&
    !absolutePath.startsWith(`${root}${path.sep}`)
  ) {
    throw new Error("Ruta de imagen inválida.");
  }

  return readFile(/* turbopackIgnore: true */ absolutePath);
}

export async function deleteStoredImage(storageKey: string): Promise<void> {
  const root = getUploadDir();
  const absolutePath = path.resolve(root, storageKey);

  if (
    absolutePath !== root &&
    !absolutePath.startsWith(`${root}${path.sep}`)
  ) {
    return;
  }

  await unlink(/* turbopackIgnore: true */ absolutePath).catch(() => undefined);
}
