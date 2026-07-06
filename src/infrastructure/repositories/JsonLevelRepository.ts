import fs from 'node:fs/promises';
import path from 'node:path';
import { type ILevelRepository, type LevelMetadata } from '../../domain/repositories/ILevelRepository.js';
import type { LevelDataDTO } from '../../domain/shared/contracts/LevelDataDTOs.js';
import { serialize } from '../persistence/FileWriteQueue.js';

export class JsonLevelRepository implements ILevelRepository {
  private readonly filePath: string;

  constructor(fileName: string = 'levels.json') {
    this.filePath = path.resolve(process.cwd(), 'data', fileName);
  }

  private async ensureFileExists(): Promise<void> {
    try {
      await fs.access(this.filePath);
    } catch {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      await fs.writeFile(this.filePath, JSON.stringify([]), 'utf-8');
    }
  }

  private async readData(): Promise<LevelDataDTO[]> {
    await this.ensureFileExists();
    const data = await fs.readFile(this.filePath, 'utf-8');
    return JSON.parse(data) as LevelDataDTO[];
  }

  private async writeData(data: LevelDataDTO[]): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  // ─────────────────────────────────────────────
  // OPERACIONES DE LECTURA
  // ─────────────────────────────────────────────

  async findAllMetadata(difficulty?: string): Promise<LevelMetadata[]> {
    const allLevels = await this.readData();
    
    // Filtrar si se especifica dificultad en el query string
    const filtered = difficulty 
      ? allLevels.filter(l => l.difficulty?.toLowerCase() === difficulty.toLowerCase())
      : allLevels;

    // Proyección: Excluir celdas, conexiones y flechas para optimizar la red
    return filtered.map(({ id, name, difficulty: diff, allowedMoves }) => ({
      id,
      name,
      difficulty: diff,
      allowedMoves
    }));
  }

  async findById(id: string): Promise<LevelDataDTO | null> {
    const allLevels = await this.readData();
    const found = allLevels.find(l => l.id === id);
    return found || null;
  }

  async findAll(): Promise<LevelDataDTO[]> {
    return this.readData();
  }

  // ─────────────────────────────────────────────
  // OPERACIONES DE ESCRITURA
  // ─────────────────────────────────────────────

  async save(level: LevelDataDTO): Promise<void> {
    // Serializamos el ciclo read-modify-write completo para no perder
    // escrituras cuando dos peticiones concurrentes tocan el mismo archivo
    await serialize(this.filePath, async () => {
      const allLevels = await this.readData();
      allLevels.push(level);
      await this.writeData(allLevels);
    });
  }

  async update(id: string, level: LevelDataDTO): Promise<void> {
    await serialize(this.filePath, async () => {
      const allLevels = await this.readData();
      const index = allLevels.findIndex(l => l.id === id);

      if (index >= 0) {
        allLevels[index] = level;
        await this.writeData(allLevels);
      }
    });
  }
}