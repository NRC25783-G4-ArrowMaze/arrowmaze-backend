# 🎮 Arrow Maze — Backend

![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)
![Tests](https://img.shields.io/badge/tests-80%2F80%20passing-brightgreen?logo=jest)
![pnpm](https://img.shields.io/badge/pnpm-10.x-F69220?logo=pnpm&logoColor=white)
![Clean Architecture](https://img.shields.io/badge/architecture-Clean%20%2B%20DDD-blueviolet)

API REST del juego de puzzles **Arrow Maze**: gestiona identidad de usuarios (registro, login, sesiones JWT), distribución y actualización de niveles (con seed de contenido inicial), progreso del jugador y leaderboards por nivel.

> 📐 Las **especificaciones** (Gherkin BDD, español) viven en [`arrowmaze-project-core`](https://github.com/NRC25783-G4-ArrowMaze/arrowmaze-project-core), fuente única de verdad. Este repo sincroniza las pertinentes al backend en [`docs/features/`](docs/features/). El cliente vive en `arrowmaze-game`.

---

## 📋 Features

| ID | Feature | Estado |
|----|---------|--------|
| E1 | Registro e inicio de sesión de usuario | ✅ Implementado |
| E2 | Gestión de sesión activa y credenciales JWT (blacklist + cleanup) | ✅ Implementado |
| F1 | API de autenticación (registro, login, logout con JWT) | ✅ Implementado |
| F2 | API de distribución y actualización de definiciones de niveles | ✅ Implementado — extendido con seed de contenido (`pnpm seed`) y CORS |
| F3 | API de recepción y consulta del progreso del jugador | ✅ Implementado |
| F4 | Leaderboard por nivel | ✅ Implementado (spec formal pendiente) |

Matriz completa con dependencias en [`docs/README.md`](docs/README.md).

---

## 🏗️ Arquitectura

**Clean Architecture + DDD** — la regla de dependencia apunta siempre hacia adentro. Diagrama de componentes en [`docs/diagram.puml`](docs/diagram.puml).

```
src/
├── domain/          # Entidades (Account, Session), VOs (Email, Password), excepciones,
│                    # interfaces de repositorio — cero dependencias externas
├── application/     # Casos de uso (Login, GetLevels, ManageLevel, SaveProgress,
│                    # GetLevelLeaderboard…) + puertos (ITokenService, ICryptoService)
├── infrastructure/  # Adaptadores: Bcrypt, JWT, repositorios JSON (escrituras
│                    # serializadas), seeding (LevelSeeder), jobs (BlacklistCleanup)
├── presentation/    # Express: controladores/rutas por módulo (Auth, Level,
│                    # Progress, Leaderboard) + middlewares (Auth, RequireRole)
└── main/            # Composition Root: factories de inyección de dependencias
```

**Decisiones clave:** persistencia pragmática en archivos JSON (transparente para el dominio gracias a los repositorios); sesión con token JWT único de 7 días revocable vía blacklist por `jti`, purgada por un cron job.

---

## 🚀 Inicio rápido

> ⚠️ Este proyecto usa **pnpm** como gestor de paquetes.

```bash
pnpm install        # instalar dependencias
pnpm seed           # poblar data/levels.json con los niveles iniciales (idempotente)
pnpm dev            # servidor de desarrollo (tsx watch) — puerto 3000 (o $PORT)
pnpm test           # suite completa de Jest
pnpm test:watch     # tests en modo watch
pnpm build          # compilar TypeScript a dist/
pnpm start          # ejecutar build de producción

# Nota: data/ está gitignoreado — tras un clone fresco, sin `pnpm seed`
# el catálogo de niveles responde []. El contenido versionado vive en
# seeds/levels.seed.json (se regenera con el exportador de arrowmaze-game).
pnpm lint           # ESLint
pnpm gen-uml        # regenerar diagrama de clases (docs/classes.puml)
```

---

## 🌐 API

Base: `http://localhost:3000/api/v1`

CORS habilitado (permisivo en desarrollo; restringir `origin` en producción).

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/auth/register` | — | Registro de cuenta (email + password) |
| POST | `/auth/login` | — | Login; devuelve JWT (7 días) |
| POST | `/auth/logout` | Bearer | Revoca el token (blacklist por `jti`) |
| GET | `/levels` | — | Catálogo `LevelMetadata` (filtro `?difficulty=`) |
| GET | `/levels/bulk` | — | Todas las definiciones `LevelData` (sincronización masiva) |
| GET | `/levels/:id` | — | Definición completa `LevelData` de un nivel |
| POST | `/levels` | Bearer · ADMIN | Publica un nivel nuevo (valida el payload) |
| PUT | `/levels/:id` | Bearer · ADMIN | Sobrescribe un nivel existente |
| POST | `/progress` | Bearer | Guarda/actualiza el progreso del jugador |
| GET | `/progress` | Bearer | Progreso del usuario en todos los niveles |
| GET | `/progress/:levelId` | Bearer | Progreso del usuario en un nivel |
| GET | `/leaderboards/:levelId` | Bearer | Clasificación de un nivel |

> 📄 Documentación OpenAPI/Swagger: **pendiente**.

---

## 🧱 SOLID en el código

Un ejemplo real por principio, como exige la [normativa del repo](.cursor/rules/30-solid-clean-code.mdc):

- **S — Single Responsibility:** cada caso de uso hace una sola cosa: [`Login.ts`](src/application/use-cases/Login.ts) solo autentica; [`RegisterAccount.ts`](src/application/use-cases/RegisterAccount.ts) solo registra. El [`AuthController`](src/presentation/controllers/AuthController.ts) solo traduce HTTP ↔ casos de uso.
- **O — Open/Closed:** el paso de memoria a JSON no tocó ningún caso de uso — se añadió [`JsonAccountRepository`](src/infrastructure/repositories/JsonAccountRepository.ts) junto a [`InMemoryAccountRepository`](src/infrastructure/repositories/InMemoryAccountRepository.ts) y solo cambió el ensamblaje en la factory.
- **L — Liskov Substitution:** [`JsonSessionRepository`](src/infrastructure/repositories/JsonSessionRepository.ts) e [`InMemorySessionRepository`](src/infrastructure/repositories/InMemorySessionRepository.ts) son intercambiables tras [`ISessionRepository`](src/domain/repositories/ISessionRepository.ts) — los tests ejercen el mismo contrato con ambas.
- **I — Interface Segregation:** puertos pequeños y específicos — [`ICryptoService`](src/application/ports/ICryptoService.ts) (hash/compare) e [`ITokenService`](src/application/ports/ITokenService.ts) (generate/verify) en vez de un "SecurityService" monolítico.
- **D — Dependency Inversion:** [`Login`](src/application/use-cases/Login.ts) depende solo de abstracciones (`IAccountRepository`, `ICryptoService`, `ITokenService`) que [`AuthFactory`](src/main/factories/AuthFactory.ts) — el Composition Root — inyecta con implementaciones concretas.

---

## 🧪 Testing

Jest + ts-jest, patrón **AAA** con nomenclatura `should_[resultado]_when_[condicion]`. Estado actual: **80/80 tests en 21 suites** ✅.

```
tests/
├── application/use-cases/       # Auth, niveles (GetLevels, ManageLevel), progreso, leaderboard
├── presentation/                # Controladores, rutas y middlewares (escenarios Gherkin)
└── infrastructure/              # Repositorios JSON (fs mockeado), FileWriteQueue, LevelSeeder
```

---

## 📚 Documentación

- [`docs/README.md`](docs/README.md) — índice de specs del backend, contratos externos y decisiones abiertas
- [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) — guía de contribución (Conventional Commits, PRs, testing)
- [`docs/features/`](docs/features/) — especificaciones Gherkin (E1, E2, F1, F2, F3)
- [`.ai-usage/`](.ai-usage/) — registro modular de uso de IA (manifest + un reporte por sesión)
- [`.cursor/rules/`](.cursor/rules/) — reglas normativas del repositorio
