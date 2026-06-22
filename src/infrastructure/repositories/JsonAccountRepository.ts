import fs from 'node:fs/promises';
import path from 'node:path';
import { type IAccountRepository } from '../../domain/repositories/IAccountRepository';
import { Account } from '../../domain/entities/Account';
import { Email } from '../../domain/value-objects/Email';

interface AccountRaw {
  id: string;
  email: string;
  passwordHash: string;
  role: string; // Guardado en texto plano dentro del JSON
}

export class JsonAccountRepository implements IAccountRepository {
  private readonly filePath: string;

  constructor(fileName: string = 'accounts.json') {
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

  private async readData(): Promise<AccountRaw[]> {
    await this.ensureFileExists();
    const data = await fs.readFile(this.filePath, 'utf-8');
    return JSON.parse(data) as AccountRaw[];
  }

  private async writeData(data: AccountRaw[]): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  async save(account: Account): Promise<void> {
    const accounts = await this.readData();
    
    const accountRaw: AccountRaw = {
      id: account.getId(),
      email: account.getEmail().getValue(),
      passwordHash: account.getPasswordHash(),
      role: account.getRole(),
    };

    const existingIndex = accounts.findIndex(a => a.id === account.getId());
    if (existingIndex >= 0) {
      accounts[existingIndex] = accountRaw;
    } else {
      accounts.push(accountRaw);
    }

    await this.writeData(accounts);
  }

  async findByEmail(email: Email): Promise<Account | null> {
    const accounts = await this.readData();
    const targetEmail = email.getValue();
    
    const foundRaw = accounts.find(a => a.email === targetEmail);
    if (!foundRaw) return null;

    const reconstructedEmail = Email.create(foundRaw.email);
    // Forzamos el casteo seguro del string plano al tipo estricto UserRole
    const assignedRole = (foundRaw.role === 'ADMIN' ? 'ADMIN' : 'USER');

    return new Account(foundRaw.id, reconstructedEmail, foundRaw.passwordHash, assignedRole);
  }

  async findById(id: string): Promise<Account | null> {
    const accounts = await this.readData();
    const rawAccount = accounts.find((acc: any) => acc.id === id);
    const assignedRole = (rawAccount?.role === 'ADMIN' ? 'ADMIN' : 'USER');

    if (!rawAccount) return null;
    return new Account(rawAccount.id, Email.create(rawAccount.email), rawAccount.passwordHash, assignedRole);
  }
}