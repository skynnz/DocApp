import { hash } from "@node-rs/argon2";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME?.trim() || "Administrador";

if (!connectionString) {
  console.error("DATABASE_URL no está configurada.");
  process.exit(1);
}

if (!email || !password) {
  console.error(
    "ADMIN_EMAIL y ADMIN_PASSWORD son obligatorias para crear el administrador.",
  );
  process.exit(1);
}

if (password.length < 12) {
  console.error("ADMIN_PASSWORD debe tener al menos 12 caracteres.");
  process.exit(1);
}

const client = postgres(connectionString, { max: 1 });

try {
  const [{ count }] = await client`
    select count(*)::int as count
    from users
  `;

  if (Number(count) > 0) {
    console.log("Ya existen usuarios. No se crea el administrador inicial.");
    process.exit(0);
  }

  const existing = await client`
    select id
    from users
    where lower(email) = ${email}
    limit 1
  `;

  if (existing.length > 0) {
    console.log("El email del administrador ya existe. No se crea de nuevo.");
    process.exit(0);
  }

  const passwordHash = await hash(password);

  await client`
    insert into users (
      email,
      name,
      password_hash,
      role,
      is_active,
      must_change_password
    )
    values (
      ${email},
      ${name},
      ${passwordHash},
      'admin',
      true,
      true
    )
  `;

  console.log(`Administrador creado: ${email}`);
  console.log("La contraseña deberá cambiarse en el primer inicio de sesión.");
} catch (error) {
  console.error("No se pudo crear el administrador inicial:", error);
  process.exit(1);
} finally {
  await client.end().catch(() => undefined);
}
