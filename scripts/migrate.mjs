import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL no está configurada.");
  process.exit(1);
}

const maxAttempts = 20;

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  const client = postgres(connectionString, {
    max: 1,
    connect_timeout: 5,
  });

  try {
    const database = drizzle(client);
    await migrate(database, { migrationsFolder: "drizzle" });
    console.log("Migraciones aplicadas correctamente.");
    await client.end();
    process.exit(0);
  } catch (error) {
    await client.end().catch(() => undefined);
    console.error(
      `Migraciones: intento ${attempt}/${maxAttempts} falló:`,
      error instanceof Error ? error.message : error,
    );

    if (attempt === maxAttempts) {
      process.exit(1);
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}
