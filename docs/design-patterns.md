# Patrones de Diseño (GoF)

Registro de los patrones implementados en el backend, según el formato exigido por la [normativa del repo](../.cursor/rules/20-design-patterns-aop.mdc): al menos un patrón por categoría (Creacional, Estructural, de Comportamiento), cada uno con tests unitarios.

---

## Factory Method — Creacional

- **Ubicación:** [`src/main/factories/AuthFactory.ts`](../src/main/factories/AuthFactory.ts), [`LevelModuleFactory.ts`](../src/main/factories/LevelModuleFactory.ts), [`ProgressModuleFactory.ts`](../src/main/factories/ProgressModuleFactory.ts), [`LeaderboardModuleFactory.ts`](../src/main/factories/LeaderboardModuleFactory.ts). También [`SaveProgressCommand.create()`](../src/application/use-cases/SaveProgressCommand.ts) y los VOs [`Email.create()`](../src/domain/value-objects/Email.ts) / [`Password.create()`](../src/domain/value-objects/Password.ts) (variante *static factory method* con validación).
- **Problema que resuelve:** cada módulo (Auth, Levels, Progress, Leaderboard) necesita un grafo de dependencias completo (repositorios → casos de uso → controlador → router). Sin las factories, `index.ts` tendría que conocer y ensamblar todas las implementaciones concretas, violando la regla de dependencia de Clean Architecture. Cada `createRouter()` encapsula la creación del grafo del módulo y expone solo el `Router` listo para montar.
- **Alternativas consideradas:** un contenedor de DI (tsyringe, inversify) — descartado por añadir peso y decoradores/metadata a un proyecto pequeño; construcción manual en `index.ts` — descartado por acoplar el bootstrap a todas las implementaciones.
- **Tests:** [`tests/main/factories/SharedSecurityFactory.spec.ts`](../tests/main/factories/SharedSecurityFactory.spec.ts), specs de casos de uso que ejercitan los objetos creados.

## Singleton — Creacional

- **Ubicación:** [`src/main/factories/SharedSecurityFactory.ts`](../src/main/factories/SharedSecurityFactory.ts) (lazy init con campos estáticos). Variante a nivel de módulo: el mapa de colas de [`src/infrastructure/persistence/FileWriteQueue.ts`](../src/infrastructure/persistence/FileWriteQueue.ts).
- **Problema que resuelve:** las dependencias de seguridad (token service con `JWT_SECRET`, repositorio de sesiones/blacklist, middleware de auth) son compartidas por los cuatro módulos. Sin una instancia única, cada factory leería el secreto por su cuenta y habría varios repositorios apuntando al mismo archivo, con riesgo de escrituras perdidas. `FileWriteQueue` necesita una única cola por archivo para serializar los ciclos read-modify-write.
- **Alternativas consideradas:** pasar las instancias como parámetros entre factories — descartado por propagar acoplamiento entre módulos; Singleton clásico con constructor privado — se prefirió el acceso estático perezoso, más simple de testear con `jest.resetModules()`.
- **Tests:** [`tests/main/factories/SharedSecurityFactory.spec.ts`](../tests/main/factories/SharedSecurityFactory.spec.ts) (misma instancia en llamadas sucesivas), [`tests/infrastructure/persistence/FileWriteQueue.spec.ts`](../tests/infrastructure/persistence/FileWriteQueue.spec.ts).

## Adapter — Estructural

- **Ubicación:** [`src/infrastructure/services/BcryptCryptoService.ts`](../src/infrastructure/services/BcryptCryptoService.ts) (adapta `bcrypt` al puerto [`ICryptoService`](../src/application/ports/ICryptoService.ts)) y [`src/infrastructure/services/JwtTokenService.ts`](../src/infrastructure/services/JwtTokenService.ts) (adapta `jsonwebtoken` al puerto [`ITokenService`](../src/application/ports/ITokenService.ts), traduciendo además sus errores a `AuthError` del dominio).
- **Problema que resuelve:** los casos de uso no pueden depender de las APIs de librerías externas (regla de dependencia). Los adapters traducen la interfaz de bcrypt/jsonwebtoken al contrato que la capa de aplicación define, de modo que cambiar de librería (p. ej. argon2, jose) solo toca un archivo de infraestructura.
- **Alternativas consideradas:** usar las librerías directamente en los casos de uso — descartado por acoplar dominio/aplicación a infraestructura; un "SecurityService" monolítico — descartado por violar Interface Segregation.
- **Tests:** [`tests/infrastructure/services/BcryptCryptoService.spec.ts`](../tests/infrastructure/services/BcryptCryptoService.spec.ts), [`tests/infrastructure/services/JwtTokenService.spec.ts`](../tests/infrastructure/services/JwtTokenService.spec.ts).

## Strategy — De Comportamiento

- **Ubicación:** interfaz [`src/domain/services/IRankingStrategy.ts`](../src/domain/services/IRankingStrategy.ts); estrategia concreta [`src/domain/services/CompetitiveRankingStrategy.ts`](../src/domain/services/CompetitiveRankingStrategy.ts); consumidor [`src/application/use-cases/GetLevelLeaderboard.ts`](../src/application/use-cases/GetLevelLeaderboard.ts) (la recibe por constructor, inyectada en [`LeaderboardModuleFactory`](../src/main/factories/LeaderboardModuleFactory.ts)).
- **Problema que resuelve:** el algoritmo de ranking del leaderboard (score DESC → movimientos ASC → tiempo ASC → fecha ASC) es una política intercambiable, no una regla fija del caso de uso. Con la estrategia inyectada se pueden añadir rankings alternativos (p. ej. modo *speedrun* ordenado por tiempo, ranking semanal) creando una nueva clase, sin modificar `GetLevelLeaderboard` (Open/Closed).
- **Alternativas consideradas:** método estático en un servicio de dominio (implementación original) — descartado por imposibilitar la sustitución del algoritmo y dificultar el mock en tests; condicionales por "modo" dentro del caso de uso — descartado por violar Open/Closed.
- **Tests:** [`tests/domain/services/CompetitiveRankingStrategy.spec.ts`](../tests/domain/services/CompetitiveRankingStrategy.spec.ts), [`tests/application/use-cases/GetLevelLeaderboard.spec.ts`](../tests/application/use-cases/GetLevelLeaderboard.spec.ts) (incluye un test que inyecta una estrategia falsa).

---

## Nota: Repository (patrón arquitectónico complementario)

No es GoF, pero completa el cuadro: las interfaces [`src/domain/repositories/I*Repository.ts`](../src/domain/repositories/) con implementaciones JSON en [`src/infrastructure/repositories/`](../src/infrastructure/repositories/) median entre el dominio y la persistencia. Es la pieza que hace posible el Adapter y el Open/Closed documentados en el README (el paso de memoria a JSON no tocó ningún caso de uso).
