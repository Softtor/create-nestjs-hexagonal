/**
 * Generic data builder base for test fixtures.
 *
 * Provides a composable, override-friendly API for generating test data
 * without ceremony. Uses a factory function (typically with @faker-js/faker)
 * to produce realistic default values.
 *
 * Pattern:
 *   1. Call `DefineDataBuilder.define(() => ({ ...faker fields... }))` to create a builder
 *   2. Call `.build(overrides?)` to get a single Props object
 *   3. Call `.buildMany(count, overrides?)` to get an array
 */
export class DefineDataBuilder<Props extends object> {
  private readonly defaultFactory: () => Props;

  protected constructor(factory: () => Props) {
    this.defaultFactory = factory;
  }

  static define<P extends object>(factory: () => P): DefineDataBuilder<P> {
    return new DefineDataBuilder<P>(factory);
  }

  build(overrides: Partial<Props> = {}): Props {
    return { ...this.defaultFactory(), ...overrides };
  }

  buildMany(count: number, overrides: Partial<Props> = {}): Props[] {
    return Array.from({ length: count }, () => this.build(overrides));
  }
}
