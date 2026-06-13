### 2026-06-06 — Implementación de Capa de Presentación (Auth) y Suite de Pruebas (Jest)

- **Herramienta:** Gemini
- **Modelo / versión:** Gemini
- **Autor humano responsable:** @SantiagoChirinos
- **Prompt(s) representativo(s):**
  - "Necesito que en base al siguiente requisito gherkin (...), programemos con DDD y arquitectura clean"
  - "Vamos a usar factories para evitar el crecimiento desmedido de index.ts"
  - "quiero que adaptes las pruebas a estos requerimientos... aislar dependencias, patrón AAA, nombrar should_[resultado]_when_[condicion]."
- **Salida tomada de la IA:**
  - `src/presentation/controllers/AuthController.ts` [NEW] — Controlador para registro, login y logout con manejo de error `cause`.
  - `src/presentation/middlewares/AuthMiddleware.ts` [NEW] — Validación de JWT de 7 días y verificación en lista negra.
  - `src/presentation/routes/AuthRoutes.ts` [NEW] — Definición de endpoints HTTP.
  - `src/main/factories/AuthFactory.ts` [NEW] — Factoría principal para Inyección de Dependencias modular y tipada.
  - `src/index.ts` [MODIFY] — Configuración raíz de Express adaptada con `helmet` para seguridad.
  - `tests/application/use-cases/RegisterAccount.spec.ts` [NEW] — Tests de registro (AAA).
  - `tests/application/use-cases/Login.spec.ts` [NEW] — Tests de inicio de sesión (AAA).
  - `tests/application/use-cases/Logout.spec.ts` [NEW] — Tests de cierre de sesión (AAA).
- **Modificaciones manuales del equipo:** Resolución de *code smell* S4325 (SonarQube) reemplazando aserciones `as Account` por instancias de dominio reales en los mocks. Ajuste de configuración TypeScript (`moduleResolution: "bundler"`, `rootDir: "."`) y sobrescritura de `verbatimModuleSyntax: false` en `jest.config` para resolver conflictos de compatibilidad ESM/CommonJS.
- **Validación realizada:** Ejecución exitosa de la suite completa de pruebas mediante Jest. Código verificado libre de fugas de información (S5689 resuelto) y sin advertencias activas en el linter o SonarQube.

---
#### 📋 Resumen de la sesión
- **Duración estimada de la sesión:** ~15 turnos de usuario / ~60 minutos estimados
- **Contexto de la conversación:** Desarrollo del punto de entrada HTTP (Express) para el módulo de identidad del sistema Arrow Maze, diseño del Composition Root y configuración rigurosa del entorno de pruebas en Jest bajo principios de Clean Architecture.
- **Decisiones clave tomadas:**
  1. **Inyección Modular (Factory Pattern):** Se creó la capa `main/factories` para aislar el ensamblaje de dependencias por feature, previniendo que el `index.ts` crezca descontroladamente y forzando el uso de `import type` para las interfaces.
  2. **Evaluación de Comportamiento (Detroit TDD):** Se priorizó probar el impacto real de los Casos de Uso sobre las entidades in-memory antes que verificar firmas de métodos internos, garantizando tests resilientes al refactor.
  3. **Manejo de Errores con `cause`:** Se rechazó la inserción de I/O (`console.log`) en la capa de Aplicación, adoptando en su lugar la inyección del error original en la excepción de dominio (`AuthError`) para su resolución en el controlador.
- **Patrones de uso observados:** Alta orientación a estándares estructurales — iteraciones focalizadas en erradicar advertencias de análisis estático (SonarQube), estricta adherencia a tipados de TypeScript y lineamientos de equipo (AAA TDD).

### 2026-06-13 — Gestión de Sesión Activa, Blacklist y Persistencia basada en JSON

