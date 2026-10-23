# DocApp — Plan técnico de la v1

> Aplicación web self-hosted para crear documentación, guías y manuales con un editor rico tipo Word, organización por proyectos y exportación a PDF.
>
> Estado: v1 implementada y verificada en local y en Podman.
> Fecha: 2026-10-19.
>
> La v1 cubre el flujo principal de documentación, edición y exportación. Las funciones marcadas como pendientes en `README.md` quedan para la siguiente iteración.
> La guía de uso y despliegue está en `README.md`.

---

## 1. Resumen ejecutivo

DocApp será una aplicación web de uso personal/equipo pequeño, desplegada en Podman con dos contenedores: la aplicación y PostgreSQL. Cada proyecto es un documento único con contenido enriquecido, guardado automáticamente en la base de datos. El editor estará construido con Tiptap y ofrecerá formato inline completo, tablas, imágenes con leyenda, bloques de código con resaltado y herramientas de estructura. La exportación a PDF será una función de primera clase, con portada, índice, encabezado, pie y numeración opcionales.

La prioridad es que la experiencia se sienta simple y cuidada, no un clon de Confluence. La interfaz toma como referencia la limpieza de Notion: sidebar discreto, mucho espacio en blanco, tipografía clara y controles que aparecen cuando se necesitan.

---

## 2. Decisiones cerradas

| Tema | Decisión |
|---|---|
| Estructura | Un proyecto = un documento único. Sin subpáginas en la v1. |
| Sidebar | Lista plana de proyectos, ordenada por última edición, con búsqueda. |
| Editor | Tiptap 3 sobre ProseMirror. |
| Formato | Texto enriquecido completo: color, fondo, fuente, tamaño, alineación, tablas, código, imágenes y leyendas. |
| Usuarios | Multiusuario con cuentas. Proyectos privados por usuario. El administrador crea las cuentas. |
| Permisos | `admin` y `member`. Nadie ve proyectos de otra persona. Sin compartir proyectos en la v1. |
| PDF | Un PDF por proyecto, con opciones de portada, índice, encabezado, pie y numeración. |
| Estilo | Limpio, neutro y minimalista, inspirado en Notion. |
| Tema | Oscuro por defecto, con toggle a claro y preferencia persistente. |
| Despliegue | Dos contenedores en un mismo host Podman: app + PostgreSQL. |
| Acceso | Red local/VPN. HTTP en la LAN; TLS opcional si se expone fuera. |
| Índice PDF | Con números de página reales, generados con Paged.js. |
| Idioma | Interfaz en español. Contenido multilenguaje. |

---

## 3. Alcance de la v1

### 3.1 Incluido

- Autenticación con email y contraseña.
- Administración de usuarios: crear cuentas y asignar rol.
- Cambio de contraseña por parte del usuario.
- Listado de proyectos con búsqueda por título y contenido.
- Crear, abrir, renombrar y eliminar proyectos.
- Editor de contenido con autoguardado y control de conflictos.
- Formato de texto: negrita, cursiva, subrayado, tachado, código inline, enlaces, superíndice y subíndice.
- Formato de párrafo: H1–H3, párrafo, cita, listas con viñetas, listas numeradas, listas de tareas y separador.
- Formato inline avanzado: color de texto, color de fondo, familia tipográfica, tamaño y altura de línea.
- Alineación de texto.
- Tablas editables: filas, columnas, encabezados, combinar y dividir celdas.
- Bloques de código con resaltado de sintaxis y selector de lenguaje.
- Imágenes por subida, arrastre o pegado, con texto alternativo, leyenda en cursiva, ancho y alineación.
- Menú flotante al seleccionar texto.
- Panel de esquema del documento (H1–H3).
- Autoguardado con estado visible y guardado manual con `Ctrl/Cmd + S`.
- Exportación PDF con opciones.
- Modo oscuro persistente, con tema oscuro por defecto.
- Cuenta de administrador inicial y página de administración de usuarios.
- Despliegue con `compose.yaml`, migraciones, healthchecks y documentación.
- Copias de seguridad de PostgreSQL y de la carpeta de imágenes.

### 3.2 Fuera de la v1

- Colaboración en tiempo real.
- Comentarios y menciones.
- Historial de versiones y papelera.
- Compartir proyectos entre usuarios.
- Subpáginas o árbol de documentos.
- Carpetas o etiquetas.
- Importación desde Word, Markdown o Confluence.
- Plantillas de documento.
- Firma digital, control de cambios o revisión.
- Aplicación móvil nativa.
- Envío de correos transaccionales.
- Integraciones con IA.

Estas funciones no se descartan; simplemente no condicionan la primera entrega.

---

## 4. Roles y flujos

### 4.1 Roles

**Administrador**
- Puede crear usuarios.
- Puede desactivar usuarios y restablecer contraseñas.
- Puede cambiar el rol de un usuario.
- Tiene sus propios proyectos privados.
- No puede leer el contenido de los proyectos de otros usuarios desde la interfaz.

