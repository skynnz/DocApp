import "server-only";

import { and, desc, eq, ilike, or } from "drizzle-orm";

import { db } from "@/db";
import { projects } from "@/db/schema";

export type ProjectListItem = {
  id: string;
  title: string;
  updatedAt: Date;
  wordCount: number;
};

export async function listProjects(
  ownerId: string,
  search?: string,
): Promise<ProjectListItem[]> {
  const query = search?.trim();
  const filters = [eq(projects.ownerId, ownerId)];

  if (query) {
    filters.push(
      or(
        ilike(projects.title, `%${query}%`),
        ilike(projects.contentText, `%${query}%`),
      )!,
    );
  }

  return db
    .select({
      id: projects.id,
      title: projects.title,
      updatedAt: projects.updatedAt,
      wordCount: projects.wordCount,
    })
    .from(projects)
    .where(and(...filters))
    .orderBy(desc(projects.updatedAt))
    .limit(100);
}

export async function getProject(ownerId: string, projectId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId)))
    .limit(1);

  return project ?? null;
}

export async function createProject(ownerId: string, title = "Sin título") {
  const [project] = await db
    .insert(projects)
    .values({
      ownerId,
      title: title.trim() || "Sin título",
    })
    .returning({ id: projects.id });

  return project;
}
