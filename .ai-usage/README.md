# AI Usage Registry — Arrow Maze Backend

Registro centralizado de uso de herramientas de IA en el desarrollo del backend de **Arrow Maze**, en cumplimiento de las reglas del proyecto (`.cursor/rules/60-workflow-ai.mdc`).

> Este registro reemplaza al antiguo `AI_USAGE.md` monolítico de la raíz (migrado el 2026-07-06).
> Sigue el mismo modelo modular que `arrowmaze-game/.ai-usage/`: **un archivo por sesión** +
> `manifest.json` como fuente estructurada de verdad + este README como índice legible.

## Índice de reportes

| Fecha | Descripción | Archivo | Herramienta / Modelo | Estado |
|-------|-------------|---------|----------------------|--------|
| 2026-05-07 | Bootstrap de las reglas del repositorio (`.cursor/rules/`, CONTRIBUTING) | [`2026-05-07-bootstrap-reglas-repositorio.md`](./2026-05-07-bootstrap-reglas-repositorio.md) | Cursor / Claude Opus 4.7 | ✅ Recuperada |
| 2026-06-04 | Arquitectura base + módulo de autenticación (presentación, factories) | [`2026-06-04-arquitectura-base-modulo-autenticacion.md`](./2026-06-04-arquitectura-base-modulo-autenticacion.md) | Gemini 3.1 pro | ♻️ Superseded |
| 2026-06-04 | Suite de pruebas unitarias Jest (patrón AAA) | [`2026-06-04-suite-pruebas-unitarias-aaa.md`](./2026-06-04-suite-pruebas-unitarias-aaa.md) | Gemini 3.1 pro | ♻️ Superseded |
| 2026-06-06 | Capa de Presentación (Auth) + Suite de Pruebas — **consolidación de las 2 anteriores** | [`2026-06-06-consolidado-presentacion-auth-tests.md`](./2026-06-06-consolidado-presentacion-auth-tests.md) | Gemini | ✅ Canónica |
| 2026-06-13 | Gestión de Sesión Activa, Blacklist JWT y persistencia JSON (E2) | [`2026-06-13-sesion-activa-blacklist-persistencia-json.md`](./2026-06-13-sesion-activa-blacklist-persistencia-json.md) | Gemini | ✅ Completa |

> ⚠️ **Inconsistencia heredada (documentada):** el antiguo `AI_USAGE.md` fue reescrito
> completo en el commit `71e99d8` (2026-06-06) en lugar de añadir entradas de forma
> incremental. Eso eliminó la sesión de bootstrap (2026-05-07) y sustituyó las dos
> sesiones del 2026-06-04 por una versión consolidada fechada 2026-06-06 (perdiendo el
> modelo original, Gemini 3.1 pro). Las tres entradas se recuperaron del historial git
> (commits `6bf868a` y `393e18a`) durante la migración. Las marcadas *Superseded* se
> conservan por trazabilidad; sus deliverables **no** se cuentan en los agregados del
> manifest porque duplican la entrada canónica del 2026-06-06.

---

## Formato de reportes

Cada entrada sigue el formato estándar del proyecto:

```markdown
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

Opcionalmente, cerrar con un bloque `#### 📋 Resumen de la sesión` (duración, contexto, decisiones clave, patrones observados), como en el front.

---

## Estadísticas

- **Total de reportes:** 5 (4 sesiones de trabajo distintas; ver nota de consolidación)
- **Última actualización:** 2026-07-06
- **Suite de tests (actual):** 19/19 ✅ en 5 suites
- **Detalle por herramienta/modelo:** ver `manifest.json` (`aiUsageRegistry.statistics`) como fuente estructurada de verdad.

---

## Reglas para contribuidores

Al agregar asistencia de IA a este proyecto:

1. ✅ **Crear un nuevo reporte** en esta carpeta (naming: `YYYY-MM-DD-descripcion.md`) — **nunca** editar reportes de sesiones anteriores ni reescribir el registro completo
2. ✅ **Registrar el archivo** en este índice (`README.md`)
3. ✅ **Actualizar** `manifest.json` (array `entries` + `statistics` + `lastEntry`)
4. ✅ **Incluir metadata completa:** herramienta, modelo, autor, prompts, salida, modificaciones manuales, validación
5. ✅ **Commitearlo junto** con el código generado y referenciarlo en el PR

---

> Para más contexto sobre las reglas del proyecto, consulta [`docs/CONTRIBUTING.md`](../docs/CONTRIBUTING.md) y [`.cursor/rules/`](../.cursor/rules/).
