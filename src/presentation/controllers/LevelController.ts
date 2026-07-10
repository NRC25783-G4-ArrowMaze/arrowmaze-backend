import { type Request, type Response } from 'express';
import { type GetLevels } from '../../application/use-cases/GetLevels.js';
import { type ManageLevel } from '../../application/use-cases/ManageLevel.js';

// Los errores de dominio se traducen a HTTP en el ErrorHandlerAspect;
// en Express 5 las promesas rechazadas llegan solas al error handler.
export class LevelController {
  constructor(
    private readonly getLevelsUseCase: GetLevels,
    private readonly manageLevelUseCase: ManageLevel
  ) {}

  public getAll = async (req: Request, res: Response): Promise<void> => {
    const difficulty = req.query.difficulty;
    const catalog = await this.getLevelsUseCase.getCatalog(difficulty);
    res.status(200).json(catalog);
  };

  public getById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const { id } = req.params;

    if (typeof id !== 'string') {
      res.status(400).json({ error: 'Bad Request: id must be a string' });
      return;
    }

    const level = await this.getLevelsUseCase.getById(id);
    res.status(200).json(level);
  };

  public getBulk = async (_req: Request, res: Response): Promise<void> => {
    const bulkData = await this.getLevelsUseCase.getBulk();
    res.status(200).json(bulkData);
  };

  public create = async (req: Request, res: Response): Promise<void> => {
    const assignedId = await this.manageLevelUseCase.create(req.body);
    res.status(201).json({
      message: 'Level created successfully',
      id: assignedId
    });
  };

  public update = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (typeof id !== 'string') {
      res.status(400).json({ error: 'Bad Request: id must be a string' });
      return;
    }

    await this.manageLevelUseCase.update(id, req.body);
    res.status(200).json({ message: 'Level updated successfully' });
  };
}
