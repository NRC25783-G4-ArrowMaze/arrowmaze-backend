import { type Request, type Response } from 'express';
import { type GetLevelLeaderboard } from '../../application/use-cases/GetLevelLeaderboard.js';

// Los errores de dominio se traducen a HTTP en el ErrorHandlerAspect;
// en Express 5 las promesas rechazadas llegan solas al error handler.
export class LeaderboardController {
  constructor(private readonly getLevelLeaderboard: GetLevelLeaderboard) {}

  public getByLevel = async (req: Request<{ levelId: string }>, res: Response): Promise<void> => {
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
  };
}
