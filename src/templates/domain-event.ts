import { IEvent } from '@nestjs/cqrs';

/**
 * Base class for all domain events.
 *
 * Naming convention: past tense + "Event" suffix
 *   CustomerCreatedEvent, OrderShippedEvent, PaymentRefundedEvent
 *
 * Event flow:
 *   entity.apply(event)
 *     -> publisher.mergeObjectContext(entity)
 *     -> repo.save(entity)
 *     -> entity.commit()
 *     -> EventBus -> @EventsHandler picks it up
 */
export abstract class DomainEvent implements IEvent {
  public readonly aggregateId: string;
  public readonly occurredOn: Date;
  public readonly eventName: string;

  protected constructor(
    eventName: string,
    aggregateId: string,
    occurredOn?: Date,
  ) {
    this.eventName = eventName;
    this.aggregateId = aggregateId;
    this.occurredOn = occurredOn ?? new Date();
  }
}
