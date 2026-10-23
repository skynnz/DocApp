#!/bin/sh
set -eu

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
COMPOSE_PROJECT="${COMPOSE_PROJECT:-docapp}"

mkdir -p "$BACKUP_DIR"

echo "Respaldando PostgreSQL..."
podman compose exec -T db pg_dump -U "${POSTGRES_USER:-docapp}" "${POSTGRES_DB:-docapp}" \
  | gzip > "$BACKUP_DIR/db-$TIMESTAMP.sql.gz"

echo "Respaldando imágenes..."
podman compose exec -T app tar czf - -C /data uploads \
  > "$BACKUP_DIR/uploads-$TIMESTAMP.tar.gz"

echo "Backups creados en $BACKUP_DIR"
ls -lh "$BACKUP_DIR"/*"$TIMESTAMP"*