**Miembro**
- Inicia sesión con las credenciales entregadas por el administrador.
- Crea y gestiona únicamente sus proyectos.
- Puede cambiar su nombre y contraseña.

### 4.2 Flujo de primer arranque

1. El contenedor arranca, espera a PostgreSQL y aplica migraciones.
2. Si no existe ningún usuario, se crea el administrador inicial a partir de `ADMIN_EMAIL`, `ADMIN_PASSWORD` y `ADMIN_NAME`.
3. El administrador inicia sesión y cambia la contraseña inicial.
4. Desde `/admin/users` crea las cuentas del equipo.
5. Cada persona recibe una contraseña temporal y la cambia en su primer acceso.

### 4.3 Flujo principal

1. El usuario inicia sesión.
2. Ve la lista de sus proyectos o un estado vacío con la acción “Crear proyecto”.
3. Al crear un proyecto se abre un documento en blanco con el título enfocado.
4. Escribe y da formato; el contenido se guarda automáticamente.
5. Puede previsualizar la estructura en el panel de esquema.
6. Exporta a PDF eligiendo las opciones.
7. Vuelve al listado o cierra sesión.

### 4.4 Flujo de exportación

1. El usuario pulsa “Exportar PDF”.
2. Se abre un diálogo con opciones:
   - Tamaño de página: A4 o Carta.
   - Orientación: vertical u horizontal.
   - Portada: sí/no, con subtítulo y fecha opcionales.
   - Índice: sí/no, generado desde H1 y H2.
   - Encabezado: título del documento.
   - Pie: numeración “X de Y” y fecha opcional.
3. El servidor genera el PDF y lo devuelve como descarga.
4. El navegador muestra el progreso y, si falla, un error accionable.

---

## 5. Experiencia y diseño

### 5.1 Principios

- **El contenido primero.** La interfaz desaparece alrededor del documento.
- **Simple, no vacío.** Pocos controles visibles, pero las acciones importantes están a un clic.
- **Consistencia.** Los mismos controles aparecen en la toolbar, el menú flotante y los atajos.
- **Sin sorpresas.** El autoguardado se comunica claramente; nunca se pierde contenido en silencio.
- **PDF cuidado.** El PDF debe verse como un documento terminado, no como una captura de pantalla.

### 5.2 Estructura de pantallas

```
┌─────────────────────────────────────────────────────────────┐
│ Sidebar                 │ Documento                         │
│                         │                                   │
│  DocApp                 │  ← Proyectos / Título             │
│  + Nuevo proyecto       │  ┌─────────────────────────────┐  │
│  Buscar...              │  │ Título del documento        │  │
│                         │  │                             │  │
│  Proyecto A             │  │ Toolbar                     │  │
│  Proyecto B             │  │                             │  │
│  Proyecto C             │  │ Contenido editable          │  │
│                         │  │                             │  │
│  ─────────────          │  │                             │  │
│  Usuario / Ajustes      │  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Sidebar**
- Ancho 260 px, colapsable.
- Cabecera con nombre de la app.
- Botón primario “Nuevo proyecto”.
- Buscador con atajo `Ctrl/Cmd + K`.
- Lista de proyectos con título, fecha relativa y menú contextual.
- Estado vacío ilustrado.
- Pie con menú de usuario: ajustes, administración (solo admin) y cerrar sesión.

**Área principal**
- Barra superior con migas de pan, estado de guardado y botón “Exportar PDF”.
- Título editable de gran tamaño.
- Metadatos discretos: última edición y cantidad de palabras.
- Toolbar sticky, agrupada por formato, párrafo e inserción.
- Lienzo de escritura centrado, ancho máximo de 760 px.
- Panel de esquema opcional a la derecha.
- Barra inferior con conteo de palabras y acceso al esquema.

**Diálogos**
- Exportar PDF.
- Crear/editar usuario.
- Confirmar eliminación.
- Cambiar contraseña.
- Conflictos de guardado.

### 5.3 Sistema visual

- **Fondo de app:** `#F7F7F5`.
- **Sidebar:** `#FBFBFA`.
- **Lienzo:** `#FFFFFF`.
- **Bordes:** `#E9E9E7`.
- **Texto principal:** `#37352F`.
- **Texto secundario:** `#787774`.
- **Acento:** verde profundo `#2F6F62` para acciones primarias y enlaces.
- **Peligro:** `#C2413B`.
- **Radios:** 6–8 px.
- **Sombras:** muy sutiles, solo para elementos flotantes.
- **Tipografía UI:** Inter.
- **Tipografía de documento:** Inter por defecto; el usuario puede elegir entre varias familias.
- **Código:** JetBrains Mono.

No se usarán degradados llamativos, glassmorphism ni animaciones largas. Las transiciones serán de 120–180 ms y respetarán `prefers-reduced-motion`.

### 5.4 Responsive

- Desktop: sidebar fijo y panel de esquema opcional.
- Tablet: sidebar colapsable en drawer.
- Móvil: edición básica funcional, toolbar compacta y sidebar en drawer.
- La experiencia prioritaria es desktop.

