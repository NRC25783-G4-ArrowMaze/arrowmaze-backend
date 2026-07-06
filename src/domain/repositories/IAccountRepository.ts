import { Account } from '../entities/Account.js';
import { Email } from '../value-objects/Email.js';

export interface IAccountRepository {
  save(account: Account): Promise<void>;
  findByEmail(email: Email): Promise<Account | null>;
  findById(id: string): Promise<Account | null>;
}