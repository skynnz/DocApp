# DocApp

Aplicación web self-hosted para crear documentación, guías y manuales con un editor rico, proyectos privados y exportación a PDF.

La interfaz está inspirada en la limpieza de Notion: sidebar discreto, mucho espacio en blanco y el documento como protagonista.

## Estado

La v1 cubre el flujo completo:

- Autenticación multiusuario con sesiones y contraseñas Argon2id.
- Proyectos privados por usuario.
- Administración básica de cuentas desde `/admin/users`.
- Editor Tiptap con formato inline, tablas, código, listas, imágenes y leyendas.
- Autoguardado con control de revisión.
- Subida de imágenes a un volumen persistente.
- Exportación PDF con portada, índice numerado, encabezado, pie y paginación.
- Modo oscuro persistente, con tema oscuro por defecto y toggle en sidebar, ajustes y login.
- Despliegue en Podman con app + PostgreSQL.

## Stack

| Pieza | Tecnología |
|---|---|
| Framework | Next.js 16 + React 19 |
| Lenguaje | TypeScript |
| UI | Tailwind CSS 4 + Radix |
| Editor | Tiptap 3 |
| Base de datos | PostgreSQL 18 |
| ORM | Drizzle ORM |
| PDF | Playwright + Chromium + Paged.js |
| Contenedores | Podman + Compose |

## Desarrollo local

### Requisitos

- Node.js 24
- pnpm 11
- Podman

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Levantar PostgreSQL

```bash
podman run -d \
  --name docapp-db-dev \
  -e POSTGRES_USER=docapp \
  -e POSTGRES_PASSWORD=docapp \
  -e POSTGRES_DB=docapp \
  -p 5432:5432 \
  postgres:18-alpine
```

Si el puerto `5432` está ocupado, usa otro (por ejemplo `55432`) y ajusta `DATABASE_URL`.

### 3. Configurar el entorno

Copia `.env.example` a `.env.local` y ajusta, como mínimo:

```dotenv
DATABASE_URL=postgres://docapp:docapp@127.0.0.1:5432/docapp
APP_SECRET=un-secreto-largo-y-aleatorio
ADMIN_EMAIL=admin@docapp.local
ADMIN_PASSWORD=CambiarEstaClave123!
PLAYWRIGHT_CHANNEL=msedge
```

`PLAYWRIGHT_CHANNEL` solo se usa en desarrollo local con Microsoft Edge instalado. En el contenedor debe quedar vacío para usar el Chromium incluido en la imagen de Playwright.

### 4. Migrar y crear el administrador

```bash
pnpm db:migrate
pnpm db:seed
```

### 5. Arrancar

```bash
pnpm dev
```

Abre `http://localhost:3000`. El administrador inicial es el configurado en `ADMIN_EMAIL` / `ADMIN_PASSWORD`; la aplicación pedirá cambiarlo en el primer acceso.

### Comandos útiles

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm db:generate   # genera una migración tras cambiar el esquema
```

## Despliegue con Podman

### 1. Preparar el entorno

```bash
cp .env.example .env
```

Genera un secreto:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Edita `.env`:

```dotenv
APP_NAME=DocApp
APP_URL=http://192.168.1.50:3000
APP_PORT=3000

DATABASE_URL=postgres://docapp:CLAVE_SEGURA@db:5432/docapp
POSTGRES_DB=docapp
POSTGRES_USER=docapp
POSTGRES_PASSWORD=CLAVE_SEGURA

APP_SECRET=EL_SECRETO_GENERADO

ADMIN_EMAIL=admin@tudominio.local
ADMIN_PASSWORD=UNA_CLAVE_INICIAL_LARGA
ADMIN_NAME=Administrador

UPLOAD_DIR=/data/uploads
MAX_UPLOAD_MB=10
COOKIE_SECURE=false
PLAYWRIGHT_CHANNEL=
TZ=America/Asuncion
```

### 2. Arrancar

```bash
podman compose up -d --build
```

La app queda en `http://IP_DEL_HOST:3000`. La base de datos no publica puertos: solo es accesible desde la red interna de Compose.