### 5.5 Accesibilidad

- Navegación completa por teclado.
- Foco visible en todos los controles.
- Etiquetas ARIA en iconos y menús.
- Contraste mínimo AA.
- Diálogos con manejo de foco y cierre con `Escape`.
- No depender solo del color para comunicar estados.

---

## 6. Arquitectura técnica

### 6.1 Stack

| Capa | Tecnología | Versión objetivo |
|---|---|---|
| Runtime | Node.js LTS | 24.x |
| Framework | Next.js App Router | 16.4.x |
| UI | React | 19.x |
| Lenguaje | TypeScript estricto | 5.x |
| Estilos | Tailwind CSS | 4.3.x |
| Componentes | shadcn/ui + Radix | últimas estables |
| Editor | Tiptap | 3.32.x |
| Base de datos | PostgreSQL | 18.x |
| ORM | Drizzle ORM + drizzle-kit | 0.45.x |
| Driver | postgres.js | 3.4.x |
| Validación | Zod | última estable |
| Auth | Sesiones propias + Argon2id | — |
| Hash | `@node-rs/argon2` | 2.2.x |
| Imágenes | `sharp` | última estable |
| PDF | Playwright + Chromium + Paged.js | 1.64.x / 0.4.3 |
| Iconos | Lucide | última estable |
| Toasts | Sonner | última estable |
| Tests unitarios | Vitest | última estable |
| E2E | Playwright Test | 1.64.x |
| Contenedores | Podman + Compose | Podman 5.x |

Las versiones exactas se fijarán en `package.json` y en la imagen base al iniciar la implementación.

### 6.2 Vista general

```
Navegador
   │ HTTPS/HTTP
   ▼
┌──────────────────────────────────────────────┐
│ Contenedor app                               │
│                                              │
│  Next.js 16                                  │
│   ├── UI / Server Components                 │
│   ├── API Routes                             │
│   ├── Auth y autorización                    │
│   ├── Tiptap (cliente)                       │
│   ├── Generación HTML para PDF               │
│   └── Playwright + Chromium                  │
│                                              │
│  Volumen: /data/uploads                      │
└──────────────────┬───────────────────────────┘
                   │ red interna
                   ▼
┌──────────────────────────────────────────────┐
│ Contenedor db                                │
│  PostgreSQL 18                               │
│  Volumen: /var/lib/postgresql/data           │
└──────────────────────────────────────────────┘
```

No hay servicios externos obligatorios. Las fuentes se empaquetan en la imagen para que el PDF sea reproducible sin conexión.

### 6.3 Organización del repositorio

```
.
├── compose.yaml
├── Dockerfile
├── .env.example
├── package.json
├── pnpm-lock.yaml
├── next.config.ts
├── tsconfig.json
├── drizzle.config.ts
├── PLAN.md
├── README.md
├── docs/
│   ├── deploy.md
│   ├── backup.md
│   └── decisions.md
├── drizzle/
│   └── migrations/
├── scripts/
│   ├── entrypoint.sh
│   ├── migrate.mjs
│   ├── bootstrap-admin.mjs
│   └── backup.sh
├── public/
│   └── fonts/
└── src/
    ├── app/
    │   ├── (auth)/login/
    │   ├── (app)/projects/
    │   ├── (app)/projects/[id]/
    │   ├── (app)/admin/users/
    │   ├── (app)/settings/
    │   ├── api/
    │   └── layout.tsx
    ├── components/
    │   ├── editor/
    │   ├── layout/
    │   ├── projects/
    │   ├── export/
    │   └── ui/
    ├── db/
    │   ├── schema.ts
    │   ├── index.ts
    │   └── queries/
    ├── lib/
    │   ├── auth/
    │   ├── pdf/
    │   ├── storage/
    │   ├── validation/
    │   └── utils/
    └── styles/
```

### 6.4 Por qué Tiptap y no Editor.js

Editor.js es un editor por bloques: cada bloque es una unidad cerrada y el formato inline se resuelve con herramientas adicionales. Eso funciona bien para blogs, pero para este proyecto implica fricción en color de texto, fondo, tamaño y familia tipográfica, tablas complejas y leyendas de imágenes. Muchas de esas capacidades habría que construirlas como plugins propios.

Tiptap está construido sobre ProseMirror, trabaja con un esquema de documento y permite combinar marcas inline, nodos personalizados y extensiones. Su núcleo y más de 100 extensiones son MIT; las funciones de pago son colaboración en tiempo real, comentarios, historial, IA y conversión de formatos, que no forman parte de la v1. El contenido se guarda como JSON portable, así que no hay dependencia de un proveedor ni de una interfaz cerrada.

La experiencia visual puede ser igual de limpia que la de Editor.js; la diferencia está en la profundidad del modelo de edición.

---

## 7. Modelo de datos

### 7.1 `users`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK, `gen_random_uuid()` |
| `email` | `text` | Único, normalizado a minúsculas |
| `name` | `text` | Nombre visible |
| `password_hash` | `text` | Argon2id |
| `role` | `text` | `admin` o `member` |
| `is_active` | `boolean` | Baja lógica |
| `must_change_password` | `boolean` | Contraseña temporal |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

