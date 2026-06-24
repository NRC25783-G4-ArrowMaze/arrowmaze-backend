import { Account } from '../entities/Account';
import { Email } from '../value-objects/Email';

export interface IAccountRepository {
  save(account: Account): Promise<void>;
  findByEmail(email: Email): Promise<Account | null>;
  findById(id: string): Promise<Account | null>;
}