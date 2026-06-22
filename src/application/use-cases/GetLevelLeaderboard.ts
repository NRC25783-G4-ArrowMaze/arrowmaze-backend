import { type ILevelRepository } from '../../domain/repositories/ILevelRepository';
import { type IProgressRepository } from '../../domain/repositories/IProgressRepository';
import { type IAccountRepository } from '../../domain/repositories/IAccountRepository';
import { LeaderboardSortingService } from '../../domain/services/LeaderboardSortingService';
import { LeaderboardValidationError } from '../../domain/exceptions/LeaderboardExceptions';
import { LevelRegistryError } from '../../domain/exceptions/ProgressExceptions';
import type { LeaderboardResponseDTO } from '../../domain/shared/contracts/LeaderboardDTO';
import { type Account } from '../../domain/entities/Account';

export class GetLevelLeaderboard {
  constructor(
    private readonly levelRepository: ILevelRepository,
    private readonly progressRepository: IProgressRepository,
    private readonly accountRepository: IAccountRepository
  ) {}

  async execute(levelId: string, currentUserId: string, limitParam: unknown): Promise<LeaderboardResponseDTO> {
    const limit = this.validateLimit(limitParam);

    // 1. Validar existencia del nivel (Bloque 3 del Gherkin)
    const levelExists = await this.levelRepository.findById(levelId);
    if (!levelExists) {
      throw new LevelRegistryError('LevelRegistryError: el nivel especificado no existe');
    }

    // 2. Obtener todos los progresos de ese nivel
    const allProgress = await this.progressRepository.findAllByLevel(levelId);

    // 3. Early return si nadie ha jugado el nivel (Bloque 1, Escenario 3)
    if (allProgress.length === 0) {
      return { topPlayers: [], currentRecord: null };
    }

    // 4. Extraer IDs únicos y buscar las cuentas
    const userIds = Array.from(new Set(allProgress.map(p => p.userId)));
    const accounts = await Promise.all(userIds.map(id => this.accountRepository.findById(id)));
    
    // Mapa para asociar el ID del usuario con un alias seguro (extraído del email)
    const aliasMap = new Map<string, string>();
    
    accounts.forEach((acc: Account | null) => {
      if (acc) {
        const id = acc.getId();
        // Asumiendo que tu Value Object Email tiene un método getValue() o similar que retorna el string
        const emailString = acc.getEmail().getValue(); 
        
        // Extraemos solo la parte antes del '@' para proteger la privacidad
        const alias = emailString.split('@')[0]; 
        
        aliasMap.set(id, alias);
      }
    });

    // 5. Ensamblar los datos no ordenados (Unranked)
    const unrankedEntries = allProgress.map(p => ({
      username: aliasMap.get(p.userId) || 'Unknown Player', // Usamos el alias seguro
      score: p.score,
      movesUsed: p.movesUsed,
      timeElapsedSeconds: p.timeElapsedSeconds,
      achievedAt: p.achievedAt,
      _internalUserId: p.userId
    }));

    // 6. Delegar el ordenamiento en cascada al Servicio de Dominio
    const rankedEntries = LeaderboardSortingService.sortAndRank(unrankedEntries);

    // 7. Extraer el registro del jugador actual (Bloque 2 del Gherkin)
    const currentRecordRaw = rankedEntries.find(entry => (entry as any)._internalUserId === currentUserId) || null;
    
    // Limpiamos el ID interno para no filtrarlo a la red
    let currentRecord = null;
    if (currentRecordRaw) {
      const { _internalUserId, ...cleanEntry } = currentRecordRaw as any;
      currentRecord = cleanEntry;
    }

    // 8. Aplicar el límite (Paginación) y limpiar IDs del Top Players
    const topPlayers = rankedEntries.slice(0, limit).map(entry => {
      const { _internalUserId, ...cleanEntry } = entry as any;
      return cleanEntry;
    });

    return { topPlayers, currentRecord };
  }

  private validateLimit(limitParam: unknown): number {
    if (limitParam === undefined) {
      return 10; // Default limit
    }

    const limit = Number(limitParam);
    if (Number.isNaN(limit) || !Number.isInteger(limit) || limit <= 0) {
      throw new LeaderboardValidationError('Limit must be a positive integer');
    }

    return limit;
  }
}