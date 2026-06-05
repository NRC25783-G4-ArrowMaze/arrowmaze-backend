export class Session {
  constructor(
    public readonly jti: string,
    public readonly accountId: string,
    public readonly expiresAt: Date
  ) {}
}