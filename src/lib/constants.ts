export const SESSION_COOKIE = "docapp_session";
export const SESSION_TTL_DAYS = 30;
export const LOGIN_MAX_ATTEMPTS = 5;
export const LOGIN_WINDOW_MINUTES = 15;

export const APP_NAME = process.env.APP_NAME?.trim() || "DocApp";

export function getAppSecret(): string {
  const secret = process.env.APP_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("APP_SECRET es obligatoria en producción.");
  }

  return "docapp-development-secret-change-me";
}
