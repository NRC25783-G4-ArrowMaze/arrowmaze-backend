import { type Request, type Response } from 'express';
import { type GetLevels } from '../../application/use-cases/GetLevels.js';
import { type ManageLevel } from '../../application/use-cases/ManageLevel.js';
import { LevelNotFoundError, LevelValidationError, LevelAlreadyExistsError } from '../../domain/exceptions/LevelExceptions.js';

export class LevelController {
  constructor(
    private readonly getLevelsUseCase: GetLevels,
    private readonly manageLevelUseCase: ManageLevel
  ) {}

  public getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const difficulty = req.query.difficulty;
      const catalog = await this.getLevelsUseCase.getCatalog(difficulty);
      res.status(200).json(catalog);
    } catch (error) {
      console.error('[LevelController.getAll] Error:', error);
      res.status(500).json({ error: 'Internal server error cataloging levels' });
    }
  };

  public getById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (typeof id !== 'string') {
        res.status(400).json({ error: 'Bad Request: id must be a string' });
        return;
      }

      const level = await this.getLevelsUseCase.getById(id);
      res.status(200).json(level);
    } catch (error) {
      console.error('[LevelController.getById] Error:', error);
      
      if (error instanceof LevelNotFoundError) {
        res.status(404).json({ error: 'Level not found' });
        return;
      }
      res.status(500).json({ error: 'Internal server error fetching level details' });
    }
  };

  public getBulk = async (_req: Request, res: Response): Promise<void> => {
    try {
      const bulkData = await this.getLevelsUseCase.getBulk();
      res.status(200).json(bulkData);
    } catch (error) {
      console.error('[LevelController.getBulk] Error:', error);
      res.status(500).json({ error: 'Internal server error synchronizing levels in bulk' });
    }
  };

  public create = async (req: Request, res: Response): Promise<void> => {
    try {
      const assignedId = await this.manageLevelUseCase.create(req.body);
      res.status(201).json({ 
        message: 'Level created successfully',
        id: assignedId 
      });
    } catch (error) {
      if (error instanceof LevelValidationError) {
        res.status(400).json({ error: error.message });
        return;
      }
      if (error instanceof LevelAlreadyExistsError) {
        res.status(409).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Internal server error publishing new level' });
    }
  };

  public update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

    if (typeof id !== 'string') {
      res.status(400).json({ error: 'Bad Request: id must be a string' });
      return;
    }
      await this.manageLevelUseCase.update(id, req.body);
      res.status(200).json({ message: 'Level updated successfully' });
    } catch (error) {
      if (error instanceof LevelNotFoundError) {
        res.status(404).json({ error: 'Level not found' });
        return;
      }
      if (error instanceof LevelValidationError) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Internal server error modifying level' });
    }
  };
}