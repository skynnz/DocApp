import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DocumentEditor } from "@/components/editor/document-editor";
import { getProject } from "@/db/queries/projects";
import { requireUser } from "@/lib/auth/session";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const user = await requireUser();
  const { id } = await params;
  const project = await getProject(user.id, id);

  return {
    title: project?.title ?? "Proyecto",
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const project = await getProject(user.id, id);

  if (!project) {
    notFound();
  }

  return (
    <DocumentEditor
      projectId={project.id}
      initialTitle={project.title}
      initialContent={project.content}
      initialRevision={project.revision}
      initialWordCount={project.wordCount}
      settings={project.settings}
    />
  );
}
