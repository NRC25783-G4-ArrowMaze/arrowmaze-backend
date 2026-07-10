### 2026-07-06 — F2 extensión: seed idempotente + CORS + documentación

- **Herramienta:** Claude / Cursor
- **Modelo / versión:** claude-fable-5 (exploración/diseño), claude-haiku-4-5 (Fase 2 backend), claude-opus-4-8 (Fase 3 cliente), claude-fable-5 (docs/E2E)
- **Autor humano responsable:** Jrgil20
- **Prompt(s) representativo(s):**
  - "Veo que Santiago ya escribió el feature para F2 API de distribución y actualización de definiciones de niveles, quiero empezar a implementarlo con un plan. Ese plan debe considerar que en el repositorio arrowmaze-game ya hay como dos niveles iniciales que fueron usados para probar uno básico y otro con forma de corazón."
  - "Diseña un plan de implementación detallado para completar el feature F2... de punta a punta (backend + cliente). NO implementes nada; devuelve el plan."
  - "Termina lo que estabas probando" (verificación E2E)
- **Salida tomada de la IA:**
  - **Backend:**
    - `src/infrastructure/seeding/LevelSeeder.ts` — upsert idempotente de niveles reutilizando ManageLevel (valida + evita duplicados)
    - `scripts/seed-levels.ts` — entrypoint que carga seeds/levels.seed.json y siembra en data/levels.json
    - `seeds/levels.seed.json` — versionado con 2 niveles (sample-level-2, heart-preview) en contrato C2
    - `tests/infrastructure/seeding/LevelSeeder.spec.ts` — 5 specs: insert, idempotencia, overwrite, preservación, validación
    - `src/index.ts` — middleware `cors()` (prerequisito para fetch desde :5173)
    - `package.json` — script `pnpm seed`, deps `cors` + `@types/cors`
  - **Cliente (scripts de exportación, reutilizado en seed backend):**
    - `scripts/export-levels-seed.ts` — exporta SAMPLE_LEVEL_2 + HEART_SCENE a JSON de seed
  - **Documentación:**
    - `README.md`: tabla de features actualizada (F2/F3/F4 ✅), comandos (pnpm seed), nota sobre data/ gitignoreado, endpoints de niveles/progreso/leaderboard
    - `docs/README.md`: matriz de features backends actualizada
- **Modificaciones manuales del equipo:** Ninguna (la IA generó código listo para usar; tests 80/80 pasando al primer intento)
- **Validación realizada:**
  - Jest suite: 80/80 tests pasando (20 suites)
  - TypeScript: build sin errores
  - E2E con curl: catálogo, filtro difficulty, 404, 401, CORS preflight ✓
  - Idempotencia: `pnpm seed` segunda vez → 0 created / 2 updated ✓
  - Lint: ESLint sin warnings

---

#### 📋 Resumen de la sesión backend

- **Duración estimada:** 12 turnos / ~45 minutos (exploración + diseño + implementación + E2E)
- **Contexto:** F2 backend ya estaba implementado (feature18). Tarea reenfocada a **extensión**: poblar con contenido (seed idempotente), habilitarCORS, y actualizar documentación. El cliente (arrowmaze-game) consumiría la API con fallback offline-first.
- **Decisiones clave:**
  - Seed via `ManageLevel` (no directo al repo): reutiliza validación Gherkin, evita duplicados
  - CORS antes de los routers: prerequisito para que el preflight OPTIONS no llegue a las rutas
  - `seeds/levels.seed.json` versionado (re-generable con script de game): fuente de verdad offline
- **Patrones de uso:** Directivo + exploratorio (usuario pidió plan primero, luego aprobó alcance specific; IA ejecutó en fases)
