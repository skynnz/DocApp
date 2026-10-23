# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN npm install -g pnpm@11.28.5
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

FROM builder AS runtime-deps
RUN mkdir -p /runtime-deps/node_modules \
    && cp -r node_modules/.pnpm/drizzle-orm@*/node_modules/drizzle-orm /runtime-deps/node_modules/ \
    && cp -r node_modules/.pnpm/postgres@*/node_modules/postgres /runtime-deps/node_modules/ \
    && cp -r node_modules/.pnpm/playwright@*/node_modules/playwright /runtime-deps/node_modules/ \
    && cp -r node_modules/.pnpm/playwright-core@*/node_modules/playwright-core /runtime-deps/node_modules/

FROM mcr.microsoft.com/playwright:v1.64.1-noble AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/scripts/migrate.mjs ./scripts/migrate.mjs
COPY --from=builder /app/scripts/bootstrap-admin.mjs ./scripts/bootstrap-admin.mjs
COPY --from=builder /app/scripts/entrypoint.sh ./scripts/entrypoint.sh

# Dependencias que usan los scripts de arranque y que Next no traza.
COPY --from=runtime-deps /runtime-deps/node_modules/ ./node_modules/
COPY --from=runtime-deps /runtime-deps/node_modules/playwright ./node_modules/.pnpm/playwright@1.64.1/node_modules/playwright
COPY --from=runtime-deps /runtime-deps/node_modules/playwright-core ./node_modules/.pnpm/playwright-core@1.64.1/node_modules/playwright-core

RUN sed -i 's/\r$//' ./scripts/entrypoint.sh \
    && chmod +x ./scripts/entrypoint.sh \
    && mkdir -p /data/uploads

EXPOSE 3000

CMD ["./scripts/entrypoint.sh"]
