import fs from 'node:fs/promises';
import path from 'node:path';
import { type IAccountRepository } from '../../domain/repositories/IAccountRepository';
import { Account } from '../../domain/entities/Account';
import { Email } from '../../domain/value-objects/Email';

// Interfaz interna para tipar lo que guardamos en el JSON
interface AccountRaw {
  id: string;
  email: string;
  passwordHash: string;
}

export class JsonAccountRepository implements IAccountRepository {
  private readonly filePath: string;

  constructor(fileName: string = 'accounts.json') {
    // Guardaremos los datos en una carpeta 'data' en la raíz del proyecto
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
      id: account.id,
      email: account.email.getValue(),
      passwordHash: account.passwordHash,
    };

    const existingIndex = accounts.findIndex(a => a.id === account.id);
    if (existingIndex >= 0) {
      accounts[existingIndex] = accountRaw; // Actualiza si ya existe
    } else {
      accounts.push(accountRaw); // Inserta si es nuevo
    }

    await this.writeData(accounts);
  }

  async findByEmail(email: Email): Promise<Account | null> {
    const accounts = await this.readData();
    const targetEmail = email.getValue();
    
    const foundRaw = accounts.find(a => a.email === targetEmail);
    if (!foundRaw) {
      return null;
    }

    // Reconstruimos la entidad de dominio a partir de los datos planos
    const reconstructedEmail = Email.create(foundRaw.email);
    return new Account(foundRaw.id, reconstructedEmail, foundRaw.passwordHash);
  }
}