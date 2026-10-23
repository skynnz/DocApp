import "server-only";

import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

type Database = PostgresJsDatabase<typeof schema>;

type DbGlobal = typeof globalThis & {
  __docappDb?: Database;
  __docappClient?: ReturnType<typeof postgres>;
};

const globalForDb = globalThis as DbGlobal;

function createDatabase(): Database {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL no está configurada.");
  }

  const client = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  globalForDb.__docappClient = client;

  return drizzle(client, { schema });
}

export function getDb(): Database {
  if (!globalForDb.__docappDb) {
    globalForDb.__docappDb = createDatabase();
  }

  return globalForDb.__docappDb;
}

/**
 * Proxy perezoso para que importar el módulo no abra una conexión durante el build.
 * Los métodos se enlazan a la instancia real de Drizzle.
 */
export const db = new Proxy({} as Database, {
  get(_target, property) {
    const instance = getDb() as unknown as Record<PropertyKey, unknown>;
    const value = instance[property];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export { schema };
