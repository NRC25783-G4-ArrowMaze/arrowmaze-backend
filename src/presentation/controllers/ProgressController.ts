import { type Request, type Response } from 'express';
import { type GetProgress } from '../../application/use-cases/GetProgess';
import { type SaveProgress } from '../../application/use-cases/SaveProgress';
import { ProgressValidationError, LevelRegistryError, ProgressNotFoundError } from '../../domain/exceptions/ProgressExceptions';

export class ProgressController {
  constructor(
    private readonly getProgress: GetProgress,
    private readonly saveProgress: SaveProgress
  ) {}

  public save = async (req: Request, res: Response): Promise<void> => {
    try {
      // Inyección segura del inquilino gracias al middleware de autenticación
      const userId = req.accountId as string;
      
      const result = await this.saveProgress.execute(userId, req.body);
      res.status(200).json(result);
    } catch (error) {
      console.error('[ProgressController.save] Error:', error);
      
      if (error instanceof ProgressValidationError) {
        res.status(400).json({ error: error.message });
        return;
      }
      if (error instanceof LevelRegistryError) {
        res.status(422).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Internal server error saving progress' });
    }
  };

  public getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.accountId as string;
      const progressList = await this.getProgress.getAllByUser(userId);
      res.status(200).json(progressList);
    } catch (error) {
      console.error('[ProgressController.getAll] Error:', error);
      res.status(500).json({ error: 'Internal server error fetching progress' });
    }
  };

  public getByLevel = async (req: Request<{ levelId: string }>, res: Response): Promise<void> => {
    try {
      const userId = req.accountId as string;
      const { levelId } = req.params;

      if (typeof levelId !== 'string') {
        res.status(400).json({ error: 'Bad Request: levelId must be a string' });
        return;
      }

      const progress = await this.getProgress.getByLevel(userId, levelId);
      res.status(200).json(progress);
    } catch (error) {
      console.error('[ProgressController.getByLevel] Error:', error);
      
      if (error instanceof ProgressNotFoundError) {
        res.status(404).json({ error: 'Progress not found for this level' });
        return;
      }
      res.status(500).json({ error: 'Internal server error fetching level progress' });
    }
  };
}