Índice único sobre `lower(email)`.

### 7.2 `sessions`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK a `users`, `on delete cascade` |
| `token_hash` | `text` | HMAC-SHA256 del token con `APP_SECRET`; el token original no se guarda |
| `expires_at` | `timestamptz` | |
| `created_at` | `timestamptz` | |
| `last_used_at` | `timestamptz` | |
| `user_agent` | `text` | Opcional |
| `ip` | `text` | Opcional |

Índice único en `token_hash`; índice en `user_id`.

### 7.3 `projects`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK |
| `owner_id` | `uuid` | FK a `users` |
| `title` | `text` | Título visible |
| `content` | `jsonb` | Documento Tiptap |
| `content_text` | `text` | Texto plano para búsqueda y conteo |
| `word_count` | `integer` | Calculado en servidor |
| `content_version` | `integer` | Versión del esquema del documento |
| `revision` | `integer` | Control de concurrencia optimista |
| `settings` | `jsonb` | Preferencias de exportación y página |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

Índice en `(owner_id, updated_at desc)`.
Índice GIN opcional sobre `content` para búsquedas futuras.
En la v1 la búsqueda usa `ILIKE` sobre `title` y `content_text`.

### 7.4 `assets`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK |
| `project_id` | `uuid` | FK a `projects`, `on delete cascade` |
| `owner_id` | `uuid` | FK a `users` |
| `storage_key` | `text` | Ruta relativa dentro de `/data/uploads` |
| `original_name` | `text` | |
| `mime_type` | `text` | |
| `byte_size` | `integer` | |
| `width` | `integer` | |
| `height` | `integer` | |
| `created_at` | `timestamptz` | |

Índice en `project_id`.

### 7.5 Reglas

- Todas las consultas de proyectos y assets incluyen `owner_id = usuario actual`; la autorización no depende solo de la UI.
- Borrar un proyecto elimina sus assets de la base y del volumen.
- El contenido se guarda como JSON de Tiptap; el HTML para PDF se genera al vuelo.
- El cliente nunca define `owner_id`, `content_text` ni `word_count`.
- Tamaño máximo del documento: 5 MB de JSON.
- Tamaño máximo por imagen: 10 MB.

---

## 8. API y acciones

### 8.1 Autenticación

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/auth/login` | Inicia sesión; rate limit por email/IP |
| `POST` | `/api/auth/logout` | Elimina la sesión actual |
| `GET` | `/api/auth/me` | Usuario y sesión actuales |

### 8.2 Proyectos

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/projects?q=` | Lista proyectos del usuario |
| `POST` | `/api/projects` | Crea un proyecto vacío |
| `GET` | `/api/projects/[id]` | Obtiene un proyecto |
| `PATCH` | `/api/projects/[id]` | Guarda título y/o contenido |
| `DELETE` | `/api/projects/[id]` | Elimina proyecto y assets |
| `POST` | `/api/projects/[id]/duplicate` | Duplica un proyecto |
| `POST` | `/api/projects/[id]/assets` | Sube una imagen |
| `GET` | `/api/assets/[id]` | Sirve una imagen autenticada |
| `DELETE` | `/api/assets/[id]` | Elimina una imagen |
| `POST` | `/api/projects/[id]/export/pdf` | Genera y descarga el PDF |

