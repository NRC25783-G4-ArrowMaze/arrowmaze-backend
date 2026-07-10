import { ProgressController } from '../../../src/presentation/controllers/ProgressController.js';
import { type Request, type Response } from 'express';
import { ProgressNotFoundError, ProgressValidationError, LevelRegistryError } from '../../../src/domain/exceptions/ProgressExceptions.js';

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

  it('should_propagate_ProgressValidationError_when_validation_fails_on_save', async () => {
    // Arrange: el ErrorHandlerAspect traduce la excepción a 400 (ver su spec)
    mockSaveProgress.execute.mockRejectedValue(new ProgressValidationError('invalid moves'));

    // Act & Assert
    await expect(
      controller.save(mockRequest as Request, mockResponse as Response)
    ).rejects.toThrow(ProgressValidationError);
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should_propagate_LevelRegistryError_when_level_does_not_exist_on_save', async () => {
    // Arrange: el ErrorHandlerAspect traduce la excepción a 422 (ver su spec)
    mockSaveProgress.execute.mockRejectedValue(new LevelRegistryError('not found in db'));

    // Act & Assert
    await expect(
      controller.save(mockRequest as Request, mockResponse as Response)
    ).rejects.toThrow(LevelRegistryError);
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should_propagate_ProgressNotFoundError_when_progress_not_found_by_level', async () => {
    // Arrange: el ErrorHandlerAspect traduce la excepción a 404 (ver su spec)
    mockRequest.params = { levelId: 'lvl_99' };
    mockGetProgress.getByLevel.mockRejectedValue(new ProgressNotFoundError());

    // Act & Assert
    await expect(
      controller.getByLevel(mockRequest as unknown as Request<{ levelId: string }>, mockResponse as Response)
    ).rejects.toThrow(ProgressNotFoundError);
    expect(mockResponse.status).not.toHaveBeenCalled();
  });
});