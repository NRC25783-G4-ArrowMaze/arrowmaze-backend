import { type Email } from '../value-objects/Email';

export type UserRole = 'USER' | 'ADMIN';

export class Account {
  private readonly id: string;
  private readonly email: Email;
  private readonly passwordHash: string;
  private readonly role: UserRole;

  constructor(id: string, email: Email, passwordHash: string, role: UserRole = 'USER') {
    this.id = id;
    this.email = email;
    this.passwordHash = passwordHash;
    this.role = role;

    Object.defineProperty(this, 'id', { writable: false, configurable: false });
    Object.defineProperty(this, 'email', { writable: false, configurable: false });
    Object.defineProperty(this, 'passwordHash', { writable: false, configurable: false });
    Object.defineProperty(this, 'role', { writable: false, configurable: false });
  }

  getId(): string {
    return this.id;
  }

  getEmail(): Email {
    return this.email;
  }

  getPasswordHash(): string {
    return this.passwordHash;
  }

  getRole(): UserRole {
    return this.role;
  }
}