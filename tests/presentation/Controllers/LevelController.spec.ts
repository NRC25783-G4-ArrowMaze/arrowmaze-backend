import { LevelController } from '../../../src/presentation/controllers/LevelController';
import { GetLevels } from '../../../src/application/use-cases/GetLevels';
import { ManageLevel } from '../../../src/application/use-cases/ManageLevel';
import { LevelNotFoundError, LevelValidationError, LevelAlreadyExistsError } from '../../../src/domain/exceptions/LevelExceptions';
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

  it('should_return_404_on_getById_when_not_found', async () => {
    // Arrange
    mockGetLevels.getById.mockRejectedValue(new LevelNotFoundError());
    mockRequest.params = { id: 'ghost' };

    // Act - Casteo explícito a Request<{ id: string }>
    await controller.getById(
      mockRequest as unknown as Request<{ id: string }>, 
      mockResponse as Response
    );

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Level not found' });
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

  it('should_return_409_on_create_when_level_already_exists', async () => {
    // Arrange
    mockManageLevel.create.mockRejectedValue(new LevelAlreadyExistsError('Already exists'));

    // Act
    await controller.create(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(409);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Already exists' });
  });

  it('should_return_400_on_update_when_validation_fails', async () => {
    // Arrange
    mockManageLevel.update.mockRejectedValue(new LevelValidationError('Invalid data'));
    mockRequest.params = { id: 'lvl_1' };

    // Act - Casteo explícito a Request<{ id: string }>
    await controller.update(
      mockRequest as unknown as Request<{ id: string }>, 
      mockResponse as Response
    );

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid data' });
  });
});