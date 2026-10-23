import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { assets, projects } from "@/db/schema";
import { getProject } from "@/db/queries/projects";
import { deleteStoredImage } from "@/lib/storage";
import { countWords, extractDocumentText } from "@/lib/documents/text";
import {
  MAX_DOCUMENT_BYTES,
  documentByteSize,
  updateProjectSchema,
} from "@/lib/documents/validation";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: unknown,
) {
  return Response.json(
    { error: { code, message, details } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();

  if (!user) {
    return errorResponse("UNAUTHENTICATED", "No hay sesión activa.", 401);
  }

  const { id } = await params;
  const project = await getProject(user.id, id);

  if (!project) {
    return errorResponse("NOT_FOUND", "Proyecto no encontrado.", 404);
  }

  return Response.json(
    { data: project },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();

  if (!user) {
    return errorResponse("UNAUTHENTICATED", "No hay sesión activa.", 401);
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);

  if (contentLength > MAX_DOCUMENT_BYTES + 64 * 1024) {
    return errorResponse(
      "PAYLOAD_TOO_LARGE",
      "El documento supera el tamaño máximo permitido.",
      413,
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse("INVALID_JSON", "El cuerpo no es JSON válido.", 400);
  }

  const parsed = updateProjectSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Datos inválidos.",
      400,
      parsed.error.flatten(),
    );
  }

  if (
    parsed.data.content &&
    documentByteSize(parsed.data.content) > MAX_DOCUMENT_BYTES
  ) {
    return errorResponse(
      "PAYLOAD_TOO_LARGE",
      "El documento supera el tamaño máximo permitido.",
      413,
    );
  }

  const { id } = await params;
  const project = await getProject(user.id, id);

  if (!project) {
    return errorResponse("NOT_FOUND", "Proyecto no encontrado.", 404);
  }

  if (
    parsed.data.revision !== undefined &&
    parsed.data.revision !== project.revision
  ) {
    return errorResponse(
      "REVISION_CONFLICT",
      "El documento cambió en otra pestaña o dispositivo.",
      409,
      {
        revision: project.revision,
        updatedAt: project.updatedAt,
      },
    );
  }

  const contentText = parsed.data.content
    ? extractDocumentText(parsed.data.content)
    : undefined;

  const [updated] = await db
    .update(projects)
    .set({
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.content !== undefined
        ? {
            content: parsed.data.content,
            contentText: contentText ?? "",
            wordCount: countWords(contentText ?? ""),
          }
        : {}),
      ...(parsed.data.settings !== undefined
        ? { settings: parsed.data.settings }
        : {}),
      revision: sql`${projects.revision} + 1`,
      updatedAt: new Date(),
    })
    .where(and(eq(projects.id, id), eq(projects.ownerId, user.id)))
    .returning({
      id: projects.id,
      title: projects.title,
      revision: projects.revision,
      wordCount: projects.wordCount,
      updatedAt: projects.updatedAt,
    });

  if (!updated) {
    return errorResponse("NOT_FOUND", "Proyecto no encontrado.", 404);
  }

  return Response.json(
    { data: updated },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();

  if (!user) {
    return errorResponse("UNAUTHENTICATED", "No hay sesión activa.", 401);
  }

  const { id } = await params;
  const project = await getProject(user.id, id);

  if (!project) {
    return errorResponse("NOT_FOUND", "Proyecto no encontrado.", 404);
  }

  const projectAssets = await db
    .select({ storageKey: assets.storageKey })
    .from(assets)
    .where(eq(assets.projectId, id));

  await db
    .delete(projects)
    .where(and(eq(projects.id, id), eq(projects.ownerId, user.id)));

  await Promise.all(
    projectAssets.map((asset) => deleteStoredImage(asset.storageKey)),
  );

  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}
