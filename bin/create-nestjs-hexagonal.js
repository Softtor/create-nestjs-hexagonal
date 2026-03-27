#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const templatesDir = path.join(__dirname, '..', 'src', 'templates');

// ---------------------------------------------------------------------------
// CLI Router
// ---------------------------------------------------------------------------

const command = process.argv[2];

if (!command) {
  printUsage();
  process.exit(1);
}

if (command === 'subdomain' || command === 'sd') {
  createSubdomain();
} else if (command === '--help' || command === '-h') {
  printUsage();
} else {
  createProject(command);
}

// ---------------------------------------------------------------------------
// Command: create project
// ---------------------------------------------------------------------------

function createProject(projectName) {
  if (!/^[a-z0-9-_]+$/i.test(projectName)) {
    console.error('Error: Project name may only contain letters, numbers, hyphens, and underscores.');
    process.exit(1);
  }

  const projectDir = path.resolve(process.cwd(), projectName);

  if (fs.existsSync(projectDir)) {
    console.error(`Error: Directory "${projectName}" already exists.`);
    process.exit(1);
  }

  const dirs = [
    'src/shared/domain/entities',
    'src/shared/domain/value-objects',
    'src/shared/domain/errors',
    'src/shared/domain/repositories',
    'src/shared/domain/events',
    'src/shared/application/ports',
    'src/shared/infrastructure/database/prisma',
    'src/shared/infrastructure/env-config',
    'src/shared/infrastructure/filters',
    'src/shared/testing',
    'src/enterprise',
    'prisma',
  ];

  console.log(`\nCreating NestJS hexagonal project in ./${projectName}...\n`);

  fs.mkdirSync(projectDir, { recursive: true });
  dirs.forEach(d => fs.mkdirSync(path.join(projectDir, d), { recursive: true }));

  // Copy shared base classes
  copyTemplate('entity.ts', path.join(projectDir, 'src/shared/domain/entities/entity.ts'));
  copyTemplate('value-object.ts', path.join(projectDir, 'src/shared/domain/value-objects/value-object.ts'));
  copyTemplate('unique-entity-id.ts', path.join(projectDir, 'src/shared/domain/entities/unique-entity-id.ts'));
  copyTemplate('domain-event.ts', path.join(projectDir, 'src/shared/domain/events/domain-event.ts'));
  copyTemplate('errors.ts', path.join(projectDir, 'src/shared/domain/errors/index.ts'));
  copyTemplate('repository-contracts.ts', path.join(projectDir, 'src/shared/domain/repositories/repository-contracts.ts'));
  copyTemplate('searchable-repository.ts', path.join(projectDir, 'src/shared/domain/repositories/searchable-repository.ts'));
  copyTemplate('in-memory-searchable.ts', path.join(projectDir, 'src/shared/domain/repositories/in-memory-searchable.ts'));
  copyTemplate('domain-error-filter.ts', path.join(projectDir, 'src/shared/infrastructure/filters/domain-error.filter.ts'));
  copyTemplate('env-config.service.ts', path.join(projectDir, 'src/shared/infrastructure/env-config/env-config.service.ts'));
  copyTemplate('ws-gateway-port.ts', path.join(projectDir, 'src/shared/application/ports/ws-gateway.port.ts'));
  copyTemplate('define-data-builder.ts', path.join(projectDir, 'src/shared/testing/define-data-builder.ts'));

  // Generated project files
  writeTemplate('main.ts', path.join(projectDir, 'src/main.ts'));
  writeTemplate('app.module.ts', path.join(projectDir, 'src/app.module.ts'));
  writeTemplate('prisma.service.ts', path.join(projectDir, 'src/shared/infrastructure/database/prisma/prisma.service.ts'));
  writeTemplate('schema.prisma', path.join(projectDir, 'prisma/schema.prisma'));
  writeTemplate('tsconfig.json', path.join(projectDir, 'tsconfig.json'));
  writeTemplate('.env.example', path.join(projectDir, '.env.example'));
  writeTemplate('.gitignore', path.join(projectDir, '.gitignore'));

  // Files with project name substitution
  writeFile(
    path.join(projectDir, 'package.json'),
    readTemplate('package.json.template').replace(/\{\{PROJECT_NAME\}\}/g, projectName),
  );

  // CLAUDE.md with plugin reference
  writeFile(path.join(projectDir, 'CLAUDE.md'), generateClaudeMd(projectName));

  // Initialize git
  try {
    execFileSync('git', ['init'], { cwd: projectDir, stdio: 'ignore' });
    execFileSync('git', ['add', '-A'], { cwd: projectDir, stdio: 'ignore' });
    execFileSync('git', ['commit', '-m', 'feat: scaffold NestJS hexagonal project'], { cwd: projectDir, stdio: 'ignore' });
    console.log('  Git initialized with initial commit.\n');
  } catch {
    // git not available — skip silently
  }

  // Auto-install Claude Code plugin
  const pluginInstalled = installPlugin(projectDir);

  // Success message
  console.log(`  Project created at ./${projectName}\n`);
  console.log('  Next steps:\n');
  console.log(`    cd ${projectName}`);
  console.log('    npm install');
  console.log('    npx prisma generate\n');

  if (!pluginInstalled) {
    console.log('  Install the Claude Code plugin:\n');
    console.log('    claude /plugin install github.com/softtor/nestjs-hexagonal\n');
  }

  console.log('  Create your first bounded context:\n');
  console.log('    /nestjs-hexagonal:create-subdomain <EntityName>\n');
  console.log('  Or use the CLI:\n');
  console.log('    npx create-nestjs-hexagonal subdomain <EntityName>\n');
}