### 8.3 Administración

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/admin/users` | Lista usuarios (solo admin) |
| `POST` | `/api/admin/users` | Crea usuario (solo admin) |
| `PATCH` | `/api/admin/users/[id]` | Activa/desactiva, cambia rol o restablece contraseña |
| `PATCH` | `/api/account` | Cambia nombre o contraseña propios |

### 8.4 Convenciones

- Respuestas JSON con `{ data }` o `{ error: { code, message, details? } }`.
- Códigos HTTP: `400` validación, `401` no autenticado, `403` sin permiso, `404` no encontrado, `409` conflicto de revisión, `413` archivo demasiado grande, `429` rate limit, `500` error interno.
- Validación con Zod en todos los endpoints.
- Las mutaciones verifican `Origin`/`Referer` además de la cookie.
- Logs estructurados con `requestId`, usuario, ruta y duración; nunca se registran contraseñas ni tokens.

---

## 9. Editor Tiptap

### 9.1 Extensiones

- `StarterKit`: párrafos, encabezados, listas, citas, código, separador, historial.
- `TextStyleKit`: color, color de fondo, familia, tamaño, altura de línea.
- `TextAlign`.
- `Highlight` multicolor.
- `Underline`.
- `Link`.
- `TableKit`: tablas, filas, celdas y encabezados.
- `Image` extendida: `alt`, `caption`, `width`, `align`.
- `CodeBlockLowlight` + lenguajes de `lowlight`.
- `TaskList` y `TaskItem`.
- `Placeholder`.
- `CharacterCount`.
- `Typography`.
- `Superscript` y `Subscript`.
- `BubbleMenu` y `FloatingMenu` de Tiptap React.
- Menú de comandos `/` con `Suggestion`.

Todas las extensiones necesarias son open source/MIT. No se dependerá de Tiptap Pro, Collaboration, Comments ni AI Toolkit.

### 9.2 Toolbar

**Grupo historial**
- Deshacer, rehacer.

**Grupo párrafo**
- Selector de bloque: párrafo, H1, H2, H3, cita, código.
- Alineación: izquierda, centro, derecha, justificado.
- Listas: viñetas, numerada, tareas.

**Grupo formato**
- Negrita, cursiva, subrayado, tachado, código inline.
- Color de texto.
- Color de fondo.
- Familia tipográfica.
- Tamaño de fuente.
- Altura de línea.
- Enlace.
- Superíndice, subíndice.
- Limpiar formato.

**Grupo insertar**
- Imagen.
- Tabla.
- Bloque de código.
- Separador.

La toolbar muestra solo lo esencial; el resto vive en menús desplegables. En selección de texto aparece una burbuja con negrita, cursiva, subrayado, enlace, color y “más”.

### 9.3 Familias y tamaños

Familias empaquetadas:
- Inter (por defecto).
- Source Serif 4.
- Lora.
- JetBrains Mono.
- Georgia (fallback del sistema, incluida en la imagen si se puede).
- Arial/Helvetica (fallback del sistema).

Tamaños: 12, 14, 16, 18, 20, 24, 28, 32 px.
Alturas de línea: 1.2, 1.4, 1.6, 1.8, 2.0.

El PDF usa las mismas fuentes empaquetadas para evitar diferencias entre navegador y exportación.

### 9.4 Imágenes

- Subida por selector, arrastre o pegado.
- Validación por tipo real (no solo extensión), tamaño y dimensiones.
- Normalización con `sharp`: rotación EXIF, eliminación de metadatos, límite de 2400 px de lado mayor.
- Formatos aceptados: JPEG, PNG, WebP y GIF (el GIF se convierte a WebP estático en la v1).
- Al seleccionar una imagen se abre un inspector con:
  - Texto alternativo.
  - Leyenda.
  - Ancho: 25 %, 50 %, 75 %, 100 % o personalizado.
  - Alineación: izquierda, centro, derecha.
- La leyenda se guarda como atributo y se renderiza como `<figcaption>` en cursiva.
- En el PDF se conserva la leyenda y el ancho.

### 9.5 Código

- Bloques con resaltado de sintaxis.
- Lenguajes iniciales: TypeScript, JavaScript, Python, Bash, JSON, SQL, HTML, CSS, YAML, Go, Java, C#.
- Selector de lenguaje en el bloque.
- Botón de copiar.
- CSS de impresión con fondo claro, borde y tipografía monoespaciada.
- El contenido del bloque nunca se interpreta como HTML.

### 9.6 Tablas

- Insertar tabla 3×3 por defecto.
- Añadir/eliminar fila o columna.
- Alternar fila de encabezado.
- Combinar y dividir celdas.
- Ancho automático y scroll horizontal en el editor cuando sea necesario.
- En PDF, tablas con `break-inside: avoid` cuando sea posible y cabecera repetida.

### 9.7 Autoguardado

- Debounce de 800 ms tras el último cambio.
- Guardado inmediato al perder foco el título, al cambiar de documento y con `Ctrl/Cmd + S`.
- Estado visible: “Guardando…”, “Guardado”, “Error al guardar”, “Cambios sin guardar”.
- Reintento exponencial ante errores de red (3 intentos).
- `beforeunload` si hay cambios sin guardar.
- Control de concurrencia con `revision`; si hay conflicto, se muestra un diálogo para recargar o sobrescribir.
- El servidor recalcula texto plano, palabras y fecha de actualización.

### 9.8 Atajos

- `Ctrl/Cmd + S`: guardar.
- `Ctrl/Cmd + K`: buscar proyectos o insertar enlace, según contexto.
- `Ctrl/Cmd + B/I/U`: negrita, cursiva, subrayado.
- `Ctrl/Cmd + Alt + 1/2/3`: H1/H2/H3.
- `Ctrl/Cmd + Shift + 7/8`: lista numerada/con viñetas.
- `/`: menú de comandos.
- `Escape`: cerrar menús o diálogos.

---

## 10. Exportación PDF

### 10.1 Pipeline

```
POST /api/projects/:id/export/pdf
        │
        ▼
Validar sesión, ownership y opciones
        │
        ▼
Cargar proyecto y assets
        │
        ▼
Tiptap JSON → HTML semántico sanitizado
        │
        ▼
Incrustar fuentes e imágenes
        │
        ▼
HTML + CSS de impresión + Paged.js
        │
        ▼
Playwright Chromium
        │
        ▼
page.pdf({ preferCSSPageSize: true, printBackground: true })
        │
        ▼
