import { Entity } from '@/shared/domain/entities/entity';
import { NotFoundError } from '@/shared/domain/errors';
import { RepositoryInterface } from '@/shared/domain/repositories/repository-contracts';
import {
  SearchParams,
  SearchResult,
  SearchableRepositoryInterface,
  SortDirection,
} from '@/shared/domain/repositories/searchable-repository';

/**
 * Simple in-memory store implementing the base `RepositoryInterface`.
 *
 * Usage: extend this class to create fast, dependency-free test doubles for
 * unit tests. No database, no Prisma, no containers needed.
 */
export abstract class InMemoryRepository<E extends Entity>
  implements RepositoryInterface<E>
{
  items: E[] = [];

  async insert(entity: E): Promise<void> {
    this.items.push(entity);
  }

  async findById(id: string): Promise<E> {
    return this._get(id);
  }

  async findAll(): Promise<E[]> {
    return this.items;
  }

  async update(entity: E): Promise<void> {
    await this._get(entity.id);
    const index = this.items.findIndex(item => item.id === entity.id);
    this.items[index] = entity;
  }

  async delete(id: string): Promise<void> {
    await this._get(id);
    const index = this.items.findIndex(item => item.id === id);
    this.items.splice(index, 1);
  }

  protected async _get(id: string): Promise<E> {
    const entity = this.items.find(item => item.id === `${id}`);
    if (!entity) {
      throw new NotFoundError(`Entity not found: ${id}`);
    }
    return entity;
  }
}

/**
 * Extends `InMemoryRepository` with full search support (filter, sort, paginate).
 *
 * Concrete subclasses MUST implement `applyFilter()`.
 */
export abstract class InMemorySearchableRepository<E extends Entity, Filter = string>
  extends InMemoryRepository<E>
  implements
    SearchableRepositoryInterface<
      E,
      Filter,
      SearchParams<Filter>,
      SearchResult<E, Filter>
    >
{
  sortableFields: string[] = [];

  async search(params: SearchParams<Filter>): Promise<SearchResult<E, Filter>> {
    const filtered = await this.applyFilter(this.items, params.filter);
    const sorted = await this.applySort(filtered, params.sort, params.sortDir);
    const paginated = await this.applyPaginate(sorted, params.page, params.perPage);

    return new SearchResult({
      items: paginated,
      total: filtered.length,
      currentPage: params.page,
      perPage: params.perPage,
      sort: params.sort,
      sortDir: params.sortDir,
      filter: params.filter,
    });
  }

  protected abstract applyFilter(items: E[], filter: Filter | null): Promise<E[]>;

  protected async applySort(
    items: E[],
    sort: string | null,
    sortDir: SortDirection | null,
  ): Promise<E[]> {
    if (!sort || !this.sortableFields.includes(sort)) {
      return items;
    }
    return [...items].sort((a, b) => {
      const aVal = (a.props as Record<string, unknown>)[sort];
      const bVal = (b.props as Record<string, unknown>)[sort];
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  protected async applyPaginate(
    items: E[],
    page: SearchParams['page'],
    perPage: SearchParams['perPage'],
  ): Promise<E[]> {
    const start = (page - 1) * perPage;
    return items.slice(start, start + perPage);
  }
}
