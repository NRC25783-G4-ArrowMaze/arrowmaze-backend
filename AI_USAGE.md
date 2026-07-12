# AI Usage — Arrow Maze Backend

Resumen ejecutivo del uso de inteligencia artificial en este repositorio. El detalle
auditable —un reporte por sesión con el problema abordado, la metodología, los entregables,
las modificaciones del equipo y la validación realizada— vive en
[`.ai-usage/`](./.ai-usage/README.md) (9 reportes indexados en
[`manifest.json`](./.ai-usage/manifest.json)). La vista unificada de los tres repos del
proyecto está en la [vitácora de project-core](https://nrc25783-g4-arrowmaze.github.io/arrowmaze-project-core/bitacora.html).

## Herramientas utilizadas

| Herramienta | Modelos | Rol |
|---|---|---|
| **Gemini** | 3.1 Pro | Arquitectura base del módulo de auth, suite de pruebas AAA, capa de presentación, sesión activa/blacklist |
| **Claude Code** (CLI/IDE) | Opus 4.7 / 4.8, Fable 5 | Inspección y corrección de bugs, patrones GoF + AOP + Swagger, reestructuración documental, seed de niveles |
| **Cursor** (Cloud Agent) | Claude Opus 4.7 | Bootstrap de las reglas del repositorio |

La metodología es **Specification-Driven Development**: las specs Gherkin del backend (E1,
E2, F1–F3) se sincronizan desde
[`arrowmaze-project-core`](https://github.com/NRC25783-G4-ArrowMaze/arrowmaze-project-core)
a [`docs/features/`](./docs/features/), y toda sesión de IA se documenta en `.ai-usage/`
antes del merge.

## Registro por tarea

Cada reporte registra fecha, herramienta/modelo, problema, entregables con rutas de archivo,
validación (typecheck, Jest, smoke tests E2E) y contexto. Ejemplos representativos:
[arquitectura base de auth](./.ai-usage/2026-06-04-arquitectura-base-modulo-autenticacion.md),
[corrección de bugs de inspección](./.ai-usage/2026-07-06-correccion-bugs-logout-build-jwt-email.md),
[patrones GoF + AOP + Swagger](./.ai-usage/2026-07-09-patrones-gof-aop-swagger.md).

## Evaluación crítica

- **Cobertura estimada:** ~85 % del código de producción se escribió con asistencia directa
  de IA (estimación del equipo), con el humano fijando la spec, revisando el diff y
  aprobando cada merge. La suite de 109 tests (patrón AAA) acompañó cada módulo.
- **Trazabilidad:** todas las sesiones significativas tienen reporte en `.ai-usage/`.

## Alucinaciones y resultados incorrectos corregidos

Una **inspección humana dirigida** (2026-07-06) encontró y corrigió defectos que la IA había
introducido en sesiones previas y reportado como funcionales:

| Caso | Cómo se detectó y corrigió |
|---|---|
| `JwtTokenService` **ignoraba el parámetro `expiresInSeconds`** del puerto `ITokenService` y emitía siempre tokens de 7 días, aunque `Login` creía pedir 24 h | Verificación en runtime del `exp − iat` del JWT decodificado; se honró el parámetro y se añadieron tests de regresión |
| Logout roto (401 con token válido) y **reuso de tokens revocados aceptado** (200 en `/progress`) | Smoke test E2E manual contra el build de producción; corregido y validado (logout → 200, token revocado → 403) |
| `LeaderboardModuleFactory` tenía un **secreto JWT hardcodeado** como fallback y las 4 factories duplicaban la infraestructura de seguridad | Auditoría del código; se centralizó en `SharedSecurityFactory` (singleton de módulo) |
| Build de producción roto (`ERR_MODULE_NOT_FOUND`) pese a que el dev server funcionaba | Ejecución real de `pnpm build && node dist/index.js`; corregido y añadido al flujo de validación |

## Reflexión del equipo

La IA permitió levantar un backend completo (auth JWT, niveles con seed, progreso,
leaderboard, patrones GoF, AOP y OpenAPI/Swagger) en tiempo de curso. La lección más
valiosa fue la inspección del 2026-07-06: el código generado **puede parecer correcto y
pasar los tests que la propia IA escribió** — los 4 bugs se encontraron ejecutando el
sistema real, no leyendo el código. Desde entonces la validación exige build de producción
y smoke tests E2E, no solo la suite unitaria, y el CI corre build+tests en cada PR.
