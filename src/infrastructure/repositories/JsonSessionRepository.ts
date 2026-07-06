import fs from 'node:fs/promises';
import path from 'node:path';
import { type ISessionRepository } from '../../domain/repositories/ISessionRepository.js';
import { serialize } from '../persistence/FileWriteQueue.js';

interface SessionRaw {
  jti: string;
  expiresAt: string; // En JSON las fechas se guardan como strings ISO
}

export class JsonSessionRepository implements ISessionRepository {
  private readonly filePath: string;

  constructor(fileName: string = 'blacklist.json') {
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

  private async readData(): Promise<SessionRaw[]> {
    await this.ensureFileExists();
    const data = await fs.readFile(this.filePath, 'utf-8');
    return JSON.parse(data) as SessionRaw[];
  }

  private async writeData(data: SessionRaw[]): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  async revoke(jti: string, expiresAt: Date): Promise<void> {
    // Serializamos el ciclo read-modify-write completo para no perder
    // escrituras cuando dos peticiones concurrentes tocan el mismo archivo
    await serialize(this.filePath, async () => {
      const sessions = await this.readData();
      sessions.push({
        jti,
        expiresAt: expiresAt.toISOString(),
      });
      await this.writeData(sessions);
    });
  }

  async isRevoked(jti: string): Promise<boolean> {
    const sessions = await this.readData();
    return sessions.some(s => s.jti === jti);
  }

  async deleteExpiredTokens(currentDate: Date): Promise<number> {
    return serialize(this.filePath, async () => {
      const sessions = await this.readData();
      const initialLength = sessions.length;

      // Filtramos para conservar SOLO los que expiran en el futuro
      const validSessions = sessions.filter(s => new Date(s.expiresAt) > currentDate);

      const deletedCount = initialLength - validSessions.length;

      if (deletedCount > 0) {
        await this.writeData(validSessions);
      }

      return deletedCount;
    });
  }
}