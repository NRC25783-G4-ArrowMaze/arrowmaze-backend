import fs from 'node:fs/promises';
import { JsonProgressRepository } from '../../../src/infrastructure/repositories/JsonProgressRepository.js';
import type { LevelProgressDTO } from '../../../src/domain/shared/contracts/ProgressDTO.js';

jest.mock('fs/promises');

describe('JsonProgressRepository', () => {
  let repository: JsonProgressRepository;
  const mockFs = fs as jest.Mocked<typeof fs>;

  const fakeData: LevelProgressDTO[] = [
    { levelId: 'lvl_1', userId: 'user_A', score: 100, movesUsed: 5, timeElapsedSeconds: 10, achievedAt: '' },
    { levelId: 'lvl_2', userId: 'user_A', score: 200, movesUsed: 5, timeElapsedSeconds: 10, achievedAt: '' },
    { levelId: 'lvl_1', userId: 'user_B', score: 500, movesUsed: 5, timeElapsedSeconds: 10, achievedAt: '' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new JsonProgressRepository('test_progress.json');
    mockFs.access.mockResolvedValue(undefined); // Asumimos que el archivo existe
    mockFs.readFile.mockResolvedValue(JSON.stringify(fakeData));
    mockFs.writeFile.mockResolvedValue(undefined);
  });

  it('should_find_all_progress_strictly_filtered_by_userId', async () => {
    // Act
    const result = await repository.findAllByUser('user_A');

    // Assert
    expect(result).toHaveLength(2);
    expect(result.every(p => p.userId === 'user_A')).toBe(true); // Aislamiento garantizado
  });

  it('should_insert_new_record_if_user_and_level_combination_is_new', async () => {
    // Arrange
    const newProgress: LevelProgressDTO = { levelId: 'lvl_3', userId: 'user_A', score: 300, movesUsed: 5, timeElapsedSeconds: 10, achievedAt: '' };

    // Act
    await repository.save(newProgress);

    // Assert
    const writtenJson = mockFs.writeFile.mock.calls[0][1] as string;
    const writtenData = JSON.parse(writtenJson);
    expect(writtenData).toHaveLength(4); // 3 originales + 1 nuevo
  });

  it('should_overwrite_existing_record_if_user_and_level_combination_exists', async () => {
    // Arrange
    const updatedProgress: LevelProgressDTO = { levelId: 'lvl_1', userId: 'user_A', score: 9999, movesUsed: 5, timeElapsedSeconds: 10, achievedAt: '' };

    // Act
    await repository.save(updatedProgress);

    // Assert
    const writtenJson = mockFs.writeFile.mock.calls[0][1] as string;
    const writtenData = JSON.parse(writtenJson);
    expect(writtenData).toHaveLength(3); // El tamaño no cambia
    expect(writtenData[0].score).toBe(9999); // El registro se sobrescribió
  });
});