PDF como descarga
```

### 10.2 Motor

Se usará **Paged.js + Playwright/Chromium**:
- Paged.js polyfilla las reglas de medios paginados y permite un índice con números de página reales mediante `target-counter(attr(href), page)`.
- Playwright imprime el resultado con el tamaño de página definido por CSS.
- Es una cadena open source (MIT + Apache-2.0) y evita depender de servicios externos.
- Si Paged.js falla en un documento, se usa un modo de respaldo con `page.pdf()` nativo: portada y encabezado/pie básicos, sin números en el índice. El fallo se registra y la UI lo informa.

### 10.3 Opciones

| Opción | Valores | Default |
|---|---|---|
| Tamaño | A4, Carta | A4 |
| Orientación | Vertical, horizontal | Vertical |
| Portada | Sí/no | Sí |
| Subtítulo de portada | Texto libre | Vacío |
| Fecha en portada | Sí/no | Sí |
| Índice | Sí/no | Sí |
| Profundidad del índice | H1, H1–H2 | H1–H2 |
| Encabezado | Sí/no | Sí |
| Pie | Sí/no | Sí |
| Numeración | Sí/no | Sí |
| Fecha en pie | Sí/no | No |

Las preferencias se guardan en `projects.settings` para la próxima exportación.

### 10.4 Diseño del PDF

- Portada: título, subtítulo, autor y fecha; sin imágenes en la v1.
- Índice: títulos y números de página; enlaces internos.
- Encabezado: título del documento en la parte superior, discreto.
- Pie: “Página X de Y” y fecha opcional.
- H1 comienza en página nueva.
- Evitar cortes dentro de imágenes, tablas y bloques de código cuando sea posible.
- Código con fondo, borde y tipografía monoespaciada.
- Leyendas de imágenes en cursiva y tamaño menor.
- Márgenes: 20 mm laterales, 22 mm superior/inferior (ajustables en el CSS).

### 10.5 Rendimiento y límites

- Un navegador Chromium persistente por proceso, con un máximo de 2 exportaciones concurrentes.
- Timeout de 90 segundos por exportación.
- Tamaño máximo de PDF resultante: 50 MB.
- Si hay una exportación en curso, la UI muestra progreso y permite cancelar.
- Los archivos temporales se eliminan siempre al terminar.
- No se almacenan PDFs en la base de datos.
- Chromium se ejecuta con `chromiumSandbox: false` dentro del contenedor rootless; solo procesa HTML generado por DocApp, nunca HTML arbitrario del cliente. Si se requiere el sandbox, se puede habilitar con los privilegios correspondientes.

---

## 11. Seguridad

### 11.1 Autenticación

- Contraseñas con Argon2id y parámetros razonables para el hardware del contenedor.
- Tokens de sesión de 32 bytes aleatorios; se guarda solo su HMAC-SHA256 con `APP_SECRET`.
- Cookie `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` configurable.
- Expiración absoluta de 30 días; se actualiza `last_used_at`.
- Logout elimina la sesión en base de datos y borra la cookie.
- Rate limit de login: 5 intentos fallidos por email/IP cada 15 minutos.
- Mensajes de error genéricos para no revelar si un email existe.

### 11.2 Autorización

- Middleware redirige a `/login` si no hay cookie de sesión.
- Cada consulta y mutación valida la sesión contra la base de datos.
- Cada consulta de proyecto incluye `owner_id`; un usuario no puede acceder a IDs ajenos.
- Las rutas de administración validan `role = 'admin'` en servidor.
- Los assets se sirven solo al propietario del proyecto.

### 11.3 Validación y XSS

- El contenido Tiptap se valida contra el esquema permitido antes de guardar.
- El HTML para PDF se genera desde el JSON, no desde HTML enviado por el cliente.
- Se sanitiza el HTML final con una allowlist de etiquetas y atributos.
- Enlaces: solo `http`, `https` y `mailto`; `rel="noopener noreferrer nofollow"`.
- Imágenes: solo assets internos; nunca `src` arbitrario.
- No se permite HTML crudo ni scripts.
- Zod valida tamaños, tipos y opciones de exportación.

### 11.4 Uploads

- Validación de tipo real con `file-type` además de `Content-Type`.
- Límite de 10 MB y de dimensiones.
- Re-encodeo con `sharp` para eliminar EXIF y payloads.
- Nombres de archivo generados por UUID; nunca se usa el nombre original como ruta.
- Almacenamiento fuera de `public/`; se sirve mediante ruta autenticada.
- `Content-Type` y `Content-Disposition` controlados por el servidor.

### 11.5 Infraestructura

- PostgreSQL no publica puertos al host.
- Contenedores rootless cuando sea posible.
- Secretos en `.env` fuera de Git; opción de Podman secrets.
- HTTPS mediante reverse proxy si la app se expone fuera de la red local.
- Cabeceras de seguridad: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`.
- CSP compatible con Next.js y Tiptap, sin `unsafe-eval` en producción.
- Dependencias auditadas con `pnpm audit` en CI.

---

## 12. Despliegue en Podman

### 12.1 Servicios

