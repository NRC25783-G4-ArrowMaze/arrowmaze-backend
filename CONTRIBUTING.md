# Guía de Contribución — Arrow Maze Backend

Este documento resume las reglas del repositorio en formato legible para humanos. La versión normativa, aplicable también por agentes de IA, vive en [`.cursor/rules/`](./.cursor/rules/).

## 1. Estructura del proyecto

- Este repositorio contiene **solo el backend** (API REST). El cliente vive en un repositorio independiente (`arrowmaze-game`).
- Carpetas relevantes:
  - `src/domain/` — Entidades, value objects, interfaces de repositorio.
  - `src/application/` — Casos de uso y puertos.
  - `src/infrastructure/` — Implementaciones concretas (DB, JWT, terceros).
  - `src/interfaces/` — Controladores HTTP, presentadores, mappers.
  - `tests/{unit,integration,contract}/` — Suite de pruebas.
  - `migrations/` — Migraciones de base de datos.
  - `docs/` — Documentación adicional (lenguaje ubicuo, patrones, BD).
  - `.cursor/rules/` — Reglas normativas del repositorio.

## 2. Ramas y commits

- Las ramas principales (`main`, `develop` si existe) están **protegidas**: prohibido push directo.
- Convención de nombres: `feat/<scope>-<descripcion>`, `fix/<scope>-<descripcion>`, `chore/<descripcion>`, `docs/<descripcion>`. Los agentes Cursor usan el prefijo `cursor/`.
- **Conventional Commits en inglés** son obligatorios:

  ```
  feat(board): add arrow propagation logic
  fix(player): correct movement on edge cells
  ```

- Tipos válidos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- Un commit = un cambio lógico. Explica el **porqué** en el cuerpo cuando aporte contexto.
- Prohibido `--force` y `--amend` sobre commits ya publicados sin autorización explícita.

## 3. Pull Requests

- Toda integración a una rama protegida pasa por **PR** con CI en verde y al menos una revisión.
- El PR debe incluir:
  - Descripción del problema y de la solución.
  - Checklist de tests, documentación y reglas SOLID/DDD afectadas.
  - Enlace al issue / tarea relacionada.
- Preferir **squash merge** o **rebase merge** para mantener el historial semántico.

## 4. Arquitectura

- **Clean Architecture** estricta con cuatro capas: Entidades → Casos de Uso → Adaptadores de Interfaz → Frameworks/Infraestructura.
- **Regla de dependencia:** las dependencias del código fuente apuntan **siempre hacia adentro** (hacia el dominio).
- **DDD:** lenguaje ubicuo del dominio Arrow Maze, aislamiento de la lógica de negocio respecto a infraestructura, patrón **Repositorio** como mediador entre dominio y persistencia.
- **JWT** para autenticación, **Swagger / OpenAPI** para documentar endpoints, endpoints específicos para sincronización de progreso y gestión de niveles.

Detalle completo en [`.cursor/rules/10-architecture-clean-ddd.mdc`](./.cursor/rules/10-architecture-clean-ddd.mdc).

## 5. Patrones de diseño y AOP

- Implementar y justificar al menos un patrón GoF de cada categoría:
  - **Creacional** (ej. Factory Method para tipos de celda).
  - **Estructural** (ej. Adapter para librerías externas).
  - **De comportamiento** (ej. Observer para eventos del dominio).
- Implementar al menos un **aspecto AOP** para responsabilidades transversales (logging, manejo centralizado de excepciones, seguridad, métricas) sin contaminar la lógica de negocio.

Detalle en [`.cursor/rules/20-design-patterns-aop.mdc`](./.cursor/rules/20-design-patterns-aop.mdc).

## 6. SOLID y Clean Code

- Todo el código debe **evidenciar SOLID**, con al menos un ejemplo real por principio documentado en el README.
- **Clean Code:** Boy Scout Rule, nombres significativos del dominio, funciones pequeñas (una sola cosa), DRY aplicado al **conocimiento** (no al código que coincidentemente se ve igual).
- Adherirse al **style guide oficial** del lenguaje (PEP 8 / Google Style / ESLint+Prettier).

Detalle en [`.cursor/rules/30-solid-clean-code.mdc`](./.cursor/rules/30-solid-clean-code.mdc).

## 7. Testing

- Pipeline **CI/CD** (GitHub Actions) con lint, unit, integración y cobertura.
- **Pirámide de pruebas**:
  - **Unitarias** con patrón **AAA** y nombres `should_<resultado>_when_<condicion>`.
  - **Integración** con casos de uso reales y repositorios reales (o BD en memoria).
  - **Contrato** con Pact (recomendado) entre cliente y backend.
- **TDD respetuoso:** si existen tests, no se modifican para forzar el "verde". El cambio va en el código de producción.

Detalle en [`.cursor/rules/40-testing.mdc`](./.cursor/rules/40-testing.mdc).

## 8. Base de datos

- Esquema versionado en el repositorio mediante **migraciones** atómicas.
- La base de datos es un **detalle de implementación**: el dominio depende de interfaces de repositorio, no de un motor concreto.
- Naming en inglés y `snake_case`; índices y restricciones justificadas.

Detalle en [`.cursor/rules/50-database.mdc`](./.cursor/rules/50-database.mdc).

## 9. Uso de IA

- Permitido y fomentado, pero **obligatorio documentarlo** en [`AI_USAGE.md`](./AI_USAGE.md) de la raíz: herramienta, prompts representativos, modificaciones manuales del equipo y validación realizada.
- Cualquier PR generado con asistencia de IA debe incluir la entrada correspondiente en `AI_USAGE.md`.

Detalle en [`.cursor/rules/60-workflow-ai.mdc`](./.cursor/rules/60-workflow-ai.mdc).
