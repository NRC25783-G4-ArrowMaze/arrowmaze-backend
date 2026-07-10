### 2026-07-10 — Seed: registra los 5 niveles del mapa del cliente

- **Herramienta:** Claude Code (claude.ai/code)
- **Modelo / versión:** Claude Fable 5
- **Autor humano responsable:** Juan David
- **Prompt(s) representativo(s):**
  - "El seed del backend solo registra sample-level-2 y heart-preview — los 5 niveles del mapa del cliente NO están en el registro. Consecuencia: GET /api/v1/leaderboards/level-initial → 404 (LevelRegistryError) para niveles legítimos del mapa."
  - "Genera el JSON con toLevelDataDTO (el mismo mecanismo del exportador) y commitea SOLO seeds/levels.seed.json regenerado."
- **Salida tomada de la IA:**
  - `seeds/levels.seed.json` \[MOD\] — regenerado con **7 niveles**: los 2 distribuidos existentes (`sample-level-2` "Laberinto 6×6"/medium, `heart-preview` "Corazón"/easy, intactos) + los **5 niveles del mapa del cliente**, proyectados con `toLevelDataDTO()` (contrato C2, sin col/row ni color) desde `LOCAL_LEVELS` de arrowmaze-game, con name/difficulty espejados de `LEVEL_METADATA`:
    - `level-initial` — "Nivel Inicial" / easy
    - `level-intermediate-a` — "Desafío A" / medium
    - `level-intermediate-b` — "Desafío B" / medium
    - `level-advanced` — "Avanzado" / hard
    - `level-expert` — "Experto" / veryHard
- **Modificaciones manuales del equipo:**
  - El JSON se generó con un script temporal en el repo del cliente (mismo mecanismo que `scripts/export-levels-seed.ts`), no versionado en ningún repo. Formalizar el exportador para incluir los niveles del mapa es un follow-up aparte en arrowmaze-game.
- **Validación realizada:**
  - `pnpm seed` → idempotente: **0 creados, 7 actualizados** (upsert por id, LevelSeeder).
  - Jest suite del backend: **109/109 tests, 27 suites** ✅.
  - E2E: `GET /api/v1/leaderboards/level-initial` con Bearer → `200 { topPlayers: [], currentRecord: null }` (antes 404); nivel inexistente → `404` (contrato intacto).

**Motivación:** el cliente (feature de leaderboards) consulta la clasificación por `levelId` del mapa; sin estos niveles en el registro, el backend respondía `404 LevelRegistryError` para niveles legítimos y el sync de progreso no podía asociarlos. Con el seed completo, el flujo real jugar → sync → leaderboard funciona de punta a punta.
