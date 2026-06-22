import fs from 'node:fs/promises';
import path from 'node:path';
import { type IProgressRepository } from '../../domain/repositories/IProgressRepository';
import type { LevelProgressDTO } from '../../domain/shared/contracts/ProgressDTO';

export class JsonProgressRepository implements IProgressRepository {
  private readonly filePath: string;

  constructor(fileName: string = 'progress.json') {
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

  private async readData(): Promise<LevelProgressDTO[]> {
    await this.ensureFileExists();
    const data = await fs.readFile(this.filePath, 'utf-8');
    return JSON.parse(data) as LevelProgressDTO[];
  }

  private async writeData(data: LevelProgressDTO[]): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  // ─────────────────────────────────────────────
  // OPERACIONES DE LECTURA (Consultas)
  // ─────────────────────────────────────────────

  async findByUserAndLevel(userId: string, levelId: string): Promise<LevelProgressDTO | null> {
    const allProgress = await this.readData();
    const found = allProgress.find(p => p.userId === userId && p.levelId === levelId);
    return found || null;
  }

  async findAllByUser(userId: string): Promise<LevelProgressDTO[]> {
    const allProgress = await this.readData();
    // Filtro estricto para garantizar el aislamiento multitenant
    return allProgress.filter(p => p.userId === userId);
  }

  async findAllByLevel(levelId: string): Promise<LevelProgressDTO[]> {
    const allProgress = await this.readData();
    // Retorna todos los intentos exitosos para un nivel específico de todos los usuarios
    return allProgress.filter(p => p.levelId === levelId);
  }

  // ─────────────────────────────────────────────
  // OPERACIONES DE ESCRITURA (Comandos)
  // ─────────────────────────────────────────────

  async save(progress: LevelProgressDTO): Promise<void> {
    const allProgress = await this.readData();
    
    // Buscamos si ya existe un registro para ese usuario y ese nivel específico
    const index = allProgress.findIndex(
      p => p.userId === progress.userId && p.levelId === progress.levelId
    );

    if (index >= 0) {
      // Sobrescribimos el récord anterior
      allProgress[index] = progress;
    } else {
      // Es la primera vez que el jugador completa este nivel
      allProgress.push(progress);
    }

    await this.writeData(allProgress);
  }
}