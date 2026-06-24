import { GetLevels } from '../../../src/application/use-cases/GetLevels';
import { type ILevelRepository } from '../../../src/domain/repositories/ILevelRepository';
import { LevelNotFoundError } from '../../../src/domain/exceptions/LevelExceptions';
import type { LevelDataDTO } from '../../../src/domain/shared/contracts/LevelDataDTOs';

describe('GetLevels Use Case', () => {
  let mockLevelRepository: jest.Mocked<ILevelRepository>;
  let useCase: GetLevels;

  const fakeLevelData: LevelDataDTO = {
    id: 'lvl_01',
    allowedMoves: 10,
    cells: [{ id: 'C1', portCount: 4 }],
    connections: [],
    arrows: [{ id: 'arr_1', head: { cellId: 'C1', exitPort: 1 }, body: [] }]
  };

  const fakeMetadata = [
    { id: 'lvl_01', name: 'Level 1', difficulty: 'easy', allowedMoves: 10 },
    { id: 'lvl_02', name: 'Level 2', difficulty: 'hard', allowedMoves: 15 }
  ];

  beforeEach(() => {
    mockLevelRepository = {
      findAllMetadata: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };
    useCase = new GetLevels(mockLevelRepository);
  });

  it('should_return_catalog_when_called_without_difficulty', async () => {
    // Arrange
    mockLevelRepository.findAllMetadata.mockResolvedValue(fakeMetadata);

    // Act
    const result = await useCase.getCatalog();

    // Assert
    expect(mockLevelRepository.findAllMetadata).toHaveBeenCalledWith(undefined);
    expect(result).toHaveLength(2);
  });

  it('should_return_filtered_catalog_when_difficulty_is_provided', async () => {
    // Arrange
    mockLevelRepository.findAllMetadata.mockResolvedValue([fakeMetadata[1]]);

    // Act
    const result = await useCase.getCatalog('hard');

    // Assert
    expect(mockLevelRepository.findAllMetadata).toHaveBeenCalledWith('hard');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('lvl_02');
  });

  it('should_return_level_data_when_getById_is_called_with_existing_id', async () => {
    // Arrange
    mockLevelRepository.findById.mockResolvedValue(fakeLevelData);

    // Act
    const result = await useCase.getById('lvl_01');

    // Assert
    expect(mockLevelRepository.findById).toHaveBeenCalledWith('lvl_01');
    expect(result).toEqual(fakeLevelData);
  });

  it('should_throw_LevelNotFoundError_when_getById_is_called_with_unknown_id', async () => {
    // Arrange
    mockLevelRepository.findById.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.getById('ghost_level')).rejects.toThrow(LevelNotFoundError);
  });
});