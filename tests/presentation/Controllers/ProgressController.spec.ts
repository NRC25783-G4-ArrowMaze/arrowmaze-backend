import { ProgressController } from '../../../src/presentation/controllers/ProgressController';
import { type Request, type Response } from 'express';
import { ProgressNotFoundError, ProgressValidationError, LevelRegistryError } from '../../../src/domain/exceptions/ProgressExceptions';

describe('ProgressController', () => {
  let mockGetProgress: any;
  let mockSaveProgress: any;
  let controller: ProgressController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockGetProgress = { getAllByUser: jest.fn(), getByLevel: jest.fn() };
    mockSaveProgress = { execute: jest.fn() };
    controller = new ProgressController(mockGetProgress, mockSaveProgress);

    mockRequest = { body: {}, params: {}, accountId: 'user_token_id' }; // accountId inyectado por middleware
    mockResponse = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  it('should_return_400_when_validation_fails_on_save', async () => {
    // Arrange
    mockSaveProgress.execute.mockRejectedValue(new ProgressValidationError('invalid moves'));

    // Act
    await controller.save(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'invalid moves' });
  });

  it('should_return_422_when_level_does_not_exist_on_save', async () => {
    // Arrange
    mockSaveProgress.execute.mockRejectedValue(new LevelRegistryError('not found in db'));

    // Act
    await controller.save(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(422);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'not found in db' });
  });

  it('should_return_404_when_progress_not_found_by_level', async () => {
    // Arrange
    mockRequest.params = { levelId: 'lvl_99' };
    mockGetProgress.getByLevel.mockRejectedValue(new ProgressNotFoundError());

    // Act
    await controller.getByLevel(mockRequest as unknown as Request<{ levelId: string }>, mockResponse as Response);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(404);
  });
});