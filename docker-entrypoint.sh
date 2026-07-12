#!/bin/sh
set -e

if [ ! -f /app/data/levels.json ]; then
  echo "[entrypoint] data/levels.json no existe - sembrando niveles iniciales..."
  node dist/seed.js
else
  echo "[entrypoint] data/levels.json ya existe - se omite el seed."
fi

echo "[entrypoint] iniciando servidor..."
exec node dist/index.js
