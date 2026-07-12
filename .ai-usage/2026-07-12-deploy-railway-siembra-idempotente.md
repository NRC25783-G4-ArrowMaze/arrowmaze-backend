### 2026-07-12 — Despliegue en Railway con siembra idempotente del volumen

- **Herramienta:** Claude Code (CLI)
- **Modelo / versión:** Claude Fable 5
- **Autor humano responsable:** Juan David
- **Prompt(s) representativo(s):**
  - "CAMBIO DE PLAN DE DESPLIEGUE: Fly.io queda descartado (problema de cuenta). Nueva
    plataforma: RAILWAY con mi cuenta personal. Misma misión, mismo rigor."
  - "el docker-entrypoint.sh DEBE tener finales LF, no CRLF […] ANTES del deploy
    verifícalo empíricamente (lee los bytes y confirma que no hay \r\n)"
  - "sembrar solo si NO existe data/levels.json […] el check va por la EXISTENCIA DEL
    ARCHIVO, no por 'directorio vacío'"
- **Salida tomada de la IA:**
  - **Entrypoint de siembra** \[CREATE\] — `docker-entrypoint.sh`: al boot, si no existe
    `/app/data/levels.json` corre `node dist/seed.js` (una sola vez por volumen); luego
    `exec node dist/index.js` (Node como PID 1 para las señales de stop). Es el mecanismo
    que `docs/DEPLOYMENT.md` especificaba y nunca se había implementado. Check por
    existencia del archivo, inmune a la basura del mount (`lost+found`).
  - **Seed compilado a dist/** \[MOVE\] — `scripts/seed-levels.ts` → `src/seed.ts` (imports
    ajustados; la resolución por `process.cwd()` no cambió): el `pnpm build` existente lo
    emite como `dist/seed.js` y producción lo corre con node pelado — cero `tsx` en la
    imagen final, compatible con el `pnpm prune --prod` del Dockerfile. `package.json`
    \[MODIFY\]: `"seed": "tsx src/seed.ts"`.
  - **Dockerfile** \[MODIFY\] — `CMD ["pnpm","run","start"]` → `ENTRYPOINT ["sh",
    "./docker-entrypoint.sh"]` (con `sh` explícito para no depender del bit de ejecución
    tras checkouts en Windows).
  - **`.gitattributes`** \[CREATE\] — `*.sh text eol=lf`: la imagen slim muere con CRLF
    ("not found^M"); verificado empíricamente en bytes (0 CR) antes del deploy.
  - **Aprovisionamiento Railway** (cuenta personal, vía CLI): proyecto/servicio
    `arrowmaze-backend`, volumen `arrowmaze-backend-volume` montado en `/app/data`,
    variables `JWT_SECRET` (48 bytes nuevo, causa raíz del crash-loop anterior:
    `SharedSecurityFactory` lanza si falta), `NODE_ENV=production` y `CORS_ORIGIN`
    (6 orígenes: Vite dev/preview + WebView Capacitor), dominio público generado.
- **Modificaciones manuales del equipo:** el humano fijó plataforma y candados (commits
  locales, cero push durante el deploy), el criterio exacto de idempotencia, el valor final
  de `CORS_ORIGIN` (añadió `http://localhost` y `http://localhost:4173`), y verificó en el
  dashboard Serverless OFF (requisito del cron de las 03:00) y Restart Policy On Failure.
- **Validación realizada:** local: Jest **109/109 en 27 suites**, `tsc -p tsconfig.build.json`
  limpio. En producción: siembra del primer boot (`17 creados, 0 actualizados`); smoke tests
  contra la URL pública — `GET /api/v1/levels` 200, register 201 (escritura en volumen),
  login 200 con JWT rol `USER` (bypass apagado), `GET /api/v1/progress` 200 con token y 401
  sin token; **persistencia demostrada** con `railway redeploy`: la cuenta de prueba
  sobrevivió, 17 niveles sin duplicar y el log del segundo boot mostró
  `[entrypoint] data/levels.json ya existe - se omite el seed.`

---
#### 📋 Resumen de la sesión
- **Duración estimada de la sesión:** ~10 turnos de usuario (incluye una Fase 0 sobre Fly.io
  descartada por problema de cuenta).
- **Contexto de la conversación:** el deploy anterior crasheaba en loop al boot por
  `JWT_SECRET` ausente; el runbook `docs/DEPLOYMENT.md` exige proceso siempre vivo (node-cron)
  y disco persistente (repos JSON). Se ejecutó el despliegue completo en Railway en modo
  pair-programming paso a paso con confirmación humana por comando.
- **Decisiones clave tomadas:**
  1. **Seed compilado, no interpretado:** mover el entrypoint del seed a `src/` para que el
     build normal lo emita en `dist/` — descartadas las alternativas de reimplementarlo como
     script plano (duplicaba la lógica de `LevelSeeder`/`ManageLevel`) o conservar `tsx` en
     producción.
  2. **Idempotencia por existencia de archivo** (`data/levels.json`), no por "directorio
     vacío": el mount puede crear `lost+found`.
  3. **LF forzado por `.gitattributes` y verificado en bytes** antes de subir: `railway up`
     sube el working tree local, así que lo que importa es el archivo en disco.
- **Patrones de uso observados:** pair programming estrictamente gated — el humano autorizó
  cada acción de infraestructura una a una y aportó los edge cases de plataforma (CRLF en
  Windows, `lost+found`, política de contraseñas del register descubierta durante el smoke
  test); la IA ejecutó, verificó empíricamente y reportó evidencia antes de cada paso.

**Notas / follow-ups:**
- Rama `fix/deploy-railway` hacia `develop`. URL: `https://arrowmaze-backend-production.up.railway.app`.
- Hallazgos para coordinar: el seed siembra `sample-level-2` (nivel de muestra) en producción;
  el banner de arranque dice "Entorno: Desarrollo" hardcodeado (`src/index.ts:88`); el
  frontend (`api-config.ts` en arrowmaze-game) apunta por default a `/api` pero el backend
  sirve `/api/v1` — falta el `v1` al configurar `VITE_API_URL`.
- El usuario de prueba `smoketest.claude@arrowmaze.dev` quedó en el volumen como canario de
  persistencia; puede borrarse cuando exista tooling de admin.
