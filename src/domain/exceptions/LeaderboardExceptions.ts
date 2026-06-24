export class LeaderboardValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LeaderboardValidationError';
  }
}