import { Email } from '../../../src/domain/value-objects/Email.js';
import { ValidationError } from '../../../src/domain/exceptions/AuthExceptions.js';

describe('Email', () => {
  it('should_normalize_to_lowercase_and_trim_when_email_has_uppercase_and_spaces', () => {
    // Arrange
    const rawEmail = '  TEST@Example.com ';

    // Act
    const email = Email.create(rawEmail);

    // Assert
    expect(email.getValue()).toBe('test@example.com');
  });

  it('should_produce_equal_values_when_same_email_differs_only_in_case', () => {
    // Arrange & Act
    const emailUpper = Email.create('Player.One@ArrowMaze.com');
    const emailLower = Email.create('player.one@arrowmaze.com');

    // Assert
    expect(emailUpper.getValue()).toBe(emailLower.getValue());
  });

  it('should_return_lowercase_local_part_as_public_alias_when_email_is_normalized', () => {
    // Arrange
    const email = Email.create('Player.One@ArrowMaze.com');

    // Act
    const alias = email.getPublicAlias();

    // Assert
    expect(alias).toBe('player.one');
  });

  it('should_throw_validation_error_when_email_format_is_invalid', () => {
    // Arrange
    const invalidEmail = 'not-an-email';

    // Act & Assert
    expect(() => Email.create(invalidEmail)).toThrow(ValidationError);
  });
});
