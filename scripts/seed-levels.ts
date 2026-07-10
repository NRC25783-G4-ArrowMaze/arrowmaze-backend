import fs from 'node:fs/promises';
import path from 'node:path';
import { ManageLevel } from '../src/application/use-cases/ManageLevel.js';
import { JsonLevelRepository } from '../src/infrastructure/repositories/JsonLevelRepository.js';
import { LevelSeeder } from '../src/infrastructure/seeding/LevelSeeder.js';
import type { LevelDataDTO } from '../src/domain/shared/contracts/LevelDataDTOs.js';

/**
 * Entrypoint del seed de niveles: `pnpm seed`.
 *
 * Lee seeds/levels.seed.json (versionado; se regenera con el exportador de
 * arrowmaze-game) y lo siembra en data/levels.json (gitignoreado). Idempotente:
 * puede correrse tras cada clone o cuando cambie el seed.
 */
async function main(): Promise<void> {
  const seedPath = path.resolve(process.cwd(), 'seeds', 'levels.seed.json');
  const raw = await fs.readFile(seedPath, 'utf-8');
  const levels = JSON.parse(raw) as LevelDataDTO[];

  const seeder = new LevelSeeder(new ManageLevel(new JsonLevelRepository()));
  const { created, updated } = await seeder.run(levels);

  console.log(`Seed de niveles completado: ${created} creados, ${updated} actualizados.`);
}

main().catch((error) => {
  console.error('Error ejecutando el seed de niveles:', error);
  process.exit(1);
});
