import { type IAccountRepository } from '../../domain/repositories/IAccountRepository';
import { Account } from '../../domain/entities/Account';
import { Email } from '../../domain/value-objects/Email';

export class InMemoryAccountRepository implements IAccountRepository {
  // Simulamos una tabla de base de datos usando un Map de TypeScript
  private readonly accounts: Map<string, Account> = new Map();

  async save(account: Account): Promise<void> {
    this.accounts.set(account.id, account);
  }

  async findByEmail(email: Email): Promise<Account | null> {
    const targetEmail = email.getValue();
    
    for (const account of this.accounts.values()) {
      if (account.email.getValue() === targetEmail) {
        return account;
      }
    }
    return null;
  }
}