import { getCurrentUser } from "@/lib/auth/session";
import { getProject } from "@/db/queries/projects";
import { pdfExportSchema } from "@/lib/documents/validation";
import { generateProjectPdf } from "@/lib/pdf/render";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function slugify(value: string): string {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 70) || "documento"
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "No hay sesión activa." } },
      { status: 401 },
    );
  }

  const { id } = await params;
  const project = await getProject(user.id, id);

  if (!project) {
    return Response.json(
      { error: { code: "NOT_FOUND", message: "Proyecto no encontrado." } },
      { status: 404 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = pdfExportSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message:
            parsed.error.issues[0]?.message ??
            "Las opciones de exportación no son válidas.",
        },
      },
      { status: 400 },
    );
  }

  try {
    const pdf = await generateProjectPdf({
      project: {
        id: project.id,
        title: project.title,
        content: project.content,
        authorName: user.name,
      },
      options: parsed.data,
    });

    const date = new Date().toISOString().slice(0, 10);
    const filename = `${slugify(project.title)}-${date}.pdf`;

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdf.byteLength),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error generando PDF:", error);

    return Response.json(
      {
        error: {
          code: "PDF_ERROR",
          message:
            "No pudimos generar el PDF. Inténtalo de nuevo en unos segundos.",
        },
      },
      { status: 500 },
    );
  }
}
