import fs from 'node:fs/promises';
import { JsonSessionRepository } from '../../../src/infrastructure/repositories/JsonSessionRepository.js';

// Le decimos a Jest que intercepte todas las llamadas al módulo real 'fs/promises'
jest.mock('fs/promises');

describe('JsonSessionRepository', () => {
  let repository: JsonSessionRepository;
  let mockedFs: jest.Mocked<typeof fs>;

  beforeEach(() => {
    // Limpiamos los contadores de los mocks antes de cada test
    jest.clearAllMocks(); 
    
    mockedFs = fs as jest.Mocked<typeof fs>;
    repository = new JsonSessionRepository('test-blacklist.json');

    // Configuración base de Arrange: simulamos que el archivo existe y está vacío
    mockedFs.access.mockResolvedValue(undefined);
    mockedFs.readFile.mockResolvedValue('[]');
    mockedFs.writeFile.mockResolvedValue(undefined);
  });

  it('should_save_revoked_token_in_file_when_revoke_is_called', async () => {
    // Arrange
    const jti = 'token-uuid-1';
    const expiresAt = new Date('2026-12-31T23:59:59Z');

    // Act
    await repository.revoke(jti, expiresAt);

    // Assert
    expect(mockedFs.readFile).toHaveBeenCalledTimes(1);
    
    // Verificamos que fs.writeFile se llamó con la estructura JSON correcta
    const expectedData = JSON.stringify([{ jti, expiresAt: expiresAt.toISOString() }], null, 2);
    expect(mockedFs.writeFile).toHaveBeenCalledWith(expect.any(String), expectedData, 'utf-8');
  });

  it('should_return_true_when_token_exists_in_file', async () => {
    // Arrange
    const jti = 'token-uuid-1';
    const fileContent = JSON.stringify([{ jti, expiresAt: new Date().toISOString() }]);
    
    // Simulamos que el archivo en disco contiene nuestro token
    mockedFs.readFile.mockResolvedValue(fileContent);

    // Act
    const isRevoked = await repository.isRevoked(jti);
    const isUnknownRevoked = await repository.isRevoked('unknown-token');

    // Assert
    expect(isRevoked).toBe(true);
    expect(isUnknownRevoked).toBe(false);
  });

  it('should_delete_only_expired_tokens_when_cleanup_is_executed', async () => {
    // Arrange
    const now = new Date('2026-06-06T12:00:00Z');

    const expiredToken = { jti: 'expired-token', expiresAt: '2026-06-05T12:00:00Z' }; // Ayer
    const activeToken = { jti: 'active-token', expiresAt: '2026-06-07T12:00:00Z' };   // Mañana

    // Simulamos que el archivo tiene un token vencido y uno vigente
    mockedFs.readFile.mockResolvedValue(JSON.stringify([expiredToken, activeToken]));

    // Act
    const deletedCount = await repository.deleteExpiredTokens(now);

    // Assert
    expect(deletedCount).toBe(1); // Solo debe contar 1 eliminado

    // Verificamos el estado observable guardado en disco:
    // El fs.writeFile debió llamarse SOLO con el token que todavía está activo
    const expectedSavedData = JSON.stringify([activeToken], null, 2);
    expect(mockedFs.writeFile).toHaveBeenCalledWith(expect.any(String), expectedSavedData, 'utf-8');
  });

  it('should_create_file_with_empty_array_when_file_does_not_exist', async () => {
    // Arrange
    // Simulamos que fs.access falla, lo que significa que el archivo no existe
    mockedFs.access.mockRejectedValue(new Error('ENOENT'));
    mockedFs.mkdir.mockResolvedValue(undefined);

    // Act
    await repository.isRevoked('any-token');

    // Assert
    // Verificamos que intentó crear la carpeta y el archivo base
    expect(mockedFs.mkdir).toHaveBeenCalledTimes(1);
    expect(mockedFs.writeFile).toHaveBeenCalledWith(expect.any(String), '[]', 'utf-8');
  });
});