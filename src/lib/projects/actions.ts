"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createProject } from "@/db/queries/projects";
import { requireUser } from "@/lib/auth/session";

export async function createProjectAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "Sin título").slice(0, 200);
  const project = await createProject(user.id, title);

  if (!project) {
    throw new Error("No se pudo crear el proyecto.");
  }

  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}
