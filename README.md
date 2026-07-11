# 🎮 Arrow Maze — Backend

![CI](https://github.com/NRC25783-G4-ArrowMaze/arrowmaze-backend/actions/workflows/ci.yml/badge.svg?branch=main)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)
![Tests](https://img.shields.io/badge/tests-109%2F109%20passing-brightgreen?logo=jest)
![pnpm](https://img.shields.io/badge/pnpm-10.x-F69220?logo=pnpm&logoColor=white)
![Clean Architecture](https://img.shields.io/badge/architecture-Clean%20%2B%20DDD-blueviolet)
![License](https://img.shields.io/badge/license-MIT-green)

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

**Clean Architecture + DDD** — la regla de dependencia apunta siempre hacia adentro. Diagrama de componentes por capas: [preview en SVG](docs/diagram.svg) · [fuente editable `docs/diagram.puml`](docs/diagram.puml).

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

> 📄 Documentación OpenAPI/Swagger: **Swagger UI** en [`http://localhost:3000/api/docs`](http://localhost:3000/api/docs) y spec crudo en [`/api/docs/json`](http://localhost:3000/api/docs/json). Se genera desde las anotaciones `@openapi` de [`src/presentation/routes/`](src/presentation/routes/) ([`src/main/config/swagger.ts`](src/main/config/swagger.ts)).

---

## 🧱 SOLID en el código

Un ejemplo real por principio, como exige la [normativa del repo](.cursor/rules/30-solid-clean-code.mdc):

- **S — Single Responsibility:** cada caso de uso hace una sola cosa: [`Login.ts`](src/application/use-cases/Login.ts) solo autentica; [`RegisterAccount.ts`](src/application/use-cases/RegisterAccount.ts) solo registra. El [`AuthController`](src/presentation/controllers/AuthController.ts) solo traduce HTTP ↔ casos de uso.
- **O — Open/Closed:** el paso de memoria a JSON no tocó ningún caso de uso — se añadió [`JsonAccountRepository`](src/infrastructure/repositories/JsonAccountRepository.ts) junto a [`InMemoryAccountRepository`](src/infrastructure/repositories/InMemoryAccountRepository.ts) y solo cambió el ensamblaje en la factory.
- **L — Liskov Substitution:** [`JsonSessionRepository`](src/infrastructure/repositories/JsonSessionRepository.ts) e [`InMemorySessionRepository`](src/infrastructure/repositories/InMemorySessionRepository.ts) son intercambiables tras [`ISessionRepository`](src/domain/repositories/ISessionRepository.ts) — los tests ejercen el mismo contrato con ambas.
- **I — Interface Segregation:** puertos pequeños y específicos — [`ICryptoService`](src/application/ports/ICryptoService.ts) (hash/compare) e [`ITokenService`](src/application/ports/ITokenService.ts) (generate/verify) en vez de un "SecurityService" monolítico.
- **D — Dependency Inversion:** [`Login`](src/application/use-cases/Login.ts) depende solo de abstracciones (`IAccountRepository`, `ICryptoService`, `ITokenService`) que [`AuthFactory`](src/main/factories/AuthFactory.ts) — el Composition Root — inyecta con implementaciones concretas.

**I — Interface Segregation** — puertos pequeños en vez de un servicio monolítico:

```ts
// src/application/ports/ICryptoService.ts
export interface ICryptoService {
  hash(plainText: string): Promise<string>;
  compare(plainText: string, hash: string): Promise<boolean>;
}
// src/application/ports/ITokenService.ts
export interface ITokenService {
  generate(payload: TokenPayload, expiresInSeconds: number): Promise<string>;
  verify(token: string): Promise<TokenPayload>;
}
```

**D — Dependency Inversion** — el caso de uso recibe abstracciones; la factory decide las implementaciones concretas:

```ts
// src/application/use-cases/Login.ts (extracto): depende solo de puertos
const isPasswordValid = await this.cryptoService.compare(
  request.passwordPlainText,
  account.getPasswordHash()
);
const token = await this.tokenService.generate(
  { accountId: account.getId(), jti, role: account.getRole() },
  604800   // 7 días (spec E2)
);

// src/main/factories/AuthFactory.ts (extracto): el Composition Root inyecta las concretas
const accountRepository: IAccountRepository = new JsonAccountRepository();
const cryptoService: ICryptoService = new BcryptCryptoService();
const login = new Login(accountRepository, cryptoService, tokenService, idGenerator);
```

---

## 🧩 Patrones de Diseño (GoF)

Al menos un patrón por categoría, como exige la [normativa del repo](.cursor/rules/20-design-patterns-aop.mdc). Justificación completa (problema, alternativas consideradas, tests) en [`docs/design-patterns.md`](docs/design-patterns.md).

| Patrón | Categoría | Ubicación | Problema que resuelve |
|--------|-----------|-----------|----------------------|
| **Factory Method** | Creacional | [`src/main/factories/*Factory.ts`](src/main/factories/) | Cada `createRouter()` encapsula el ensamblaje del grafo de dependencias de su módulo; `index.ts` no conoce implementaciones concretas |
| **Singleton** | Creacional | [`SharedSecurityFactory.ts`](src/main/factories/SharedSecurityFactory.ts), [`FileWriteQueue.ts`](src/infrastructure/persistence/FileWriteQueue.ts) | Instancia única de las dependencias de seguridad compartidas (JWT, blacklist) y una sola cola de escritura por archivo |
| **Adapter** | Estructural | [`BcryptCryptoService.ts`](src/infrastructure/services/BcryptCryptoService.ts), [`JwtTokenService.ts`](src/infrastructure/services/JwtTokenService.ts) | Traducen bcrypt/jsonwebtoken a los puertos `ICryptoService`/`ITokenService`; cambiar de librería solo toca infraestructura |
| **Strategy** | Comportamiento | [`IRankingStrategy.ts`](src/domain/services/IRankingStrategy.ts) → [`CompetitiveRankingStrategy.ts`](src/domain/services/CompetitiveRankingStrategy.ts) | Algoritmo de ranking del leaderboard intercambiable sin modificar el caso de uso `GetLevelLeaderboard` |

**Factory Method** — cada factory ensambla el grafo de dependencias de su módulo y devuelve solo el `Router`:

```ts
// src/main/factories/LeaderboardModuleFactory.ts
public static createRouter(): Router {
  const authMiddleware = SharedSecurityFactory.getAuthMiddleware();
  const getLevelLeaderboard = new GetLevelLeaderboard(
    new JsonLevelRepository(),
    new JsonProgressRepository(),
    new JsonAccountRepository(),
    new CompetitiveRankingStrategy()   // ← estrategia inyectada
  );
  const controller = new LeaderboardController(getLevelLeaderboard);
  return LeaderboardRoutes.create(controller, authMiddleware);
}
```

**Adapter** — envuelve una librería externa tras un puerto del dominio:

```ts
// src/infrastructure/services/BcryptCryptoService.ts
export class BcryptCryptoService implements ICryptoService {
  private readonly saltRounds = 10;
  async hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, this.saltRounds);   // API de bcrypt → contrato ICryptoService
  }
  async compare(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash);
  }
}
```

**Strategy** — el algoritmo de ranking es intercambiable; el caso de uso solo depende de la interfaz:

```ts
// src/domain/services/IRankingStrategy.ts
export interface IRankingStrategy {
  sortAndRank<T extends UnrankedEntry>(entries: T[]): Array<T & { rank: number }>;
}

// src/application/use-cases/GetLevelLeaderboard.ts (extracto)
const rankedEntries = this.rankingStrategy.sortAndRank(unrankedEntries);
```

> Nota: la rúbrica pedía un patrón de comportamiento. Se eligió **Strategy** en lugar de Command porque
> `SaveProgressCommand` es en realidad un DTO con *static factory* (sin `execute()`), y el ranking del
> leaderboard sí es una política intercambiable real.

---

## 🔀 Aspectos (AOP) activos

Responsabilidades transversales separadas de la lógica de negocio, según la [normativa del repo](.cursor/rules/20-design-patterns-aop.mdc). Los aspectos viven en [`src/infrastructure/aspects/`](src/infrastructure/aspects/) y cada uno tiene su test unitario.

| Aspecto | Responsabilidad | Implementación |
|---------|-----------------|----------------|
| **Manejo centralizado de excepciones** | Traduce las excepciones de dominio a códigos HTTP (400/401/404/409/422, fallback 500 sin filtrar detalles) en un único punto; los controladores no llevan try/catch | [`ErrorHandlerAspect.ts`](src/infrastructure/aspects/ErrorHandlerAspect.ts) — error middleware de Express 5, montado tras los routers |
| **Logging de peticiones** | Registra `método ruta → status (ms)` de cada petición al finalizar la respuesta | [`RequestLoggingAspect.ts`](src/infrastructure/aspects/RequestLoggingAspect.ts) — middleware global antes de los routers |
| **Seguridad / Autorización** | Verificación JWT + blacklist por `jti` e inyección de `accountId`/`userRole`; RBAC por rol en endpoints de administración | [`AuthMiddleware.ts`](src/presentation/middlewares/AuthMiddleware.ts) y [`RequireRoleMiddleware.ts`](src/presentation/middlewares/RequireRoleMiddleware.ts), montados por ruta |

**ErrorHandlerAspect** — traduce las excepciones de dominio a HTTP en un único punto (los controllers no llevan try/catch):

```ts
// src/infrastructure/aspects/ErrorHandlerAspect.ts (extracto)
const STATUS_BY_ERROR: Array<[ErrorClass, number]> = [
  [ValidationError, 400], [AuthError, 401],
  [LevelNotFoundError, 404], [LevelAlreadyExistsError, 409],
  [LevelRegistryError, 422]   // …
];

// La firma de 4 parámetros es obligatoria para que Express lo reconozca como error handler
export function errorHandlerAspect(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  for (const [ErrorClass, status] of STATUS_BY_ERROR) {
    if (error instanceof ErrorClass) { res.status(status).json({ error: error.message }); return; }
  }
  res.status(500).json({ error: 'Internal server error' });   // fallback sin filtrar detalles
}
```

**RequestLoggingAspect** — observabilidad transversal, sin tocar controllers ni casos de uso:

```ts
// src/infrastructure/aspects/RequestLoggingAspect.ts
export function requestLoggingAspect(req: Request, res: Response, next: NextFunction): void {
  const startedAt = Date.now();
  res.on('finish', () => {
    const elapsedMs = Date.now() - startedAt;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} → ${res.statusCode} (${elapsedMs}ms)`);
  });
  next();
}
```

Montaje en [`src/index.ts`](src/index.ts): `requestLoggingAspect` antes de los routers, `errorHandlerAspect` después.

---

## 🧪 Testing

Jest + ts-jest, patrón **AAA** con nomenclatura `should_[resultado]_when_[condicion]`. Estado actual: **109/109 tests en 27 suites** ✅.

```
tests/
├── domain/services/             # Estrategias de ranking (CompetitiveRankingStrategy)
├── application/use-cases/       # Auth, niveles (GetLevels, ManageLevel), progreso, leaderboard
├── presentation/                # Controladores, rutas y middlewares (escenarios Gherkin)
├── infrastructure/              # Repositorios JSON (fs mockeado), FileWriteQueue, LevelSeeder,
│                                # adapters (Bcrypt, Jwt) y aspectos AOP
└── main/                        # Singleton de seguridad y spec OpenAPI (swagger)
```

---

## 📚 Documentación

- [`docs/README.md`](docs/README.md) — índice de specs del backend, contratos externos y decisiones abiertas
- [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) — guía de contribución (Conventional Commits, PRs, testing)
- [`docs/features/`](docs/features/) — especificaciones Gherkin (E1, E2, F1, F2, F3)
- [`AI_USAGE.md`](AI_USAGE.md) — resumen del uso de IA: herramientas, alcance, alucinaciones corregidas y reflexión
- [`.ai-usage/`](.ai-usage/) — registro modular de uso de IA (manifest + un reporte por sesión)
- [`.cursor/rules/`](.cursor/rules/) — reglas normativas del repositorio

---

## 📄 Licencia

MIT — ver [`LICENSE`](./LICENSE).
