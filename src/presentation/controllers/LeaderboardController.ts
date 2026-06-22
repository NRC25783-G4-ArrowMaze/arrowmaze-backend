import { type Request, type Response } from 'express';
import { type GetLevelLeaderboard } from '../../application/use-cases/GetLevelLeaderboard';
import { LeaderboardValidationError } from '../../domain/exceptions/LeaderboardExceptions';
import { LevelRegistryError } from '../../domain/exceptions/ProgressExceptions';

export class LeaderboardController {
  constructor(private readonly getLevelLeaderboard: GetLevelLeaderboard) {}

  public getByLevel = async (req: Request<{ levelId: string }>, res: Response): Promise<void> => {
    try {
      const { levelId } = req.params;
      const { limit } = req.query;
      
      // Inyección segura del inquilino garantizada por el AuthMiddleware
      const currentUserId = req.accountId as string;

      if (typeof levelId !== 'string') {
        res.status(400).json({ error: 'Bad Request: levelId must be a string' });
        return;
      }

      const result = await this.getLevelLeaderboard.execute(levelId, currentUserId, limit);
      res.status(200).json(result);
      
    } catch (error) {
      console.error('[LeaderboardController.getByLevel] Error:', error);

      if (error instanceof LeaderboardValidationError) {
        res.status(400).json({ error: error.message });
        return;
      }
      
      if (error instanceof LevelRegistryError) {
        res.status(404).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: 'Internal server error fetching leaderboard' });
    }
  };
}