import { LevelController } from '../../../src/presentation/controllers/LevelController.js';
import { GetLevels } from '../../../src/application/use-cases/GetLevels.js';
import { ManageLevel } from '../../../src/application/use-cases/ManageLevel.js';
import { LevelNotFoundError, LevelValidationError, LevelAlreadyExistsError } from '../../../src/domain/exceptions/LevelExceptions.js';
import { type Request, type Response } from 'express';

describe('LevelController', () => {
  let mockGetLevels: jest.Mocked<GetLevels>;
  let mockManageLevel: jest.Mocked<ManageLevel>;
  let controller: LevelController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockGetLevels = { getCatalog: jest.fn(), getById: jest.fn(), getBulk: jest.fn() } as any;
    mockManageLevel = { create: jest.fn(), update: jest.fn() } as any;
    
    controller = new LevelController(mockGetLevels, mockManageLevel);

    mockRequest = { body: {}, params: {}, query: {} };
    mockResponse = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  it('should_return_200_and_catalog_on_getAll', async () => {
    // Arrange
    const fakeCatalog = [{ id: '1', allowedMoves: 5 }];
    mockGetLevels.getCatalog.mockResolvedValue(fakeCatalog);
    mockRequest.query = { difficulty: 'easy' };

    // Act
    await controller.getAll(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(mockGetLevels.getCatalog).toHaveBeenCalledWith('easy');
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(fakeCatalog);
  });

  it('should_propagate_LevelNotFoundError_on_getById_when_not_found', async () => {
    // Arrange: el ErrorHandlerAspect traduce la excepción a 404 (ver su spec)
    mockGetLevels.getById.mockRejectedValue(new LevelNotFoundError());
    mockRequest.params = { id: 'ghost' };

    // Act & Assert - Casteo explícito a Request<{ id: string }>
    await expect(
      controller.getById(mockRequest as unknown as Request<{ id: string }>, mockResponse as Response)
    ).rejects.toThrow(LevelNotFoundError);
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should_return_201_on_create_success', async () => {
    // Arrange
    mockManageLevel.create.mockResolvedValue('lvl_new');
    mockRequest.body = { id: 'lvl_new' };

    // Act
    await controller.create(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Level created successfully', id: 'lvl_new' });
  });

  it('should_propagate_LevelAlreadyExistsError_on_create_when_level_already_exists', async () => {
    // Arrange: el ErrorHandlerAspect traduce la excepción a 409 (ver su spec)
    mockManageLevel.create.mockRejectedValue(new LevelAlreadyExistsError('Already exists'));

    // Act & Assert
    await expect(
      controller.create(mockRequest as Request, mockResponse as Response)
    ).rejects.toThrow(LevelAlreadyExistsError);
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should_propagate_LevelValidationError_on_update_when_validation_fails', async () => {
    // Arrange: el ErrorHandlerAspect traduce la excepción a 400 (ver su spec)
    mockManageLevel.update.mockRejectedValue(new LevelValidationError('Invalid data'));
    mockRequest.params = { id: 'lvl_1' };

    // Act & Assert - Casteo explícito a Request<{ id: string }>
    await expect(
      controller.update(mockRequest as unknown as Request<{ id: string }>, mockResponse as Response)
    ).rejects.toThrow(LevelValidationError);
    expect(mockResponse.status).not.toHaveBeenCalled();
  });
});