// ---------------------------------------------------------------------------
// Command: create subdomain
// ---------------------------------------------------------------------------

function createSubdomain() {
  const entityName = process.argv[3];

  if (!entityName) {
    console.error('Usage: npx create-nestjs-hexagonal subdomain <EntityName>');
    console.error('');
    console.error('Examples:');
    console.error('  npx create-nestjs-hexagonal subdomain Order');
    console.error('  npx create-nestjs-hexagonal subdomain Invoice');
    console.error('  npx create-nestjs-hexagonal sd Payment');
    process.exit(1);
  }

  const projectDir = findProjectRoot();
  if (!projectDir) {
    console.error('Error: Not inside a NestJS hexagonal project.');
    console.error('Run this command from the project root (where package.json is).');
    process.exit(1);
  }

  const kebab = toKebab(entityName);
  const pascal = toPascal(entityName);
  const upper = toUpperSnake(entityName);

  const enterpriseDir = path.join(projectDir, 'src', 'enterprise');
  if (!fs.existsSync(enterpriseDir)) {
    fs.mkdirSync(enterpriseDir, { recursive: true });
  }

  const bcDir = path.join(enterpriseDir, kebab);

  if (fs.existsSync(bcDir)) {
    console.error(`Error: Bounded context "${kebab}" already exists at src/enterprise/${kebab}/`);
    process.exit(1);
  }

  console.log(`\nCreating bounded context "${pascal}" at src/enterprise/${kebab}/...\n`);

  const dirs = [
    'domain/entities/__tests__',
    'domain/value-objects/__tests__',
    'domain/events',
    'domain/errors',
    'domain/repositories',
    'domain/testing/helpers',
    'application/dtos',
    'application/commands/__tests__',
    'application/queries',
    'application/ports',
    'infrastructure/database/prisma/repositories',
    'infrastructure/database/in-memory/repositories',
    'infrastructure/controllers/dtos',
    'infrastructure/adapters',
    'infrastructure/listeners',
  ];

  dirs.forEach(d => fs.mkdirSync(path.join(bcDir, d), { recursive: true }));

  // --- Domain: Entity ---
  writeFile(path.join(bcDir, `domain/entities/${kebab}.entity.ts`), [
    `import { Entity } from '@/shared/domain/entities/entity';`,
    ``,
    `import { ${pascal}CreatedEvent } from '../events/${kebab}-created.event';`,
    ``,
    `export interface ${pascal}Props {`,
    `  organizationId: string;`,
    `  name: string;`,
    `  // TODO: add your props here`,
    `  createdAt: Date;`,
    `  updatedAt?: Date;`,
    `}`,
    ``,
    `export class ${pascal}Entity extends Entity<${pascal}Props> {`,
    `  private constructor(props: ${pascal}Props, id?: string) {`,
    `    super(props, id);`,
    `  }`,
    ``,
    `  static create(`,
    `    props: Omit<${pascal}Props, 'createdAt'>,`,
    `    id?: string,`,
    `  ): ${pascal}Entity {`,
    `    const entity = new ${pascal}Entity({ ...props, createdAt: new Date() }, id);`,
    `    entity.apply(new ${pascal}CreatedEvent(entity.id, props.organizationId));`,
    `    return entity;`,
    `  }`,
    ``,
    `  static restore(props: ${pascal}Props, id: string): ${pascal}Entity {`,
    `    return new ${pascal}Entity(props, id);`,
    `  }`,
    ``,
    `  get organizationId(): string { return this.props.organizationId; }`,
    `  get name(): string { return this.props.name; }`,
    `  get createdAt(): Date { return this.props.createdAt; }`,
    `  get updatedAt(): Date | undefined { return this.props.updatedAt; }`,
    `}`,
    ``,
  ].join('\n'));

  // --- Domain: Event ---
  writeFile(path.join(bcDir, `domain/events/${kebab}-created.event.ts`), [
    `import { IEvent } from '@nestjs/cqrs';`,
    ``,
    `export class ${pascal}CreatedEvent implements IEvent {`,
    `  constructor(`,
    `    public readonly aggregateId: string,`,
    `    public readonly organizationId: string,`,
    `    public readonly occurredOn: Date = new Date(),`,
    `  ) {}`,
    `}`,
    ``,
  ].join('\n'));

  // --- Domain: Repository ---
  writeFile(path.join(bcDir, `domain/repositories/${kebab}.repository.ts`), [
    `import type { ${pascal}Entity } from '../entities/${kebab}.entity';`,
    ``,
    `export const ${upper}_REPOSITORY_TOKEN = Symbol('${pascal}Repository');`,
    ``,
    `export namespace ${pascal}Repository {`,
    `  export interface Repository {`,
    `    findById(id: string): Promise<${pascal}Entity | null>;`,
    `    findByOrganization(organizationId: string): Promise<${pascal}Entity[]>;`,
    `    save(entity: ${pascal}Entity): Promise<void>;`,
    `    delete(id: string, organizationId: string): Promise<void>;`,
    `  }`,
    `}`,
    ``,
  ].join('\n'));

  // --- Domain: Error ---
  writeFile(path.join(bcDir, `domain/errors/${kebab}-not-found.error.ts`), [
    `import { NotFoundError } from '@/shared/domain/errors';`,
    ``,
    `export class ${pascal}NotFoundError extends NotFoundError {`,
    `  constructor(public readonly ${toCamel(entityName)}Id: string) {`,
    `    super(\`${pascal} \${${toCamel(entityName)}Id} not found\`);`,
    `  }`,
    `}`,
    ``,
  ].join('\n'));

  // --- Domain: Data Builder ---
  writeFile(path.join(bcDir, `domain/testing/helpers/${kebab}.data-builder.ts`), [
    `import type { ${pascal}Props } from '../../entities/${kebab}.entity';`,
    ``,
    `export function ${pascal}DataBuilder(`,
    `  overrides?: Partial<${pascal}Props>,`,
    `): ${pascal}Props {`,
    `  return {`,
    `    organizationId: 'org-' + Math.random().toString(36).slice(2, 8),`,
    `    name: 'Test ${pascal}',`,
    `    createdAt: new Date(),`,
    `    ...overrides,`,
    `  };`,
    `}`,
    ``,
  ].join('\n'));

  // --- Domain: Entity Test ---
  writeFile(path.join(bcDir, `domain/entities/__tests__/${kebab}.entity.spec.ts`), [
    `import { describe, it, expect } from 'vitest';`,
    ``,
    `import { ${pascal}Entity } from '../${kebab}.entity';`,
    `import { ${pascal}CreatedEvent } from '../../events/${kebab}-created.event';`,
    `import { ${pascal}DataBuilder } from '../../testing/helpers/${kebab}.data-builder';`,
    ``,
    `describe('${pascal}Entity', () => {`,
    `  it('should create with event', () => {`,
    `    const entity = ${pascal}Entity.create({`,
    `      organizationId: 'org-1',`,
    `      name: 'Test',`,
    `    });`,
    ``,
    `    expect(entity.id).toBeDefined();`,
    `    expect(entity.name).toBe('Test');`,
    `    expect(entity.getUncommittedEvents()).toHaveLength(1);`,
    `    expect(entity.getUncommittedEvents()[0]).toBeInstanceOf(${pascal}CreatedEvent);`,
    `  });`,
    ``,
    `  it('should restore without events', () => {`,
    `    const props = ${pascal}DataBuilder({ organizationId: 'org-1' });`,
    `    const entity = ${pascal}Entity.restore(props, 'id-1');`,
    ``,
    `    expect(entity.id).toBe('id-1');`,
    `    expect(entity.getUncommittedEvents()).toHaveLength(0);`,
    `  });`,
    `});`,
    ``,
  ].join('\n'));

  // --- Application: Command ---
  writeFile(path.join(bcDir, `application/commands/create-${kebab}.command.ts`), [
    `import { Command } from '@nestjs/cqrs';`,
    ``,
    `export class Create${pascal}Command extends Command<{ id: string }> {`,
    `  constructor(`,
    `    public readonly organizationId: string,`,
    `    public readonly name: string,`,
    `  ) {`,
    `    super();`,
    `  }`,
    `}`,
    ``,
  ].join('\n'));

  // --- Application: Handler ---
  writeFile(path.join(bcDir, `application/commands/create-${kebab}.handler.ts`), [
    `import { Inject } from '@nestjs/common';`,
    `import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';`,
    ``,
    `import { ${pascal}Entity } from '../../domain/entities/${kebab}.entity';`,
    `import { ${upper}_REPOSITORY_TOKEN } from '../../domain/repositories/${kebab}.repository';`,
    `import type { ${pascal}Repository } from '../../domain/repositories/${kebab}.repository';`,
    `import { Create${pascal}Command } from './create-${kebab}.command';`,
    ``,
    `@CommandHandler(Create${pascal}Command)`,
    `export class Create${pascal}Handler implements ICommandHandler<Create${pascal}Command, { id: string }> {`,
    `  constructor(`,
    `    @Inject(${upper}_REPOSITORY_TOKEN)`,
    `    private readonly repository: ${pascal}Repository.Repository,`,
    `    private readonly publisher: EventPublisher,`,
    `  ) {}`,
    ``,
    `  async execute(command: Create${pascal}Command): Promise<{ id: string }> {`,
    `    const entity = ${pascal}Entity.create({`,
    `      organizationId: command.organizationId,`,
    `      name: command.name,`,
    `    });`,
    ``,
    `    await this.repository.save(entity);`,
    ``,
    `    // EventPublisher in HANDLER only`,
    `    const merged = this.publisher.mergeObjectContext(entity);`,
    `    merged.commit();`,
    ``,
    `    return { id: entity.id };`,
    `  }`,
    `}`,
    ``,
  ].join('\n'));

  // --- Application: DTO ---
  writeFile(path.join(bcDir, `application/dtos/create-${kebab}.dto.ts`), [
    `export namespace Create${pascal}Dto {`,
    `  export interface Input {`,
    `    organizationId: string;`,
    `    name: string;`,
    `  }`,
    ``,
    `  export interface Output {`,
    `    id: string;`,
    `  }`,
    `}`,
    ``,
  ].join('\n'));

  // --- Infrastructure: Module ---
  writeFile(path.join(bcDir, `infrastructure/${kebab}.module.ts`), [
    `import { Module } from '@nestjs/common';`,
    `import { CqrsModule } from '@nestjs/cqrs';`,
    ``,
    `import { ${upper}_REPOSITORY_TOKEN } from '../domain/repositories/${kebab}.repository';`,
    `import { Create${pascal}Handler } from '../application/commands/create-${kebab}.handler';`,
    ``,
    `const CommandHandlers = [Create${pascal}Handler];`,
    ``,
    `@Module({`,
    `  imports: [CqrsModule],`,
    `  providers: [`,
    `    ...CommandHandlers,`,
    `    // TODO: add repository provider`,
    `    // { provide: ${upper}_REPOSITORY_TOKEN, useClass: Prisma${pascal}Repository },`,
    `  ],`,
    `  exports: [${upper}_REPOSITORY_TOKEN],`,
    `})`,
    `export class ${pascal}Module {}`,
    ``,
  ].join('\n'));

  const fileCount = countFiles(bcDir);
  console.log(`  Bounded context "${pascal}" created (${fileCount} files)\n`);
  console.log(`  src/enterprise/${kebab}/`);
  console.log(`    domain/     entity, event, error, repository, data builder, test`);
  console.log(`    application/ command, handler, dto`);
  console.log(`    infrastructure/ module (add repo, controller, listeners)\n`);
  console.log('  Next: add props, VOs, Prisma repo, controller. Or let Claude do it:\n');
  console.log(`    /nestjs-hexagonal:create-subdomain ${pascal}\n`);
}

