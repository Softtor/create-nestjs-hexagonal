import { v4 as uuid } from 'uuid';

/**
 * Unique identifier for domain entities.
 *
 * Wraps a UUID (primary key for domain identity) and optionally a numeric
 * surrogate ID (e.g., auto-increment database column).
 *
 * Rules:
 *   - Identity is always compared by UUID, never by numeric surrogate
 *   - A new UUID is generated automatically when no value is supplied
 *   - Use `UniqueEntityID` everywhere — NEVER create custom ID value objects
 */
export class UniqueEntityID {
  public readonly value: { uuid: string; id?: number };

  constructor(value?: string | { uuid: string; id?: number }) {
    if (typeof value === 'string') {
      this.value = { uuid: value };
    } else if (value) {
      this.value = value;
    } else {
      this.value = { uuid: uuid() };
    }
  }

  static create(id?: string): UniqueEntityID {
    return new UniqueEntityID(id);
  }

  get id(): string {
    return this.value.uuid;
  }

  get numericId(): number | undefined {
    return this.value.id;
  }

  equals(other: UniqueEntityID): boolean {
    return this.value.uuid === other.value.uuid;
  }

  toString(): string {
    return this.value.uuid;
  }

  toValue(): string {
    return this.value.uuid;
  }
}
