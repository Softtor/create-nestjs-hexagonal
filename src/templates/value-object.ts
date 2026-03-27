/**
 * Base class for all Value Objects.
 *
 * Value Objects are immutable, self-validating objects identified by their
 * VALUE rather than by identity. Two VOs with the same value are equal.
 *
 * Rules:
 *   - Subclasses MUST implement `validate()` — throw on invariant violation
 *   - Never import @nestjs/* or class-validator here
 *   - Construct via the class constructor or a static factory method
 */
export abstract class ValueObject<T> {
  protected readonly _value: T;

  constructor(value: T) {
    this._value = value;
    this.validate();
  }

  protected abstract validate(): void;

  get value(): T {
    return this._value;
  }

  equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }
    if (vo.constructor !== this.constructor) {
      return false;
    }
    return JSON.stringify(vo.value) === JSON.stringify(this.value);
  }

  toString(): string {
    return String(this._value);
  }

  toJSON(): T {
    return this._value;
  }
}
