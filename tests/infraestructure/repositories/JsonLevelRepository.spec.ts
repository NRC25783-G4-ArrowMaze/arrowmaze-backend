import fs from 'node:fs/promises';
import { JsonLevelRepository } from '../../../src/infrastructure/repositories/JsonLevelRepository';
import type { LevelDataDTO } from '../../../src/domain/shared/contracts/LevelDataDTOs';

// Mock de la librería nativa del sistema de archivos
jest.mock('fs/promises');

describe('JsonLevelRepository', () => {
  let repository: JsonLevelRepository;
  const mockFs = fs as jest.Mocked<typeof fs>;

  const fakeLevelData: LevelDataDTO[] = [
    { id: 'lvl_1', name: 'Level 1', difficulty: 'easy', allowedMoves: 5, cells: [], connections: [], arrows: [] },
    { id: 'lvl_2', name: 'Level 2', difficulty: 'hard', allowedMoves: 10, cells: [], connections: [], arrows: [] }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new JsonLevelRepository('test_levels.json');
  });

  it('should_create_file_if_it_does_not_exist_on_read', async () => {
    // Arrange
    const accessError = new Error('ENOENT');
    mockFs.access.mockRejectedValueOnce(accessError); // Simulamos que el archivo no existe
    mockFs.mkdir.mockResolvedValueOnce(undefined);
    mockFs.writeFile.mockResolvedValueOnce(undefined);
    mockFs.readFile.mockResolvedValueOnce('[]');

    // Act
    await repository.findAll();

    // Assert
    expect(mockFs.mkdir).toHaveBeenCalled();
    expect(mockFs.writeFile).toHaveBeenCalledWith(expect.any(String), '[]', 'utf-8');
  });

  it('should_return_only_metadata_when_findAllMetadata_is_called', async () => {
    // Arrange
    mockFs.access.mockResolvedValueOnce(undefined); // El archivo existe
    mockFs.readFile.mockResolvedValueOnce(JSON.stringify(fakeLevelData));

    // Act
    const result = await repository.findAllMetadata();

    // Assert
    expect(result).toHaveLength(2);
    // Verificamos que se hayan excluido las propiedades pesadas
    expect(result[0]).not.toHaveProperty('cells');
    expect(result[0]).not.toHaveProperty('arrows');
    expect(result[0]).toHaveProperty('difficulty');
  });

  it('should_filter_metadata_by_difficulty_when_provided', async () => {
    // Arrange
    mockFs.access.mockResolvedValueOnce(undefined);
    mockFs.readFile.mockResolvedValueOnce(JSON.stringify(fakeLevelData));

    // Act
    const result = await repository.findAllMetadata('hard');

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('lvl_2');
  });

  it('should_append_new_level_when_save_is_called', async () => {
    // Arrange
    const newLevel: LevelDataDTO = { id: 'lvl_3', name: 'Level 3', allowedMoves: 15, cells: [], connections: [], arrows: [] };
    mockFs.access.mockResolvedValueOnce(undefined);
    mockFs.readFile.mockResolvedValueOnce(JSON.stringify(fakeLevelData)); // Datos actuales
    mockFs.writeFile.mockResolvedValueOnce(undefined);

    // Act
    await repository.save(newLevel);

    // Assert
    expect(mockFs.writeFile).toHaveBeenCalledTimes(1);
    const writtenJson = mockFs.writeFile.mock.calls[0][1] as string;
    const writtenData = JSON.parse(writtenJson);
    
    expect(writtenData).toHaveLength(3);
    expect(writtenData[2].id).toBe('lvl_3');
  });

  it('should_replace_existing_level_when_update_is_called', async () => {
    // Arrange
    const updatedLevel = { ...fakeLevelData[0], allowedMoves: 99 };
    mockFs.access.mockResolvedValueOnce(undefined);
    mockFs.readFile.mockResolvedValueOnce(JSON.stringify(fakeLevelData));
    mockFs.writeFile.mockResolvedValueOnce(undefined);

    // Act
    await repository.update('lvl_1', updatedLevel);

    // Assert
    const writtenJson = mockFs.writeFile.mock.calls[0][1] as string;
    const writtenData = JSON.parse(writtenJson);
    
    expect(writtenData).toHaveLength(2);
    expect(writtenData[0].allowedMoves).toBe(99); // Verificamos la modificación
  });
});