**app**
- Build multi-stage con Node 24.
- Next.js en modo `standalone`.
- Chromium y dependencias de Playwright instalados en la imagen final.
- Usuario no root.
- Volumen `/data/uploads`.
- Puerto `3000`.
- Healthcheck `GET /api/health`.

**db**
- Imagen `postgres:18-alpine`.
- Volumen `pgdata`.
- Sin puertos publicados.
- Healthcheck `pg_isready`.

### 12.2 `compose.yaml` (esquema)

```yaml
services:
  app:
    build: .
    env_file: .env
    ports:
      - "3000:3000"
    volumes:
      - uploads:/data/uploads
    depends_on:
      db:
        condition: service_healthy
    networks:
      - internal
    restart: unless-stopped

  db:
    image: postgres:18-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - internal
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  pgdata:
  uploads:

networks:
  internal:
    driver: bridge
```

### 12.3 Variables de entorno

```dotenv
APP_NAME=DocApp
APP_URL=http://localhost:3000
DATABASE_URL=postgres://docapp:change-me@db:5432/docapp
POSTGRES_DB=docapp
POSTGRES_USER=docapp
POSTGRES_PASSWORD=change-me
APP_SECRET=genera-un-secreto-largo
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me-now
ADMIN_NAME=Administrador
UPLOAD_DIR=/data/uploads
MAX_UPLOAD_MB=10
COOKIE_SECURE=false
TZ=America/Asuncion
```

`APP_SECRET` se usa para el HMAC de los tokens de sesión y para tokens temporales auxiliares. No se usa para hashear contraseñas. Si cambia, todas las sesiones existentes quedan invalidadas.

### 12.4 Arranque

```bash
cp .env.example .env
# editar .env y generar secretos
podman compose up -d --build
podman compose logs -f app
```

El entrypoint:
1. Espera a PostgreSQL.
2. Aplica migraciones.
3. Crea el admin inicial si no hay usuarios.
4. Arranca Next.js.

### 12.5 Operación

- **Backup de base:** `pg_dump` comprimido, retención configurable.
- **Backup de uploads:** tar del volumen.
- **Restore:** documentado y probado.
- **Actualización:** backup, `podman compose build`, migraciones, `up -d`.
- **Logs:** `podman compose logs`.
- **Salud:** `/api/health` verifica app y base.
- **Recursos sugeridos:** 2 vCPU y 2 GB RAM para app; 1 vCPU y 512 MB para db; 10 GB de disco.
- **TLS:** reverse proxy externo (Nginx/Caddy/Traefik) o perfil opcional; no se incluye en los dos contenedores base.

---

## 13. Calidad y pruebas

### 13.1 Unitarias

- Hash y verificación de contraseñas.
- Creación, validación y expiración de sesiones.
- Normalización de email.
- Validación de opciones de exportación.
- Generación de HTML desde JSON.
- Extracción de texto plano y conteo de palabras.
- Sanitización de enlaces y HTML.
- Slug de nombre de archivo PDF.

### 13.2 Integración

- Migraciones sobre PostgreSQL limpio.
- CRUD de proyectos con aislamiento por usuario.
- Autosave y conflicto de revisión.
- Subida de imagen válida e inválida.
- Borrado de proyecto con limpieza de assets.
- Creación de usuario por admin y restablecimiento de contraseña.
- Rate limit de login.

### 13.3 E2E

- Login correcto e incorrecto.
- Admin crea usuario; el usuario inicia sesión y cambia contraseña.
- Usuario A no puede abrir el proyecto de usuario B.
- Crear proyecto, escribir, recargar y verificar persistencia.
- Aplicar formato, insertar tabla, imagen y bloque de código.
- Exportar PDF con y sin índice; verificar que el archivo se descarga y contiene el texto esperado.
- Exportar PDF con portada y numeración.
- Eliminar proyecto y verificar que desaparece.
- Responsive básico en viewport de tablet.

### 13.4 PDF

- Verificar cantidad de páginas y texto con `pdf-parse`.
- Verificar que el índice contiene los títulos y números de página.
- Verificar que no hay páginas en blanco.
- Verificar que las imágenes y leyendas aparecen.
- Prueba de regresión visual de la primera página y de una página con código.
- Prueba de documento grande (20–30 páginas).

### 13.5 Calidad de código

- `pnpm lint`.
- `pnpm typecheck`.
- `pnpm test`.
- `pnpm test:e2e`.
- `pnpm build`.
- CI opcional con GitHub Actions o script local `scripts/ci.sh`.

---

## 14. Fases de implementación

### Fase 1 — Fundaciones

- Scaffold de Next.js, TypeScript, Tailwind y shadcn/ui.
- Tokens de diseño y layout base.
- Esquema Drizzle, migraciones y conexión.
- Auth: login, logout, sesiones, rate limit.
- Bootstrap del administrador.
- Shell de la app y sidebar.
- Healthcheck.

**Entregable:** se puede iniciar sesión y ver un layout vacío con la base de datos funcionando.

### Fase 2 — Proyectos y editor base