// ---------------------------------------------------------------------------
// Plugin auto-install
// ---------------------------------------------------------------------------

function installPlugin(projectDir) {
  try {
    const claudePath = execFileSync('which', ['claude'], { encoding: 'utf8' }).trim();
    if (claudePath) {
      console.log('  Installing nestjs-hexagonal Claude Code plugin...\n');
      execFileSync('claude', ['plugin', 'install', 'github.com/softtor/nestjs-hexagonal'], {
        cwd: projectDir,
        stdio: 'inherit',
        timeout: 30000,
      });
      console.log('\n  Plugin installed.\n');
      return true;
    }
  } catch {
    // Claude CLI not available
  }
  return false;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readTemplate(name) {
  return fs.readFileSync(path.join(templatesDir, name), 'utf8');
}

function copyTemplate(templateFile, destPath) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(path.join(templatesDir, templateFile), destPath);
}

function writeTemplate(templateFile, destPath) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, readTemplate(templateFile));
}

function writeFile(destPath, content) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, content);
}

function toKebab(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/[\s_]+/g, '-').toLowerCase();
}

function toPascal(str) {
  return str.replace(/(^|[-_\s])(\w)/g, (_, _s, c) => c.toUpperCase()).replace(/[-_\s]/g, '');
}

function toCamel(str) {
  const p = toPascal(str);
  return p.charAt(0).toLowerCase() + p.slice(1);
}

