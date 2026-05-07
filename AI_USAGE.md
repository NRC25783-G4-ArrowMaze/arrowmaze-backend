# AI Usage — Arrow Maze Backend

Este archivo registra el uso de herramientas de IA generativa en el desarrollo de **Arrow Maze Backend**, en cumplimiento de las reglas del proyecto.

Cada cambio significativo asistido por IA debe añadir una nueva entrada al final, con el formato definido más abajo. Mantener orden cronológico inverso (lo más reciente primero) **no** es necesario; preferimos orden cronológico natural (lo más antiguo arriba) para que sea fácil leer la evolución del proyecto.

## Formato de cada entrada

```md
### YYYY-MM-DD — <Resumen de la tarea>
- **Herramienta:** <Cursor / Claude / GPT / Copilot / etc.>
- **Modelo / versión:** <si se conoce>
- **Autor humano responsable:** <nombre o handle>
- **Prompt(s) representativo(s):**
  - "..."
- **Salida tomada de la IA:** <archivos / bloques principales generados>
- **Modificaciones manuales del equipo:** <qué se ajustó, por qué>
- **Validación realizada:** <tests, lint, revisión humana>
```

---

## Registro

### 2026-05-07 — Bootstrap de las reglas del repositorio

- **Herramienta:** Cursor (Cloud Agent).
- **Modelo / versión:** Claude Opus 4.7 (a través de Cursor Cloud Agents).
- **Autor humano responsable:** Equipo Arrow Maze (responsable a confirmar en el PR).
- **Prompt(s) representativo(s):**
  - "Ayúdame a crear las reglas del repositorio con lo siguiente, además deja el reporte de ai-usage en la carpeta correspondiente: [enunciado del proyecto Arrow Maze con secciones sobre Clean Architecture, DDD, SOLID, patrones GoF, AOP, testing y base de datos]."
- **Salida tomada de la IA:**
  - Conjunto de reglas Cursor en `.cursor/rules/`:
    - `00-project-overview.mdc` — reglas generales (estructura de repos, ramas, Conventional Commits, PRs, README, uso de IA).
    - `10-architecture-clean-ddd.mdc` — Clean Architecture (4 capas, regla de dependencia) y DDD (lenguaje ubicuo, aislamiento, repositorio).
    - `20-design-patterns-aop.mdc` — patrones GoF obligatorios (creacional, estructural, comportamiento) y AOP para concerns transversales.
    - `30-solid-clean-code.mdc` — SOLID con ejemplos requeridos en README, Clean Code (Boy Scout, nombres, funciones pequeñas, DRY), seguridad básica.
    - `40-testing.mdc` — pirámide de pruebas, AAA, convención `should_..._when_...`, CI/CD, Pact para contrato.
    - `50-database.mdc` — esquema versionado, migraciones atómicas, independencia del motor.
    - `60-workflow-ai.mdc` — flujo de trabajo del agente IA, contextualización previa, registro obligatorio en este archivo.
  - `CONTRIBUTING.md` — versión legible para humanos de las reglas, con enlaces a las reglas normativas en `.cursor/rules/`.
  - Esta entrada inicial de `AI_USAGE.md`.
- **Modificaciones manuales del equipo:**
  - Pendiente de revisión en el PR. Cualquier ajuste hecho durante la revisión (renombrado de carpetas, cambios de tono, adiciones específicas del stack elegido) debe consignarse aquí en una entrada complementaria.
- **Validación realizada:**
  - Revisión cruzada de las reglas contra el enunciado original del proyecto Arrow Maze para asegurar cobertura completa de los puntos solicitados (estructura de repos, Conventional Commits, PRs, IA, README, Clean Architecture, DDD, JWT, Swagger, sincronización, SOLID, patrones GoF, AOP, Clean Code, pirámide de pruebas, CI/CD, control de versiones del esquema, migraciones, independencia del motor).
  - No se ejecuta lint ni test porque el repositorio aún no contiene código fuente ni configuración de un stack concreto; estas validaciones se incorporarán al introducir el primer scaffold del backend.

---

> ¿Vas a contribuir? Recuerda añadir tu propia entrada a este archivo en el mismo PR donde introduces los cambios asistidos por IA.