- CRUD de proyectos.
- Listado, búsqueda, duplicado y eliminación.
- Página de editor con título.
- Tiptap con extensiones base.
- Autoguardado, revisión y estados.
- Toolbar inicial y atajos.

**Entregable:** se crea un proyecto, se escribe y se recarga sin perder contenido.

### Fase 3 — Editor completo

- Formato inline avanzado.
- Tablas.
- Imágenes con subida, leyenda e inspector.
- Bloques de código con resaltado.
- Menú flotante y menú `/`.
- Panel de esquema.
- Pulido visual y responsive.

**Entregable:** un documento realista se puede escribir y editar con la misma comodidad que en un procesador de textos.

### Fase 4 — PDF

- Generación de HTML de impresión.
- CSS de página, fuentes e imágenes.
- Paged.js y Playwright.
- Portada, índice, encabezado, pie y numeración.
- Diálogo de exportación y descarga.
- Pruebas de PDF y fallback.

**Entregable:** PDF descargable, con o sin índice, con aspecto profesional.

### Fase 5 — Administración, despliegue y endurecimiento

- Administración de usuarios.
- Cambio de contraseña y ajustes de cuenta.
- Dockerfile multi-stage.
- `compose.yaml`, entrypoint, migraciones y backups.
- Pruebas E2E.
- Documentación de despliegue y operación.
- Revisión de seguridad y accesibilidad.

**Entregable:** app desplegable en Podman desde cero, con documentación y backups.

---

## 15. Criterios de aceptación

La v1 se considera terminada cuando:

- [ ] Se puede desplegar en un host limpio con `podman compose up -d --build`.
- [ ] El administrador inicial puede iniciar sesión y crear usuarios.
- [ ] Un usuario solo puede ver y modificar sus propios proyectos.
- [ ] Se puede crear, renombrar, duplicar y eliminar un proyecto.
- [ ] El contenido sobrevive a recargas y reinicios de contenedores.
- [ ] Se puede aplicar todo el formato de texto y párrafo definido en el alcance.
- [ ] Se pueden insertar tablas, imágenes con leyenda y bloques de código.
- [ ] El autoguardado informa su estado y maneja conflictos.
- [ ] El PDF se genera con las opciones elegidas y se descarga correctamente.
- [ ] El índice del PDF enlaza y numera correctamente las secciones.
- [ ] Las imágenes y leyendas se ven bien en el PDF.
- [ ] Un usuario no puede acceder a assets ajenos.
- [ ] Los uploads inválidos se rechazan.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e` y `pnpm build` pasan.
- [ ] Existe documentación de backup y restore.
- [ ] La interfaz es usable en desktop y tablet.

---

## 16. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Paged.js no está muy activo | Medio | Versión fijada, pruebas de PDF y fallback a `page.pdf()` sin números en el índice. |
| Chromium consume mucha memoria | Medio | Límite de concurrencia, timeout, monitoreo y 2 GB de RAM. |
| Diferencias de fuentes entre editor y PDF | Medio | Fuentes empaquetadas y CSS compartido. |
| Pérdida de contenido por autosave | Alto | Revisión optimista, reintentos, aviso al salir y guardado manual. |
| XSS por contenido pegado | Alto | JSON validado, HTML generado en servidor, sanitización y allowlist. |
| Crecimiento de imágenes | Medio | Límite de 10 MB, re-encodeo y límite de dimensiones. |
| Conflictos de edición en dos pestañas | Bajo | `revision` y diálogo de conflicto. |
| Podman Compose no soporta alguna directiva | Bajo | Probar con `podman compose` y `podman-compose`; documentar diferencias. |
| Tiptap cambia de versión | Medio | Versiones fijadas y tests de serialización. |
| Documentos muy grandes | Medio | Límite de 5 MB, prueba de 30 páginas y timeout de PDF. |
| Exposición sin TLS | Alto | Guía de reverse proxy y cookies seguras. |

---

## 17. Decisiones abiertas

Estas no bloquean el inicio, pero conviene resolverlas antes de la Fase 4:

1. **Nombre definitivo y branding.** Por ahora se usa `DocApp`, configurable con `APP_NAME`.
2. **Tamaño de página por defecto.** Se propone A4; Carta queda disponible.
3. **Índice con números de página.** Decidido: se implementará con Paged.js. Si se vuelve inestable, el plan B es un índice con enlaces sin números.
4. **Exposición a internet.** Decidido: solo red local/VPN en la v1. TLS queda documentado para una exposición futura.
5. **Modo oscuro.** Implementado: oscuro por defecto, con toggle a claro y preferencia persistente en el navegador. El PDF se mantiene en claro.

---

## 18. Referencias técnicas

- Tiptap: https://tiptap.dev/
- Tiptap open source: https://tiptap.dev/open-source-to-platform
- Next.js: https://nextjs.org/
- Drizzle ORM: https://orm.drizzle.team/
- Paged.js: https://pagedjs.org/
- Playwright: https://playwright.dev/
- PostgreSQL: https://www.postgresql.org/
- Podman: https://podman.io/
