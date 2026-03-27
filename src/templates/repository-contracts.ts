import { Entity } from '@/shared/domain/entities/entity';

/**
 * Core repository interface — PURE persistence contract.
 *
 * Rules:
 *   - No event dispatch, no knowledge of domain events
 *   - No business logic — only CRUD operations
 *   - Implementations live in the infrastructure layer (Prisma, TypeORM, etc.)
 *   - Application layer depends on THIS interface, never on concrete implementations
 *   - Register as a port token in the module:
 *       { provide: CUSTOMER_REPOSITORY, useClass: PrismaCustomerRepository }
 *
 * @template E - The aggregate root / entity type this repository manages
 */
export interface RepositoryInterface<E extends Entity> {
  insert(entity: E): Promise<void>;
  findById(id: string): Promise<E>;
  findAll(): Promise<E[]>;
  update(entity: E): Promise<void>;
  delete(id: string): Promise<void>;
}
