export class ProgressValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProgressValidationError';
  }
}

export class LevelRegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LevelRegistryError';
  }
}

export class ProgressNotFoundError extends Error {
  constructor(message: string = 'Progress not found') {
    super(message);
    this.name = 'ProgressNotFoundError';
  }
}