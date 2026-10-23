import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { listProjects } from "@/db/queries/projects";
import { requireUser } from "@/lib/auth/session";
import { APP_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  if (user.mustChangePassword) {
    redirect("/change-password");
  }

  const projects = await listProjects(user.id);

  return (
    <AppShell
      appName={APP_NAME}
      user={user}
      projects={projects.map((project) => ({
        id: project.id,
        title: project.title,
        updatedAt: project.updatedAt.toISOString(),
        wordCount: project.wordCount,
      }))}
    >
      {children}
    </AppShell>
  );
}