El contenedor de la app aplica las migraciones y crea el administrador inicial si la tabla de usuarios está vacía. Después del primer acceso, cambia la contraseña y elimina `ADMIN_PASSWORD` del `.env` si lo deseas.

### 3. Operación

```bash
podman compose logs -f app
podman compose ps
podman compose down
```

Para actualizar:

```bash
sh ./scripts/backup.sh
podman compose build
podman compose up -d
```

### Backup

Con el entorno de `.env` exportado:

```bash
export $(grep -v '^#' .env | xargs)
BACKUP_DIR=./backups sh ./scripts/backup.sh
```

El script genera un dump comprimido de PostgreSQL y un tar del volumen de imágenes.

Restaurar la base:

```bash
gunzip -c backups/db-AAAA-MM-DD-HHMMSS.sql.gz \
  | podman compose exec -T db psql -U docapp -d docapp
```

Restaurar imágenes:

```bash
podman compose exec -T app tar xzf - -C /data < backups/uploads-AAAA-MM-DD-HHMMSS.tar.gz
```

### TLS y acceso remoto

La configuración base está pensada para LAN/VPN y HTTP. Si vas a exponer la app a internet:

- Coloca un reverse proxy con TLS delante (Caddy, Nginx o Traefik).
- Cambia `COOKIE_SECURE=true` y `APP_URL=https://tu-dominio`.
- No publiques el puerto de PostgreSQL.
- Revisa los backups y las actualizaciones de la imagen.

## PDF

La exportación usa Playwright para abrir una versión de impresión del documento, Paged.js para paginar y Chromium para generar el PDF.

Opciones disponibles:

- A4 o Carta.
- Vertical u horizontal.
- Portada con subtítulo.
- Índice generado desde H1/H2, con números de página.
- Encabezado con el título.
- Pie con nombre de la app y fecha opcional.
- Numeración “Página X de Y”.

El PDF no se guarda en la base de datos: se genera bajo demanda y se descarga. El PDF siempre se genera en claro, independientemente del tema de la interfaz.

## Tema

DocApp arranca en modo oscuro. La preferencia se guarda en el navegador y se puede cambiar desde:

- El sidebar, junto al menú de usuario.
- La página de Ajustes.
- La pantalla de login y la de cambio de contraseña.

El cambio es inmediato y no afecta el contenido ni la exportación PDF.

## Estructura

```
src/
  app/                 Rutas y páginas
  components/
    editor/            Editor, toolbar, PDF, imágenes
    layout/            Sidebar y shell
    ui/                Componentes base
  db/                  Esquema, consultas y conexión
  lib/
    auth/              Sesiones, contraseñas y acciones
    documents/         Validación y extracción de texto
    pdf/               Renderizado HTML/PDF
    storage/           Imágenes en disco
scripts/               Migraciones, bootstrap, backups y checks
drizzle/               Migraciones SQL
public/vendor/         Paged.js generado por el build
```

## Limitaciones de la v1

- Sin colaboración en tiempo real ni comentarios.
- Sin historial de versiones ni papelera.
- Sin compartir proyectos entre usuarios.
- Sin subpáginas, carpetas ni etiquetas.
- Sin importación desde Word/Markdown.
- La administración de usuarios permite crear cuentas; desactivar o restablecer contraseñas queda para la siguiente iteración.
- Duplicar proyectos y el menú de comandos `/` todavía no están implementados.
- El resaltado de sintaxis se ve en el editor; el PDF conserva el bloque de código con tipografía y fondo, pero no colorea cada token.
- La suite de pruebas actual es unitaria; los flujos completos se verificaron manualmente con Playwright durante el desarrollo.

## Seguridad

- Proyectos privados: cada consulta valida el propietario.
- El administrador no puede abrir los proyectos de otros usuarios desde la interfaz.
- Contraseñas con Argon2id.
- Sesiones opacas almacenadas como HMAC-SHA256.
- Rate limit de login.
- Imágenes validadas por tipo real, re-encodeadas con `sharp` y servidas por ruta autenticada.
- El HTML del PDF se genera desde el JSON del editor, no desde HTML enviado por el cliente.
