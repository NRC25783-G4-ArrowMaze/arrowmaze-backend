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

### 2026-06-04 — Diseño de Arquitectura Base e Implementación del Módulo de Autenticación
- **Herramienta:** Gemini
- **Modelo / versión:** Gemini 3.1 pro
- **Autor humano responsable:** Santiago Chirinos
- **Prompt(s) representativo(s):**
  - "Implementación de la capa de presentación utilizando Express, conectando controladores y middlewares de autenticación sin acoplar la lógica de negocio."
  - "Estructuración del Composition Root aplicando el patrón Factory en la capa `main` para manejar la Inyección de Dependencias manual y escalar las funcionalidades."
  - "Aplicar tipado estricto en todas las variables e inyecciones, requiriendo el uso exclusivo de `import type` para interfaces y contratos."
- **Salida tomada de la IA:** Implementación central de `AuthController.ts`, `AuthMiddleware.ts`, `AuthRoutes.ts`, la factoría de dependencias `AuthFactory.ts` y el punto de entrada principal `index.ts`.
- **Modificaciones manuales del equipo:** Se forzó el uso estricto de tipos e interfaces en las definiciones de la factoría. Se resolvió proactivamente una vulnerabilidad de exposición de información reportada por SonarQube (S5689) integrando el middleware `helmet` y deshabilitando la cabecera `X-Powered-By` en Express.
- **Validación realizada:** Revisión humana para asegurar la pureza de la Clean Architecture y validación de seguridad mediante análisis estático de código (SonarQube).

### 2026-06-04 — Configuración de Suite de Pruebas y Tests Unitarios (Patrón AAA)
- **Herramienta:** Gemini
- **Modelo / versión:** Gemini 3.1 pro
- **Autor humano responsable:** Santiago Chirinos
- **Prompt(s) representativo(s):**
  - "Crear la suite de pruebas unitarias en Jest para los Casos de Uso (RegisterAccount, Login, Logout). Los tests deben probar estrictamente comportamiento observable (caja negra), no detalles de implementación."
  - "Asegurar el cumplimiento del patrón AAA (Arrange-Act-Assert), el aislamiento de dependencias mediante mocks nativos de Jest, y utilizar la nomenclatura estandarizada `should_[resultado]_when_[condicion]`."
- **Salida tomada de la IA:** Suite de archivos de prueba `RegisterAccount.spec.ts`, `Login.spec.ts` y `Logout.spec.ts`. Reglas base para integración de Jest con TypeScript.
- **Modificaciones manuales del equipo:** Se refactorizaron los mocks para evitar aserciones de tipo inseguras (`as Account`), instanciando entidades reales en memoria para solucionar la alerta S4325 de SonarQube. Se ajustó exhaustivamente la configuración de TypeScript (`tsconfig.json` con `moduleResolution: "Bundler"`) y Jest para soportar correctamente módulos ESM bajo la regla `verbatimModuleSyntax`.
- **Validación realizada:** Ejecución en verde de toda la suite de pruebas en Jest, confirmación de cobertura de casos borde (errores de validación, credenciales inválidas, duplicidad) y resolución de advertencias del compilador de TypeScript.

---

> ¿Vas a contribuir? Recuerda añadir tu propia entrada a este archivo en el mismo PR donde introduces los cambios asistidos por IA.
