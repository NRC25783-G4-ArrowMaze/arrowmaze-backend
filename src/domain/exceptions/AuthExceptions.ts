export class ValidationError extends Error {
  constructor(message: string) {
    super(`ValidationError: ${message}`);
    this.name = 'ValidationError';
  }
}

export class RegistrationError extends Error {
  constructor(message: string) {
    super(`RegistrationError: ${message}`);
    this.name = 'RegistrationError';
  }
}

export class AuthError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(`AuthError: ${message}`, options); // Pasamos las opciones al Error nativo
    this.name = 'AuthError';
  }
}