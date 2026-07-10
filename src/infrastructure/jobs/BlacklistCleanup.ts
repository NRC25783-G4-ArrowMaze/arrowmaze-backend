import cron from 'node-cron';
import { type ISessionRepository } from '../../domain/repositories/ISessionRepository.js';

export class BlacklistCleanupJob {
  constructor(private readonly sessionRepository: ISessionRepository) {}

  /**
   * Inicia el proceso en segundo plano.
   * Por defecto, se ejecuta a las 03:00 AM todos los días.
   */
  public start(cronExpression: string = '0 3 * * *'): void {
    cron.schedule(cronExpression, async () => {
      console.log('[CronJob] Iniciando limpieza de la Blacklist...');
      try {
        const now = new Date();
        const deletedCount = await this.sessionRepository.deleteExpiredTokens(now);
        console.log(`[CronJob] Limpieza exitosa. ${deletedCount} tokens expirados fueron eliminados.`);
      } catch (error) {
        console.error('[CronJob] Error durante la limpieza de la Blacklist:', error);
      }
    });
  }
}