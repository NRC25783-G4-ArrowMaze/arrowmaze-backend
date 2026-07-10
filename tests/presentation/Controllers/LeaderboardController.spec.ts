import { type Request, type Response } from 'express';
import { LeaderboardController } from '../../../src/presentation/controllers/LeaderboardController.js';
import { LeaderboardValidationError } from '../../../src/domain/exceptions/LeaderboardExceptions.js';
import { LevelNotFoundError } from '../../../src/domain/exceptions/LevelExceptions.js';

describe('LeaderboardController', () => {
  let mockGetLevelLeaderboard: any;
  let controller: LeaderboardController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockGetLevelLeaderboard = { execute: jest.fn() };
    controller = new LeaderboardController(mockGetLevelLeaderboard);

    mockRequest = { 
      params: { levelId: 'lvl_1' }, 
      query: { limit: '10' },
      accountId: 'user_token_123' 
    };
    mockResponse = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  it('should_return_200_and_payload_on_success', async () => {
    const fakeData = { topPlayers: [], currentRecord: null };
    mockGetLevelLeaderboard.execute.mockResolvedValue(fakeData);

    await controller.getByLevel(mockRequest as Request<{ levelId: string }>, mockResponse as Response);

    expect(mockGetLevelLeaderboard.execute).toHaveBeenCalledWith('lvl_1', 'user_token_123', '10');
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(fakeData);
  });

  it('should_propagate_LeaderboardValidationError_when_validation_fails', async () => {
    // El ErrorHandlerAspect traduce la excepción a 400 (ver su spec)
    mockGetLevelLeaderboard.execute.mockRejectedValue(new LeaderboardValidationError('Invalid limit'));

    await expect(
      controller.getByLevel(mockRequest as Request<{ levelId: string }>, mockResponse as Response)
    ).rejects.toThrow(LeaderboardValidationError);
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should_propagate_LevelNotFoundError_when_level_does_not_exist', async () => {
    // El ErrorHandlerAspect traduce la excepción a 404 (ver su spec)
    mockGetLevelLeaderboard.execute.mockRejectedValue(new LevelNotFoundError('Not found'));

    await expect(
      controller.getByLevel(mockRequest as Request<{ levelId: string }>, mockResponse as Response)
    ).rejects.toThrow(LevelNotFoundError);
    expect(mockResponse.status).not.toHaveBeenCalled();
  });
});