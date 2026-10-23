import { db } from "@/db";
import { assets } from "@/db/schema";
import { getProject } from "@/db/queries/projects";
import { getCurrentUser } from "@/lib/auth/session";
import { StorageError, storeImage } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(message: string, status: number) {
  return Response.json(
    { error: { code: "UPLOAD_ERROR", message } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();

  if (!user) {
    return errorResponse("No hay sesión activa.", 401);
  }

  const { id } = await params;
  const project = await getProject(user.id, id);

  if (!project) {
    return errorResponse("Proyecto no encontrado.", 404);
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return errorResponse("No pudimos leer el archivo.", 400);
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return errorResponse("Selecciona una imagen para subir.", 400);
  }

  try {
    const stored = await storeImage({
      file,
      userId: user.id,
      projectId: project.id,
    });

    const [asset] = await db
      .insert(assets)
      .values({
        projectId: project.id,
        ownerId: user.id,
        storageKey: stored.storageKey,
        originalName: stored.originalName,
        mimeType: stored.mimeType,
        byteSize: stored.byteSize,
        width: stored.width,
        height: stored.height,
      })
      .returning({
        id: assets.id,
        width: assets.width,
        height: assets.height,
      });

    if (!asset) {
      throw new Error("No se pudo registrar la imagen.");
    }

    return Response.json(
      {
        data: {
          id: asset.id,
          url: `/api/assets/${asset.id}`,
          width: asset.width,
          height: asset.height,
          mimeType: stored.mimeType,
        },
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof StorageError) {
      const status =
        error.code === "TOO_LARGE"
          ? 413
          : error.code === "PROCESSING"
            ? 422
            : 400;

      return errorResponse(error.message, status);
    }

    console.error("Error subiendo imagen:", error);
    return errorResponse("No pudimos guardar la imagen.", 500);
  }
}
