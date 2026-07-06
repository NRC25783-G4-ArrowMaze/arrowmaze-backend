import type { LevelDataDTO } from "../shared/contracts/LevelDataDTOs.js";

export type LevelMetadata = Omit<LevelDataDTO, 'cells' | 'connections' | 'arrows'>;

export interface ILevelRepository {
  /** Bloque 1: Catálogo filtrable (Excluye topología pesada) */
  findAllMetadata(difficulty?: string): Promise<LevelMetadata[]>;
  
  /** Bloque 2: Descarga específica */
  findById(id: string): Promise<LevelDataDTO | null>;
  
  /** Bloque 3: Sincronización masiva */
  findAll(): Promise<LevelDataDTO[]>;
  
  /** Bloque 4: Creación */
  save(level: LevelDataDTO): Promise<void>;
  
  /** Bloque 4: Actualización */
  update(id: string, level: LevelDataDTO): Promise<void>;
}