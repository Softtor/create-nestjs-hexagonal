# create-nestjs-hexagonal

Scaffold a NestJS project pre-configured with Hexagonal Architecture, DDD, CQRS, and Prisma.

## Usage

```bash
npx create-nestjs-hexagonal my-app
```

No global install needed. The CLI runs directly via `npx`.

## What gets scaffolded

```
my-app/
├── package.json              # NestJS + @nestjs/cqrs + prisma + uuid deps
├── tsconfig.json             # Path aliases configured (@/* -> src/*)
├── CLAUDE.md                 # Claude Code plugin reference
├── .env.example              # Environment variable template
├── .gitignore
├── prisma/
│   └── schema.prisma         # Minimal Prisma schema to get started
└── src/
    ├── main.ts               # NestJS bootstrap with DomainErrorFilter
    ├── app.module.ts         # Root module with CqrsModule + EnvConfigModule
    ├── shared/
    │   ├── domain/
    │   │   ├── entities/
    │   │   │   ├── entity.ts            # Entity base class (AggregateRoot)
    │   │   │   └── unique-entity-id.ts  # UniqueEntityID (UUID wrapper)
    │   │   ├── value-objects/
    │   │   │   └── value-object.ts      # ValueObject base class
    │   │   ├── errors/
    │   │   │   └── index.ts             # DomainError hierarchy (NotFound, Conflict, etc.)
    │   │   ├── events/
    │   │   │   └── domain-event.ts      # DomainEvent base class
    │   │   └── repositories/
    │   │       ├── repository-contracts.ts    # RepositoryInterface<E>
    │   │       ├── searchable-repository.ts   # SearchParams, SearchResult, SearchableRepositoryInterface
    │   │       └── in-memory-searchable.ts    # InMemoryRepository + InMemorySearchableRepository
    │   ├── application/
    │   │   └── ports/
    │   │       └── ws-gateway.port.ts   # WsGatewayPort (WebSocket broadcasting)
    │   ├── infrastructure/
    │   │   ├── database/prisma/
    │   │   │   └── prisma.service.ts    # PrismaService
    │   │   ├── env-config/
    │   │   │   └── env-config.service.ts # EnvConfigService + EnvConfigModule
    │   │   └── filters/
    │   │       └── domain-error.filter.ts # DomainErrorFilter (maps errors to HTTP)
    │   └── testing/
    │       └── define-data-builder.ts   # DefineDataBuilder (test data factory)
    └── enterprise/                      # Add bounded contexts here
```

## Next steps

```bash
cd my-app
npm install
cp .env.example .env
# Edit .env with your database URL

npx prisma migrate dev --name init
npx prisma generate
npm run start:dev
```

## Claude Code plugin

Install the companion plugin to get slash commands for generating bounded contexts and use cases:

```bash
claude /plugin install github.com/softtor/nestjs-hexagonal
```

Then create your first bounded context:

```bash
/nestjs-hexagonal:create-subdomain Customer
```

Plugin repository: [github.com/softtor/nestjs-hexagonal](https://github.com/softtor/nestjs-hexagonal)

## Architecture overview

This scaffold follows **Ports & Adapters (Hexagonal Architecture)** combined with DDD and CQRS:

- `domain/` — Pure business logic. No framework dependencies. Entities, Value Objects, Domain Events, Repository interfaces.
- `application/` — Use cases, CQRS Command/Query Handlers, port interfaces. No infrastructure imports.
- `infrastructure/` — NestJS controllers, Prisma repositories, event listeners, gateways. Wires ports to adapters.

**Key rules enforced by the shared base classes:**

- `@Injectable/@Inject/@nestjs/*` are prohibited in `domain/` and `application/` layers
- Modules only export Ports, never Use Cases or Repositories
- `UniqueEntityID` is used for all entity IDs
- Domain errors (extend `DomainError`) are thrown from business logic; `DomainErrorFilter` maps them to HTTP status codes

## License

MIT
