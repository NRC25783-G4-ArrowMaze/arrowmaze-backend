import bcrypt from 'bcrypt';
import { BcryptCryptoService } from '../../../src/infrastructure/services/BcryptCryptoService.js';

jest.mock('bcrypt', () => ({
  __esModule: true,
  default: {
    hash: jest.fn(),
    compare: jest.fn()
  }
}));

describe('BcryptCryptoService (Adapter de bcrypt → ICryptoService)', () => {
  let service: BcryptCryptoService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BcryptCryptoService();
  });

  it('should_delegate_hash_to_bcrypt_with_salt_rounds', async () => {
    // Arrange
    (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashed');

    // Act
    const result = await service.hash('secret123');

    // Assert
    expect(bcrypt.hash).toHaveBeenCalledWith('secret123', 10);
    expect(result).toBe('$2b$10$hashed');
  });

  it('should_delegate_compare_to_bcrypt_and_return_result', async () => {
    // Arrange
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    // Act
    const result = await service.compare('secret123', '$2b$10$hashed');

    // Assert
    expect(bcrypt.compare).toHaveBeenCalledWith('secret123', '$2b$10$hashed');
    expect(result).toBe(true);
  });

  it('should_return_false_when_bcrypt_compare_fails', async () => {
    // Arrange
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    // Act
    const result = await service.compare('wrong-password', '$2b$10$hashed');

    // Assert
    expect(result).toBe(false);
  });
});
