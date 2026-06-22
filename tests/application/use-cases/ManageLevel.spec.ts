import { ManageLevel } from '../../../src/application/use-cases/ManageLevel';
import { type ILevelRepository } from '../../../src/domain/repositories/ILevelRepository';
import { LevelValidationError, LevelAlreadyExistsError } from '../../../src/domain/exceptions/LevelExceptions';
import type { LevelDataDTO } from '../../../src/domain/contracts/LevelDataDTOs';

describe('ManageLevel Use Case', () => {
  let mockLevelRepository: jest.Mocked<ILevelRepository>;
  let useCase: ManageLevel;

  const validPayload: LevelDataDTO = {
    id: 'lvl_100',
    allowedMoves: 5,
    cells: [{ id: 'C1', portCount: 4 }],
    connections: [],
    arrows: [{ id: 'arr1', head: { cellId: 'C1', exitPort: 0 }, body: [] }]
  };

  beforeEach(() => {
    mockLevelRepository = {
      findAllMetadata: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };
    useCase = new ManageLevel(mockLevelRepository);
  });

  // ─── CREACIÓN ─────────────────────────────────────────────────────────────

  it('should_save_and_return_id_when_create_receives_valid_payload', async () => {
    // Arrange
    mockLevelRepository.findById.mockResolvedValue(null); // No existe previo

    // Act
    const id = await useCase.create(validPayload);

    // Assert
    expect(mockLevelRepository.save).toHaveBeenCalledWith(validPayload);
    expect(id).toBe('lvl_100');
  });

  it('should_throw_LevelAlreadyExistsError_when_creating_with_existing_id', async () => {
    // Arrange
    mockLevelRepository.findById.mockResolvedValue(validPayload); // Ya existe

    // Act & Assert
    await expect(useCase.create(validPayload)).rejects.toThrow(LevelAlreadyExistsError);
  });

  // ─── VALIDACIONES ESTRUCTURALES ──────────────────────────────────────────

  it('should_throw_LevelValidationError_when_payload_is_missing_allowedMoves', async () => {
    // Arrange
    const badPayload = { ...validPayload } as any;
    delete badPayload.allowedMoves;

    // Act & Assert
    await expect(useCase.create(badPayload)).rejects.toThrow(LevelValidationError);
    await expect(useCase.create(badPayload)).rejects.toThrow('missing required field');
  });

  it('should_throw_LevelValidationError_when_arrows_array_is_empty', async () => {
    // Arrange
    const badPayload = { ...validPayload, arrows: [] };

    // Act & Assert
    await expect(useCase.create(badPayload)).rejects.toThrow(LevelValidationError);
    await expect(useCase.create(badPayload)).rejects.toThrow('must contain at least one arrow');
  });

  // ─── ACTUALIZACIÓN ───────────────────────────────────────────────────────

  it('should_update_level_when_payload_is_valid_and_id_matches', async () => {
    // Arrange
    mockLevelRepository.findById.mockResolvedValue(validPayload); // Existe previo

    // Act
    await useCase.update('lvl_100', validPayload);

    // Assert
    expect(mockLevelRepository.update).toHaveBeenCalledWith('lvl_100', validPayload);
  });

  it('should_throw_LevelValidationError_when_updating_with_mismatched_id', async () => {
    // Arrange
    mockLevelRepository.findById.mockResolvedValue(validPayload);

    // Act & Assert
    // Intentar actualizar la URL 'lvl_99' enviando el ID interno 'lvl_100'
    await expect(useCase.update('lvl_99', validPayload)).rejects.toThrow(LevelValidationError);
  });
});