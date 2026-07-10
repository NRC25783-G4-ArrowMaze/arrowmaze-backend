import { type Request, type Response } from 'express';
import { type GetProgress } from '../../application/use-cases/GetProgress.js';
import { type SaveProgress } from '../../application/use-cases/SaveProgress.js';

// Los errores de dominio se traducen a HTTP en el ErrorHandlerAspect;
// en Express 5 las promesas rechazadas llegan solas al error handler.
export class ProgressController {
  constructor(
    private readonly getProgress: GetProgress,
    private readonly saveProgress: SaveProgress
  ) {}

  public save = async (req: Request, res: Response): Promise<void> => {
    // Inyección segura del inquilino gracias al middleware de autenticación
    const userId = req.accountId as string;

    const result = await this.saveProgress.execute(userId, req.body);
    res.status(200).json(result);
  };

  public getAll = async (req: Request, res: Response): Promise<void> => {
    const userId = req.accountId as string;
    const progressList = await this.getProgress.getAllByUser(userId);
    res.status(200).json(progressList);
  };

  public getByLevel = async (req: Request<{ levelId: string }>, res: Response): Promise<void> => {
    const userId = req.accountId as string;
    const { levelId } = req.params;

    if (typeof levelId !== 'string') {
      res.status(400).json({ error: 'Bad Request: levelId must be a string' });
      return;
    }

    const progress = await this.getProgress.getByLevel(userId, levelId);
    res.status(200).json(progress);
  };
}
