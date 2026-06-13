import { Email } from '../value-objects/Email';

export class Account {
  constructor(
    public readonly id: string,
    public readonly email: Email,
    public readonly passwordHash: string
  ) {}

}