- **Herramienta:** Gemini
- **Modelo / versión:** Gemini
- **Autor humano responsable:** @SantiagoChirinos
- **Prompt(s) representativo(s):**
  - "Vamos a continuar con la siguiente funcionalidad, te voy a pasar el gherkin para que digas si todo está de acuerdo a lo que hicimos antes... Quiero gestionar la autenticación mediante un único token JWT de larga duración"
  - "Implementemos la base de datos que decidió el equipo, la cual va a ser en json"
  - "ahora que ya tenemos esto, vamos a implementar los tests del último gherkin pero con estos repositorios en vez de con memoria"
  - "este test está fallando: tests/application/use-cases/Logout.spec.ts:16:5 - error TS2322: Type '{ ... }' is not assignable to type 'Mocked<ISessionRepository>'."
- **Salida tomada de la IA:**
  - `src/presentation/middlewares/AuthMiddleware.ts` [MODIFY] — Refinamiento del manejo de errores para devolver 401/403 exactos según el BDD.
  - `src/infrastructure/jobs/BlacklistCleanupJob.ts` [NEW] — Cron Job programado para la limpieza de tokens expirados de la lista negra.
  - `src/infrastructure/repositories/JsonAccountRepository.ts` [NEW] — Implementación de persistencia de cuentas utilizando el sistema de archivos (`fs/promises`).
  - `src/infrastructure/repositories/JsonSessionRepository.ts` [NEW] — Implementación de persistencia de la Blacklist en JSON.
  - `src/main/factories/AuthFactory.ts` [MODIFY] — Reemplazo de repositorios en memoria por implementaciones JSON y arranque del Cron Job.
  - `tests/presentation/middlewares/AuthMiddleware.spec.ts` [NEW] — Tests de integración de middleware cubriendo los escenarios del Gherkin.
  - `tests/infrastructure/repositories/JsonSessionRepository.spec.ts` [NEW] — Pruebas unitarias de I/O interceptando/mockeando `fs/promises`.
- **Modificaciones manuales del equipo:** Se corrigió el mock del repositorio en `Logout.spec.ts` añadiendo la función `deleteExpiredTokens: jest.fn()` para satisfacer la validación estricta de interfaces de TypeScript tras la evolución del contrato `ISessionRepository`. 
- **Validación realizada:** Ejecución exitosa de la suite completa en Jest. Las pruebas de infraestructura confirmaron el correcto mapeo de entidades a JSON y viceversa, aislando exitosamente el disco duro real mediante el mock de `fs`.

---
#### 📋 Resumen de la sesión
- **Duración estimada de la sesión:** ~10 turnos de usuario / ~45 minutos estimados
- **Contexto de la conversación:** Implementación del sistema de gestión de sesiones de larga duración (token único de 7 días, sin fingerprinting) para Arrow Maze, y diseño de persistencia de datos orientada a archivos JSON locales.
- **Decisiones clave tomadas:**
  1. **Persistencia Pragmática (JSON):** Se optó por archivos JSON en lugar de una base de datos pesada. Gracias a Clean Architecture, este cambio fue transparente para el Dominio y los Casos de Uso, manteniendo el backend ligero.
  2. **Arquitectura de Lista Negra (Blacklist):** Revocación de sesiones gestionada mediante el almacenamiento exclusivo del `jti` (JWT ID), complementada con un proceso en segundo plano (Cron Job) que purga automáticamente los registros obsoletos para evitar el crecimiento infinito del archivo JSON.
  3. **Aislamiento de I/O en Pruebas:** Para las pruebas de repositorios, se interceptó el módulo nativo `fs/promises`. Esto garantizó pruebas veloces que verifican la lógica de serialización de archivos sin realizar lecturas o escrituras reales en el disco.
- **Patrones de uso observados:** Enfoque BDD-first — validando primero que los requerimientos de negocio encajaran con la arquitectura existente, seguido por decisiones de infraestructura pragmáticas y resolución de errores guiada por el tipado estricto de TypeScript.