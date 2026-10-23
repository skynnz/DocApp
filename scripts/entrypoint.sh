#!/bin/sh
set -eu

echo "Aplicando migraciones..."
node scripts/migrate.mjs

echo "Verificando administrador inicial..."
node scripts/bootstrap-admin.mjs

echo "Iniciando DocApp..."
exec node server.js
