#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const projectName = process.argv[2];

if (!projectName) {
  console.error('Usage: npx create-nestjs-hexagonal <project-name>');
  process.exit(1);
}

if (!/^[a-z0-9-_]+$/i.test(projectName)) {
  console.error('Error: Project name may only contain letters, numbers, hyphens, and underscores.');
  process.exit(1);
}

const projectDir = path.resolve(process.cwd(), projectName);

if (fs.existsSync(projectDir)) {
  console.error(`Error: Directory "${projectName}" already exists.`);
  process.exit(1);
}

const templatesDir = path.join(__dirname, '..', 'src', 'templates');

// ---------------------------------------------------------------------------
// 1. Create directory structure
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// 2. Helper: copy a template file to a destination
// ---------------------------------------------------------------------------

function copyTemplate(templateFile, destPath) {
  const src = path.join(templatesDir, templateFile);
  const dest = path.join(projectDir, destPath);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

// ---------------------------------------------------------------------------
// 3. Copy shared base classes
// ---------------------------------------------------------------------------

copyTemplate('entity.ts', 'src/shared/domain/entities/entity.ts');
copyTemplate('value-object.ts', 'src/shared/domain/value-objects/value-object.ts');
copyTemplate('unique-entity-id.ts', 'src/shared/domain/entities/unique-entity-id.ts');
copyTemplate('domain-event.ts', 'src/shared/domain/events/domain-event.ts');
copyTemplate('errors.ts', 'src/shared/domain/errors/index.ts');
copyTemplate('repository-contracts.ts', 'src/shared/domain/repositories/repository-contracts.ts');
copyTemplate('searchable-repository.ts', 'src/shared/domain/repositories/searchable-repository.ts');
copyTemplate('in-memory-searchable.ts', 'src/shared/domain/repositories/in-memory-searchable.ts');
copyTemplate('domain-error-filter.ts', 'src/shared/infrastructure/filters/domain-error.filter.ts');
copyTemplate('env-config.service.ts', 'src/shared/infrastructure/env-config/env-config.service.ts');
copyTemplate('ws-gateway-port.ts', 'src/shared/application/ports/ws-gateway.port.ts');
copyTemplate('define-data-builder.ts', 'src/shared/testing/define-data-builder.ts');

// ---------------------------------------------------------------------------
// 4. Create generated files (not from templates)
// ---------------------------------------------------------------------------

fs.writeFileSync(
  path.join(projectDir, 'src/main.ts'),
  readTemplate('main.ts'),
);

fs.writeFileSync(
  path.join(projectDir, 'src/app.module.ts'),
  readTemplate('app.module.ts'),
);

fs.writeFileSync(
  path.join(projectDir, 'src/shared/infrastructure/database/prisma/prisma.service.ts'),
  readTemplate('prisma.service.ts'),
);

fs.writeFileSync(
  path.join(projectDir, 'prisma/schema.prisma'),
  readTemplate('schema.prisma'),
);

fs.writeFileSync(
  path.join(projectDir, 'package.json'),
  readTemplate('package.json.template').replace(/\{\{PROJECT_NAME\}\}/g, projectName),
);

fs.writeFileSync(
  path.join(projectDir, 'tsconfig.json'),
  readTemplate('tsconfig.json'),
);

fs.writeFileSync(
  path.join(projectDir, 'CLAUDE.md'),
  readTemplate('CLAUDE.md').replace(/\{\{PROJECT_NAME\}\}/g, projectName),
);

fs.writeFileSync(
  path.join(projectDir, '.env.example'),
  readTemplate('.env.example'),
);

fs.writeFileSync(
  path.join(projectDir, '.gitignore'),
  readTemplate('.gitignore'),
);

// ---------------------------------------------------------------------------
// 5. Print success message
// ---------------------------------------------------------------------------

console.log(`  nestjs-hexagonal project created at ./${projectName}\n`);
console.log('  Next steps:');
console.log(`    cd ${projectName}`);
console.log('    npm install');
console.log('    npx prisma generate\n');
console.log('  To use the Claude Code plugin:');
console.log('    claude /plugin install github.com/softtor/nestjs-hexagonal\n');
console.log('  Create your first bounded context:');
console.log('    /nestjs-hexagonal:create-subdomain <EntityName>\n');

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function readTemplate(name) {
  return fs.readFileSync(path.join(templatesDir, name), 'utf8');
}
