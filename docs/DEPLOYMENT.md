# 🚀 Despliegue — Arrow Maze Backend

Guía **autocontenida** para dejar este backend desplegado en producción sobre
**[Fly.io](https://fly.io)** con un **volumen persistente**, manteniendo la
persistencia actual en archivos JSON (sin base de datos).

> **Público objetivo:** cualquiera del equipo que necesite desplegar o redeployar
> la API. No asume conocimiento previo de Fly.io. Sigue las fases en orden.

---

## 1. Por qué esta arquitectura de despliegue

Dos restricciones del código **mandan** sobre la elección de plataforma:

| Restricción | Origen en el código | Consecuencia |
|-------------|---------------------|--------------|
| **Proceso siempre vivo** | Cron job `BlacklistCleanupJob` (`node-cron`, purga diaria 03:00) | Nada serverless/efímero (Vercel, Netlify Functions, Cloud Run sin volumen): el cron moriría. |
| **Disco escribible persistente** | Repositorios JSON: `path.resolve(process.cwd(), 'data', …)` en `src/infrastructure/repositories/` | Se necesita un **volumen** que sobreviva a reinicios y redeploys, o migrar a una BD. |

**Fly.io** cumple ambas con su capa casi-gratuita: máquina siempre encendida
(`min_machines_running = 1`) + volumen persistente barato (~1–3 USD/mes de uso
real). Render en free tier **no** ofrece disco persistente y Railway ya no da
volumen gratis, por eso se descartan para esta estrategia.

### Decisiones cerradas
- **Persistencia:** JSON en disco **tal cual**, sobre un volumen montado en `/app/data`.
- **Plataforma:** Fly.io, instancia única.
- **Sin migración a BD** (ver [Apéndice B](#apéndice-b--camino-alternativo-migrar-a-postgres) si esto cambia en el futuro).

---

## 2. Cómo funciona la persistencia en este despliegue

- `data/` está en **`.gitignore`** (contiene hashes de contraseñas), así que el
  volumen **arranca vacío** en el primer deploy.
- El `docker-entrypoint.sh` detecta que `data/levels.json` no existe y **corre el
  seed una sola vez** para poblar los niveles. En redeploys posteriores el archivo
  ya existe y **el seed se omite** (no pisa datos).
- `accounts.json`, `progress.json` y `blacklist.json` se crean solos en runtime al
  primer registro / progreso / logout.
- El seed (`pnpm seed` → `tsx src/seed.ts`; en producción `node dist/seed.js`, compilado por el build) lee `seeds/levels.seed.json`
  (versionado en git) y siembra `data/levels.json`. Por eso la imagen runtime debe
  incluir `src/`, `scripts/`, `seeds/` y `tsx` (viene en `node_modules`).

---

## 3. Variables de entorno

| Variable | Dónde se define | Obligatoria | Notas |
|----------|-----------------|:-----------:|-------|
| `NODE_ENV` | `fly.toml` `[env]` | ✅ | **Debe ser `production`.** Apaga los bypasses locales de auth/rol (`Login.ts`, `AuthMiddleware.ts`, `RequireRoleMiddleware.ts`). |
| `PORT` | `fly.toml` `[env]` | — | El server usa `process.env.PORT || 3000`. Se fija en `3000` para casar con `internal_port`. |
| `JWT_SECRET` | `fly secrets` | ✅ | El server **no arranca** sin él. Secreto fuerte y aleatorio. **No reutilices** el de `.env.local`. |
| `CORS_ORIGIN` | `fly secrets` | ✅ (en la práctica) | Lista separada por comas de orígenes permitidos del cliente. Sin él, solo se permiten los orígenes locales de desarrollo. |
| `LEVELS_SKIP_ROLE_CHECK` | — | ❌ **NO definir** | Bypass de rol solo para desarrollo local. En prod queda ausente. Además está guardado por `NODE_ENV !== 'production'`. |

### Orígenes CORS del cliente
El cliente `arrowmaze-game` es Capacitor:
- **Android** → `http://localhost`
- **iOS** → `capacitor://localhost`
- **Build web** (si existe) → su URL pública, p. ej. `https://arrowmaze.example.com`

Ejemplo de valor:
```
CORS_ORIGIN=https://arrowmaze.example.com,capacitor://localhost,http://localhost
```

### Generar un `JWT_SECRET` fuerte
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## 4. Archivos a añadir al repo

Crea estos cuatro archivos en la **raíz** del repo. Todos son nuevos; ninguno
requiere tocar código de `src/`.

### 4.1 `Dockerfile`
```dockerfile
# ---- Build: instala TODAS las deps y compila TypeScript ----
FROM node:24-slim AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# ---- Runtime ----
FROM node:24-slim AS runtime
RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production
# node_modules del build incluye tsx (lo usa el seed del entrypoint)
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/seeds ./seeds
COPY --from=build /app/package.json ./package.json
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh && mkdir -p data
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
```

> **Nota:** se copia `node_modules` completo (con `tsx`) para que el seed corra sin
> cambios en `package.json`. Si prefieres una imagen más ligera, compila el seed a
> `dist/` y usa `pnpm install --prod`; queda como optimización opcional.

### 4.2 `.dockerignore`
```gitignore
node_modules
dist
data
tests
coverage
docs
.git
.github
.env
.env.*
*.log
*.tmp
```

> `data` se excluye a propósito: los datos los provee el **volumen**, no la imagen.

### 4.3 `docker-entrypoint.sh`
```sh
#!/bin/sh
set -e

if [ ! -f /app/data/levels.json ]; then
  echo "[entrypoint] data/levels.json no existe — sembrando niveles iniciales..."
  pnpm seed
else
  echo "[entrypoint] data/levels.json ya existe — se omite el seed."
fi

echo "[entrypoint] iniciando servidor..."
exec node dist/index.js
```

### 4.4 `fly.toml`
```toml
app = "arrowmaze-backend"
primary_region = "mia"   # cámbiala a la región más cercana a tus usuarios

[build]

[env]
  PORT = "3000"
  NODE_ENV = "production"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = false      # el cron necesita el proceso siempre vivo
  auto_start_machines = true
  min_machines_running = 1        # instancia única — NO escalar (ver Riesgos)

  [[http_service.checks]]
    interval = "30s"
    timeout = "5s"
    grace_period = "15s"
    method = "GET"
    path = "/docs/"               # Swagger UI; si no da 200, usa /api/levels

[mounts]
  source = "arrowmaze_data"
  destination = "/app/data"

[[vm]]
  size = "shared-cpu-1x"
  memory = "256mb"
```

> **Health check:** `/docs/` (Swagger) debe devolver 200. Si en tu caso redirige o
> falla, cámbialo a una ruta pública que devuelva 200 (p. ej. `GET /api/levels`) o
> añade un endpoint `/health` mínimo en `src/index.ts`.

---

## 5. Fases del despliegue

### Fase 1 · Preparación local (una sola vez)
```bash
# Instalar el CLI de Fly
curl -L https://fly.io/install.sh | sh    # macOS/Linux
# Iniciar sesión / crear cuenta
fly auth signup     # o: fly auth login
```

Añade los cuatro archivos de la sección 4 y verifica que la imagen construye:
```bash
docker build -t arrowmaze-backend .       # opcional, valida el Dockerfile localmente
```

### Fase 2 · Provisionar la app y el volumen
```bash
# Crea la app en Fly SIN desplegar todavía (detecta el Dockerfile y fly.toml)
fly launch --no-deploy

# Crea el volumen persistente (1 GB sobra para JSON) en la MISMA región del fly.toml
fly volumes create arrowmaze_data --size 1 --region mia
```

### Fase 3 · Configurar secretos
```bash
fly secrets set \
  JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")" \
  CORS_ORIGIN="https://<tu-front>,capacitor://localhost,http://localhost"
```

> `NODE_ENV` y `PORT` ya van en `fly.toml`. `LEVELS_SKIP_ROLE_CHECK` **no se define**.

### Fase 4 · Desplegar
```bash
fly deploy
```

---

## 6. Verificación post-deploy

```bash
# Logs: confirma el seed en el PRIMER arranque y "iniciando servidor"
fly logs

# URL pública
fly open            # abre https://arrowmaze-backend.fly.dev
```

Checklist funcional:
- [ ] `GET https://<app>.fly.dev/docs/` → Swagger UI carga (200).
- [ ] `GET https://<app>.fly.dev/api/levels` → devuelve los niveles sembrados.
- [ ] Registro de un usuario → login → recibe **JWT** (valida bcrypt + escritura en volumen).
- [ ] Guardar progreso y consultar leaderboard de un nivel.
- [ ] **Prueba de persistencia:** `fly deploy` de nuevo (o `fly apps restart`) y
      confirma que el usuario/progreso creados **siguen ahí** → el volumen persiste.
- [ ] Con `NODE_ENV=production`, un `POST` a rutas de admin **sin** token de rol
      correcto debe ser **rechazado** (los bypasses están apagados).

---

## 7. Fase 5 · Cierre e integración

- Apuntar el cliente `arrowmaze-game` a la nueva URL base:
  `https://<app>.fly.dev`.
- Commit modular en rama `feat/deploy-flyio` (convención de commits en español):
  un commit para los artefactos de despliegue, otro para la doc.
  ```bash
  git checkout -b feat/deploy-flyio
  git add Dockerfile .dockerignore docker-entrypoint.sh fly.toml
  git commit -m "feat(deploy): añade artefactos de despliegue para Fly.io"
  git add docs/DEPLOYMENT.md
  git commit -m "docs(deploy): documenta el despliegue en Fly.io con volumen persistente"
  ```
- Enlazar esta guía desde el `README.md` principal.

---

## 8. Operación día a día

| Acción | Comando |
|--------|---------|
| Ver logs en vivo | `fly logs` |
| Reiniciar la app | `fly apps restart` |
| Redeploy tras cambios | `fly deploy` |
| Entrar por SSH a la máquina | `fly ssh console` |
| Inspeccionar los datos | `fly ssh console -C "cat /app/data/accounts.json"` |
| Backup manual del volumen | `fly ssh console -C "tar czf - /app/data" > backup-$(date +%F).tar.gz` |
| Re-sembrar niveles | actualiza `seeds/levels.seed.json`, borra `data/levels.json` en el volumen y redeploy, **o** `fly ssh console -C "cd /app && pnpm seed"` |
| Cambiar un secreto | `fly secrets set CLAVE="valor"` (redespliega solo) |

---

## 9. Riesgos y límites (conócelos)

- **Instancia única, sin backups automáticos.** Si el volumen se corrompe o se
  borra, se pierden `accounts` y `progress`. Aceptable para un demo académico;
  haz **backups manuales** periódicos (sección 8). Es el principal disparador para
  migrar a Postgres ([Apéndice B](#apéndice-b--camino-alternativo-migrar-a-postgres)).
- **No escalar a >1 máquina.** Los repositorios JSON serializan escrituras **dentro
  de un solo proceso**; con dos máquinas sobre el mismo volumen habría corrupción de
  datos. `min_machines_running = 1` y no aumentar el conteo.
- **Región única.** La latencia depende de dónde estén los usuarios; elige
  `primary_region` en consecuencia.
- **El volumen no se replica** entre regiones ni es un sistema de archivos de red.

---

## Apéndice A · Solución de problemas

| Síntoma | Causa probable | Arreglo |
|---------|----------------|---------|
| El server no arranca, error de JWT | `JWT_SECRET` ausente | `fly secrets set JWT_SECRET=...` |
| El front recibe error de CORS | `CORS_ORIGIN` no incluye el origen real | Añade el origen exacto (con esquema, sin barra final) y redeploy |
| Los datos se pierden en cada deploy | El volumen no está montado o `[mounts]` mal configurado | Verifica `fly volumes list` y el `destination = "/app/data"` |
| Bypass de auth activo en prod | `NODE_ENV` no es `production` | Confírmalo en `fly.toml [env]`; los guards dependen de él |
| Health check falla, la máquina no queda healthy | `/docs/` no devuelve 200 | Cambia el `path` del check a `/api/levels` o añade `/health` |
| El seed no corre | `data/levels.json` ya existe en el volumen | Es el comportamiento esperado; para re-sembrar, bórralo primero |

---

## Apéndice B · Camino alternativo: migrar a Postgres

Si el proyecto necesita robustez (backups gestionados, concurrencia real, escalar
horizontalmente), el disparador es reemplazar la persistencia JSON:

1. Provisionar un Postgres gestionado (Neon o Supabase, free tier).
2. Reescribir los cuatro repositorios en `src/infrastructure/repositories/`
   (`JsonAccountRepository`, `JsonSessionRepository`, `JsonLevelRepository`,
   `JsonProgressRepository`) contra sus interfaces de dominio — **el dominio y la
   aplicación no cambian** gracias a Clean Architecture.
3. Sustituir el seed de archivo por migraciones/seed de BD.
4. Al no depender de disco, se puede quitar el volumen, permitir `auto_stop_machines`
   y escalar a varias instancias.

Es trabajo de infraestructura real y toca el estado congelado del repo (v1.0.x);
por eso queda como camino futuro, no como parte de este despliegue.

---

## Apéndice C · Despliegue actual — Railway (jul 2026)

El despliegue activo vive en **Railway** (la estrategia Fly.io de esta guía quedó
como referencia; los requisitos de la sección 1 aplican idénticos).

> **Ownership:** el proyecto de Railway vive en la cuenta personal de **Juan
> (mayojuandavid)**. Cualquier redeploy, cambio de variables o ajuste del servicio
> se coordina con él.

- **URL:** `https://arrowmaze-backend-production.up.railway.app`
  (API bajo `/api/v1`, Swagger en `/api/docs`).
- **Proyecto/servicio:** `arrowmaze-backend` · volumen `arrowmaze-backend-volume`
  montado en `/app/data` (persistencia verificada con redeploy).
- **Variables del servicio:** `JWT_SECRET`, `NODE_ENV=production`, `CORS_ORIGIN`
  (valores en Railway → servicio → Variables; `PORT` la inyecta la plataforma y
  `LEVELS_SKIP_ROLE_CHECK` no se define).
- **Settings obligatorios:** **Serverless OFF** (el cron de las 03:00 muere si la
  máquina duerme) y Restart Policy `On Failure`. No escalar a >1 réplica (sección 9).
- **Siembra:** automática e idempotente vía `docker-entrypoint.sh` — al boot, si no
  existe `data/levels.json`, corre `node dist/seed.js` (seed compilado desde
  `src/seed.ts` por el build normal; sin tsx en producción). No hay paso manual.
- **Redeploy:** `railway up` desde la raíz del repo (sube el working tree local) o
  `railway redeploy` para reiniciar la imagen actual.
