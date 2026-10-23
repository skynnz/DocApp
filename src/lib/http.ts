import { headers } from "next/headers";

export type RequestMeta = {
  ip: string;
  userAgent: string | null;
};

export async function getRequestMeta(): Promise<RequestMeta> {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  const ip =
    forwardedFor?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    "desconocida";

  return {
    ip: ip.slice(0, 64),
    userAgent: requestHeaders.get("user-agent")?.slice(0, 512) ?? null,
  };
}
