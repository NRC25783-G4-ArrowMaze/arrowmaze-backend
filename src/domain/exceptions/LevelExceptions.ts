export class LevelNotFoundError extends Error {
  constructor(message: string = 'Level not found') {
    super(message);
    this.name = 'LevelNotFoundError';
  }
}

export class LevelValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LevelValidationError';
  }
}

export class LevelAlreadyExistsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LevelAlreadyExistsError';
  }
}