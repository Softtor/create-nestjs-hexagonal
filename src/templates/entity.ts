import { AggregateRoot } from '@nestjs/cqrs';
import { UniqueEntityID } from '@/shared/domain/entities/unique-entity-id';

/**
 * Base class for all domain entities.
 *
 * Extends AggregateRoot from @nestjs/cqrs so that domain events dispatched
 * via `this.apply(event)` flow through the NestJS EventBus automatically once
 * the entity is committed.
 *
 * Event lifecycle:
 *   1. `entity.apply(new SomethingHappenedEvent(...))`  — records the event
 *   2. `publisher.mergeObjectContext(entity)`           — wires EventBus
 *   3. `await repo.save(entity)`                        — persists to DB
 *   4. `entity.commit()`                                — publishes all pending events
 *   5. `@EventsHandler(SomethingHappenedEvent)` picks them up
 *
 * The repository is PURE persistence — it never knows about events.
 */
export abstract class Entity<Props extends object = object> extends AggregateRoot {
  public readonly _id: UniqueEntityID;
  public readonly props: Props;

  protected constructor(props: Props, id?: string | { uuid: string; id?: number }) {
    super();
    this.props = props;
    this._id = new UniqueEntityID(id);
  }

  get id(): string {
    return this._id.toString();
  }

  get numericId(): number | undefined {
    return this._id.numericId;
  }

  protected touch(): void {
    if ('updatedAt' in this.props) {
      (this.props as Record<string, unknown>).updatedAt = new Date();
    }
  }

  toJSON(): Required<{ id: string } & Props> {
    return {
      id: this._id.toString(),
      ...this.props,
    } as Required<{ id: string } & Props>;
  }
}
