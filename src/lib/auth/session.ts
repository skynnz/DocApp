import "server-only";

import { createHmac, randomBytes } from "node:crypto";
import { cache } from "react";

import { and, eq, gt, lt, ne } from "drizzle-orm";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import {
  SESSION_COOKIE,
  SESSION_TTL_DAYS,
  getAppSecret,
} from "@/lib/constants";
import { getRequestMeta } from "@/lib/http";

import type { CurrentSession, SessionUser } from "./types";

function hashSessionToken(token: string): string {
  return createHmac("sha256", getAppSecret()).update(token).digest("hex");
}

function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    expires: expiresAt,
  };
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(
    Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
  );
  const { ip, userAgent } = await getRequestMeta();

  await db.insert(sessions).values({
    userId,
    tokenHash,
    expiresAt,
    userAgent,
    ip,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
}

export const getCurrentSession = cache(
  async (): Promise<CurrentSession | null> => {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) {
      return null;
    }

    const now = new Date();
    const [row] = await db
      .select({
        sessionId: sessions.id,
        lastUsedAt: sessions.lastUsedAt,
        expiresAt: sessions.expiresAt,
        userId: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        mustChangePassword: users.mustChangePassword,
        isActive: users.isActive,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(
        and(
          eq(sessions.tokenHash, hashSessionToken(token)),
          gt(sessions.expiresAt, now),
          eq(users.isActive, true),
        ),
      )
      .limit(1);

    if (!row) {
      return null;
    }

    if (now.getTime() - row.lastUsedAt.getTime() > 60 * 60 * 1000) {
      await db
        .update(sessions)
        .set({ lastUsedAt: now })
        .where(eq(sessions.id, row.sessionId));
    }

    const user: SessionUser = {
      id: row.userId,
      email: row.email,
      name: row.name,
      role: row.role,
      mustChangePassword: row.mustChangePassword,
    };

    return { sessionId: row.sessionId, user };
  },
);

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getCurrentSession();
  return session?.user ?? null;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();

  if (user.role !== "admin") {
    notFound();
  }

  return user;
}

export async function destroyCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await db
      .delete(sessions)
      .where(eq(sessions.tokenHash, hashSessionToken(token)));
  }

  cookieStore.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions(new Date(0)),
    maxAge: 0,
  });
}

export async function revokeOtherSessions(
  userId: string,
  keepSessionId: string,
): Promise<void> {
  await db
    .delete(sessions)
    .where(and(eq(sessions.userId, userId), ne(sessions.id, keepSessionId)));
}

export async function deleteExpiredSessions(): Promise<void> {
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}
