---
label: Database
icon: database
order: 50
---

# Database & migrations

Merinaa's `DatabaseModule` wraps Deepkit ORM with a migration runner
that picks up files from each module's `migrations/` folder.

## Where migrations live

```
modules/bank/
├── entities/
│   └── bank-account.entity.ts
└── migrations/
    ├── 0001-create-bank-accounts.ts
    └── 0002-add-pin-column.ts
```

## Migration file shape

```ts
// modules/bank/migrations/0001-create-bank-accounts.ts
import { Migration } from '@merinaa/server';

export default class extends Migration {
    up = async () => {
        await this.sql.exec(`
            CREATE TABLE bank_accounts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                owner_id VARCHAR(36) NOT NULL,
                balance DECIMAL(12,2) NOT NULL DEFAULT 0
            );
        `);
    };

    down = async () => {
        await this.sql.exec(`DROP TABLE bank_accounts;`);
    };
}
```

## Running migrations

```bash
pnpm run db:migrate              # apply pending migrations
pnpm run db:migrate:create add-xyz   # scaffold a new migration file
```

Migrations run automatically on server start when `autoMigrate: true`
is set (default in `DatabaseModule.forRoot`). For production, consider
running them from CI before deploying a new build.

## Naming convention

`NNNN-kebab-case-description.ts` where NNNN is a zero-padded sequence.
The migration runner picks them up in lexicographic order across every
module, so the prefix disambiguates order across modules.

## Rollback

```bash
pnpm run db:migrate down         # undo the last applied migration
```

## Schema generation

Entities decorated with `@entity` + `@PrimaryKey` / `@AutoIncrement` can
also be used with Deepkit's schema generator — but for anything beyond
"scaffold the table", hand-written migrations give you control over
column order, indexes and foreign keys.
