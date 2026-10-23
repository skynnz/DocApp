import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { assets } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { readStoredImage } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();

  if (!user) {
    return new Response("No autorizado", { status: 401 });
  }

  const { id } = await params;
  const [asset] = await db
    .select()
    .from(assets)
    .where(and(eq(assets.id, id), eq(assets.ownerId, user.id)))
    .limit(1);

  if (!asset) {
    return new Response("Imagen no encontrada", { status: 404 });
  }

  try {
    const file = await readStoredImage(asset.storageKey);
    const body = new Uint8Array(file);

    return new Response(body, {
      headers: {
        "Content-Type": asset.mimeType,
        "Content-Length": String(file.byteLength),
        "Content-Disposition": `inline; filename="${asset.id}.webp"`,
        "Cache-Control": "private, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Imagen no encontrada", { status: 404 });
  }
}