function toUpperSnake(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').replace(/[-\s]+/g, '_').toUpperCase();
}

function findProjectRoot() {
  let dir = process.cwd();
  while (dir !== path.dirname(dir)) {
    const pkgPath = path.join(dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (deps['@nestjs/core'] || fs.existsSync(path.join(dir, 'src', 'enterprise'))) {
          return dir;
        }
      } catch { /* ignore */ }
    }
    dir = path.dirname(dir);
  }
  return null;
}

function countFiles(dir) {
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    count += entry.isFile() ? 1 : countFiles(path.join(dir, entry.name));
  }
  return count;
}

function generateClaudeMd(projectName) {
  return `# ${projectName}

## NestJS Hexagonal Architecture (nestjs-hexagonal plugin)

### Architecture Rules

1. Entity extends \`AggregateRoot\` from \`@nestjs/cqrs\`
2. Repository is PURE persistence — no event dispatch
3. EventPublisher in Handler ONLY, NEVER in UseCase
4. Module exports ONLY Port tokens
5. class-validator ONLY in presentation request DTOs
6. Write returns void or \`{ id: string }\`

### Skill Mapping

| Task | Skill / Agent |
|------|--------------|
| Domain modeling | \`nestjs-hexagonal:domain-agent\` (Opus) |
| Use cases / handlers | \`nestjs-hexagonal:application-agent\` (Sonnet) |
| Repos / module wiring | \`nestjs-hexagonal:infrastructure-agent\` (Sonnet) |
| Controllers / DTOs | \`nestjs-hexagonal:presentation-agent\` (Sonnet) |
| WebSocket broadcasting | \`nestjs-hexagonal:broadcasting-agent\` (Sonnet) |
| Event listeners | \`nestjs-hexagonal:listener-agent\` (Sonnet) |
| Architecture review | \`nestjs-hexagonal:architecture-reviewer\` (Opus) |
| Event debugging | \`nestjs-hexagonal:event-debug-agent\` (Opus) |
| Full BC scaffold | \`nestjs-hexagonal:create-subdomain\` |
`;
}

function printUsage() {
  console.log(`
  Usage:

    npx create-nestjs-hexagonal <project-name>     Create new NestJS hexagonal project
    npx create-nestjs-hexagonal subdomain <Entity>  Create bounded context in existing project
    npx create-nestjs-hexagonal sd <Entity>          Alias for subdomain

  Examples:

    npx create-nestjs-hexagonal my-app
    npx create-nestjs-hexagonal subdomain Order
    npx create-nestjs-hexagonal sd Invoice
    npx create-nestjs-hexagonal sd PaymentMethod
`);
}
