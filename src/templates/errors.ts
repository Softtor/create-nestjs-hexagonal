/**
 * Domain error hierarchy.
 *
 * Rules:
 *   - Never import @nestjs/* or class-validator here
 *   - HTTP status codes live only in the infrastructure filter, NOT in these classes
 *   - Throw these errors from domain and application layers;
 *     the DomainErrorFilter maps them to HTTP responses
 *
 * Hierarchy:
 *   DomainError
 *   |- NotFoundError          404
 *   |- ConflictError          409
 *   |- BadRequestError        400
 *   |- ValidationError        400
 *   |- EntityValidationError  400
 *   |- ForbiddenError         403
 *   |- InvalidArgumentError   422
 */

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class BadRequestError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class EntityValidationError extends DomainError {
  constructor(public readonly errors: Record<string, string[]>) {
    super(
      'Entity validation failed:\n' +
        Object.entries(errors)
          .map(([field, messages]) => `  ${field}: ${messages.join(', ')}`)
          .join('\n'),
    );
  }

  toJSON(): Record<string, string[]> {
    return this.errors;
  }
}

export class ForbiddenError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class InvalidArgumentError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}
