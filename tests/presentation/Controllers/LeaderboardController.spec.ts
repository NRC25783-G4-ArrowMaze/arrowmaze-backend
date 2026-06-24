import { type Request, type Response } from 'express';
import { LeaderboardController } from '../../../src/presentation/controllers/LeaderboardController';
import { LeaderboardValidationError } from '../../../src/domain/exceptions/LeaderboardExceptions';
import { LevelRegistryError } from '../../../src/domain/exceptions/ProgressExceptions';

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

  it('should_return_400_when_validation_fails', async () => {
    mockGetLevelLeaderboard.execute.mockRejectedValue(new LeaderboardValidationError('Invalid limit'));

    await controller.getByLevel(mockRequest as Request<{ levelId: string }>, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid limit' });
  });

  it('should_return_404_when_level_does_not_exist', async () => {
    mockGetLevelLeaderboard.execute.mockRejectedValue(new LevelRegistryError('Not found'));

    await controller.getByLevel(mockRequest as Request<{ levelId: string }>, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Not found' });
  });
});