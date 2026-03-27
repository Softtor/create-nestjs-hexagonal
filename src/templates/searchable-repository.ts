import { Entity } from '@/shared/domain/entities/entity';
import { RepositoryInterface } from '@/shared/domain/repositories/repository-contracts';

export type SortDirection = 'asc' | 'desc';

export type SearchProps<Filter = string> = {
  page?: number;
  perPage?: number;
  sort?: string | null;
  sortDir?: SortDirection | null;
  filter?: Filter | null;
};

export type SearchResultProps<E extends Entity, Filter> = {
  items: E[];
  total: number;
  currentPage: number;
  perPage: number;
  sort: string | null;
  sortDir: string | null;
  filter: Filter | null;
};

/**
 * Encapsulates pagination, sorting, and filtering parameters for a search query.
 * Automatically coerces and validates all inputs on construction.
 *
 * Defaults: page=1, perPage=15, sort=null, sortDir=null, filter=null
 */
export class SearchParams<Filter = string> {
  protected _page: number;
  protected _perPage = 15;
  protected _sort: string | null;
  protected _sortDir: SortDirection | null;
  protected _filter: Filter | null;

  constructor(props: SearchProps<Filter> = {}) {
    this.page = props.page;
    this.perPage = props.perPage;
    this.sort = props.sort;
    this.sortDir = props.sortDir;
    this.filter = props.filter;
  }

  get page(): number {
    return this._page;
  }

  private set page(value: number) {
    let _page = +value;
    if (Number.isNaN(_page) || _page <= 0 || parseInt(String(_page)) !== _page) {
      _page = 1;
    }
    this._page = _page;
  }

  get perPage(): number {
    return this._perPage;
  }

  private set perPage(value: number) {
    let _perPage = (value as unknown) === true ? this._perPage : +value;
    if (
      Number.isNaN(_perPage) ||
      _perPage <= 0 ||
      parseInt(String(_perPage)) !== _perPage
    ) {
      _perPage = this._perPage;
    }
    this._perPage = _perPage;
  }

  get sort(): string | null {
    return this._sort;
  }

  private set sort(value: string | null) {
    this._sort =
      value === null || value === undefined || value === '' ? null : `${value}`;
  }

  get sortDir(): SortDirection | null {
    return this._sortDir;
  }

  private set sortDir(value: string | null) {
    if (!this.sort) {
      this._sortDir = null;
      return;
    }
    const dir = `${value}`.toLowerCase();
    this._sortDir = dir !== 'asc' && dir !== 'desc' ? 'desc' : dir;
  }

  get filter(): Filter | null {
    return this._filter;
  }

  private set filter(value: Filter | null) {
    this._filter =
      value === null ||
      value === undefined ||
      (typeof value === 'string' && value === '')
        ? null
        : value;
  }
}

/**
 * Wraps a paginated list of entities with metadata.
 * `lastPage` is computed automatically from `total` and `perPage`.
 */
export class SearchResult<E extends Entity, Filter = string> {
  readonly items: E[];
  readonly total: number;
  readonly currentPage: number;
  readonly perPage: number;
  readonly lastPage: number;
  readonly sort: string | null;
  readonly sortDir: string | null;
  readonly filter: Filter | null;

  constructor(props: SearchResultProps<E, Filter>) {
    this.items = props.items;
    this.total = props.total;
    this.currentPage = props.currentPage;
    this.perPage = props.perPage;
    this.lastPage = Math.max(1, Math.ceil(this.total / this.perPage));
    this.sort = props.sort ?? null;
    this.sortDir = props.sortDir ?? null;
    this.filter = props.filter ?? null;
  }

  toJSON(forceEntity = false) {
    return {
      items: forceEntity ? this.items.map(item => item.toJSON()) : this.items,
      total: this.total,
      currentPage: this.currentPage,
      perPage: this.perPage,
      lastPage: this.lastPage,
      sort: this.sort,
      sortDir: this.sortDir,
      filter: this.filter,
    };
  }
}

/**
 * Extends the base repository contract with paginated search support.
 *
 * @template E            - Entity type
 * @template Filter       - Shape of the filter object (default: string)
 * @template SearchInput  - Input type (default: SearchParams<Filter>)
 * @template SearchOutput - Output type (default: SearchResult<E, Filter>)
 */
export interface SearchableRepositoryInterface<
  E extends Entity,
  Filter = string,
  SearchInput = SearchParams<Filter>,
  SearchOutput = SearchResult<E, Filter>,
> extends RepositoryInterface<E> {
  sortableFields: string[];
  search(props: SearchInput): Promise<SearchOutput>;
}
