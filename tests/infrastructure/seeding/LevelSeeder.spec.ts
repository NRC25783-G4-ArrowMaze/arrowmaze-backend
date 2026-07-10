import { LevelSeeder } from '../../../src/infrastructure/seeding/LevelSeeder.js';
import { ManageLevel } from '../../../src/application/use-cases/ManageLevel.js';
import { LevelValidationError } from '../../../src/domain/exceptions/LevelExceptions.js';
import type { ILevelRepository, LevelMetadata } from '../../../src/domain/repositories/ILevelRepository.js';
import type { LevelDataDTO } from '../../../src/domain/shared/contracts/LevelDataDTOs.js';

/**
 * Fake in-memory del repositorio: permite probar el seeder con el ManageLevel
 * REAL (upsert + validación del Bloque 5), sin tocar el sistema de archivos.
 */
class InMemoryLevelRepository implements ILevelRepository {
  private readonly levels = new Map<string, LevelDataDTO>();

  async findAllMetadata(difficulty?: string): Promise<LevelMetadata[]> {
    const all = [...this.levels.values()];
    const filtered = difficulty
      ? all.filter((l) => l.difficulty?.toLowerCase() === difficulty.toLowerCase())
      : all;
    return filtered.map(({ id, name, difficulty: diff, allowedMoves }) => ({
      id, name, difficulty: diff, allowedMoves
    }));
  }

  async findById(id: string): Promise<LevelDataDTO | null> {
    return this.levels.get(id) ?? null;
  }

  async findAll(): Promise<LevelDataDTO[]> {
    return [...this.levels.values()];
  }

  async save(level: LevelDataDTO): Promise<void> {
    this.levels.set(level.id, level);
  }

  async update(id: string, level: LevelDataDTO): Promise<void> {
    this.levels.set(id, level);
  }
}

const makeLevel = (id: string, overrides: Partial<LevelDataDTO> = {}): LevelDataDTO => ({
  id,
  name: `Nivel ${id}`,
  difficulty: 'easy',
  allowedMoves: 10,
  cells: [{ id: '0,0', portCount: 4 }],
  connections: [],
  arrows: [{ id: 'a1', head: { cellId: '0,0', exitPort: 0 }, body: [] }],
  ...overrides
});

describe('LevelSeeder', () => {
  let repository: InMemoryLevelRepository;
  let seeder: LevelSeeder;

  beforeEach(() => {
    repository = new InMemoryLevelRepository();
    seeder = new LevelSeeder(new ManageLevel(repository));
  });

  it('should_insert_all_seed_levels_when_repository_is_empty', async () => {
    // Arrange
    const seed = [makeLevel('sample-level-2', { difficulty: 'medium' }), makeLevel('heart-preview')];

    // Act
    const result = await seeder.run(seed);

    // Assert
    expect(result).toEqual({ created: 2, updated: 0 });
    const stored = await repository.findAll();
    expect(stored).toHaveLength(2);
    expect(stored.map((l) => l.id)).toEqual(['sample-level-2', 'heart-preview']);
    expect(stored[0].difficulty).toBe('medium');
  });

  it('should_be_idempotent_when_run_twice', async () => {
    // Arrange
    const seed = [makeLevel('sample-level-2'), makeLevel('heart-preview')];

    // Act
    await seeder.run(seed);
    const secondRun = await seeder.run(seed);

    // Assert
    expect(secondRun).toEqual({ created: 0, updated: 2 });
    expect(await repository.findAll()).toHaveLength(2); // sin duplicados
  });

  it('should_overwrite_existing_level_with_seed_version', async () => {
    // Arrange
    await repository.save(makeLevel('sample-level-2', { allowedMoves: 5 }));
    const seed = [makeLevel('sample-level-2', { allowedMoves: 13 })];

    // Act
    const result = await seeder.run(seed);

    // Assert
    expect(result).toEqual({ created: 0, updated: 1 });
    const stored = await repository.findById('sample-level-2');
    expect(stored?.allowedMoves).toBe(13);
  });

  it('should_preserve_levels_not_present_in_seed', async () => {
    // Arrange: nivel creado por un admin, ajeno al seed
    await repository.save(makeLevel('admin-custom-level'));

    // Act
    await seeder.run([makeLevel('heart-preview')]);

    // Assert
    expect(await repository.findById('admin-custom-level')).not.toBeNull();
    expect(await repository.findAll()).toHaveLength(2);
  });

  it('should_fail_when_seed_contains_invalid_level', async () => {
    // Arrange: sin allowedMoves — debe rechazarlo la validación de ManageLevel
    const invalid = makeLevel('broken-level');
    delete (invalid as Partial<LevelDataDTO>).allowedMoves;

    // Act & Assert
    await expect(seeder.run([invalid])).rejects.toThrow(LevelValidationError);
    expect(await repository.findById('broken-level')).toBeNull();
  });
});
