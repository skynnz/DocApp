import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "No hay sesión activa." } },
      { status: 401 },
    );
  }

  return Response.json(
    { data: user },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
