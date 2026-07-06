# Documentación — arrowmaze-backend

> ⚠️ **Fuente única de verdad:** las especificaciones viven en
> [`arrowmaze-project-core`](https://github.com/NRC25783-G4-ArrowMaze/arrowmaze-project-core).
> Los archivos en `docs/features/` son **copias sincronizadas** desde
> `project-core/features/` — no se editan aquí. Cualquier cambio de spec
> requiere una sesión SDD en project-core y luego re-sincronizar.
>
> **Última sincronización:** 2026-07-06

---

## Features pertinentes al backend

| ID | Feature | Depende de | Estado spec | Estado implementación |
|----|---------|------------|-------------|----------------------|
| [E1](features/E1-register_and_login.feature) | Registro e inicio de sesión de usuario | — | 📝 Lista | ✅ Implementado (`RegisterAccount`, `Login`) |
| [E2](features/E2-active_session_management.feature) | Gestión de sesión activa y renovación de credenciales JWT | E1 | 📝 Lista | ✅ Implementado (`Logout`, blacklist JWT, `JsonSessionRepository`) |
| [F1](features/F1-api_users_auth.feature) | API de autenticación de usuarios (registro, login, logout con JWT) | — | 📝 Lista | ✅ Implementado (`AuthController`, `AuthRoutes`, `AuthMiddleware`) |
| [F2](features/F2-level-api-distribution.feature) | API de distribución y actualización remota de definiciones de niveles | Contrato C2 | 📝 Lista | ❌ Pendiente |
| [F3](features/F3-recepcion-consulta-progreso.feature) | API de recepción y consulta del progreso del jugador | F1 | 📝 Lista | ❌ Pendiente |
| F4 | Sistema de clasificación por nivel (leaderboard) | F1, F3 | ❌ Sin spec | ❌ Pendiente |

**Orden de sprints (según `project-core/docs/FEATURES.md`):**
- Sprint 5 — E1 → E2 → F1 → F2 (auth + distribución de niveles)
- Sprint 6 — F3 → F4 → D2 (progreso remoto + leaderboard + sincronización)

---

## Contratos externos relevantes

- **C2 — Carga y deserialización de niveles** (`project-core/features/C2-carga-deserializacion-niveles.feature`):
  define el esquema JSON `LevelData` que F2 distribuye. No se copia aquí por ser
  feature del cliente, pero es el contrato de datos de F2.
- **D2 — Sincronización de progreso local↔remoto** (cliente): consumidor de F3.

## Decisiones abiertas que afectan al backend

| Decisión | Bloquea | Estado |
|----------|---------|--------|
| **P20** — ¿Leaderboard solo por nivel o también global? | F4 | 🟡 Abierto — borrador: por nivel primero |
| **P21** — Resolución de conflictos en sincronización | D2 (y contrato F3) | 🟡 Abierto — borrador: conservar mayor score |

---

## Documentos en esta carpeta

- [`CONTRIBUTING.md`](CONTRIBUTING.md) — guía de contribución (versión legible de las reglas normativas de `.cursor/rules/`).
- [`diagram.puml`](diagram.puml) — diagrama de componentes Clean Architecture del módulo Auth (PlantUML).
- [`features/`](features/) — especificaciones Gherkin sincronizadas desde project-core.

## Arquitectura

El backend sigue **Clean Architecture** (ver `project-core/docs/STACK.md` y [`diagram.puml`](diagram.puml)):

```
src/
├── domain/          # Entidades (Account, Session), VOs (Email, Password), excepciones, interfaces de repos
├── application/     # Use cases (RegisterAccount, Login, Logout) + ports (ITokenService, ICryptoService)
├── infrastructure/  # Bcrypt, JWT, repositorios JSON/InMemory, jobs (BlacklistCleanup)
├── presentation/    # Controllers, routes, middlewares (Express)
└── main/            # Factories / composición de dependencias
```

Regla: las dependencias apuntan hacia adentro (Presentation → Application → Domain);
Infrastructure implementa los ports e interfaces definidos en las capas internas.
