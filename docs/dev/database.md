# Database Schema

The database is PostgreSQL 16, managed entirely through Prisma ORM. The schema is defined in `server/prisma/schema.prisma`.

## Models

### Account

The top-level entity. All financial data (balances, income, expenses) is scoped to an account. Users can manage multiple accounts.

| Field | Type | Attributes | Description |
|-------|------|-----------|-------------|
| `id` | `String` | `@id @default(uuid())` | UUID primary key |
| `name` | `String` | | Display name (e.g., "Checking", "Savings") |
| `createdAt` | `DateTime` | `@default(now())` | Creation timestamp |
| `updatedAt` | `DateTime` | `@updatedAt` | Last modification timestamp |

**Relations:**

| Relation | Type | Description |
|----------|------|-------------|
| `balanceSnapshots` | `BalanceSnapshot[]` | Balance history for this account |
| `incomeSources` | `IncomeSource[]` | Income sources owned by this account |
| `plannedExpenses` | `PlannedExpense[]` | Expenses owned by this account |
| `incomingTransfers` | `PlannedExpense[]` | Expenses from *other* accounts that transfer money *to* this account (named relation `"TransferTarget"`) |

The `incomingTransfers` relation is the inverse side of `PlannedExpense.transferToAccount`. This allows querying "which expenses from other accounts send money to me?" -- used by the projections engine and the income transfers endpoint.

### BalanceSnapshot

A point-in-time balance recording. The most recent snapshot for an account is used as the starting balance for projections.

| Field | Type | Attributes | Description |
|-------|------|-----------|-------------|
| `id` | `String` | `@id @default(uuid())` | UUID primary key |
| `amount` | `Float` | | Balance amount |
| `date` | `DateTime` | `@default(now())` | When this balance was recorded |
| `createdAt` | `DateTime` | `@default(now())` | Record creation timestamp |
| `accountId` | `String` | FK to `Account`, `onDelete: Cascade` | Owning account |

**Indexes:** `@@index([accountId])`

### IncomeSource

A recurring or one-time income stream.

| Field | Type | Attributes | Description |
|-------|------|-----------|-------------|
| `id` | `String` | `@id @default(uuid())` | UUID primary key |
| `name` | `String` | | Display name (e.g., "Salary") |
| `amount` | `Float` | | Income amount per occurrence |
| `interval` | `Interval` | | Recurrence frequency |
| `startDate` | `DateTime` | | First occurrence date |
| `active` | `Boolean` | `@default(true)` | Whether included in projections |
| `createdAt` | `DateTime` | `@default(now())` | Record creation timestamp |
| `updatedAt` | `DateTime` | `@updatedAt` | Last modification timestamp |
| `accountId` | `String` | FK to `Account`, `onDelete: Cascade` | Owning account |

**Indexes:** `@@index([accountId])`

### PlannedExpense

A recurring or one-time expense. Can also represent a transfer between accounts.

| Field | Type | Attributes | Description |
|-------|------|-----------|-------------|
| `id` | `String` | `@id @default(uuid())` | UUID primary key |
| `name` | `String` | | Display name (e.g., "Rent") |
| `amount` | `Float` | | Expense amount per occurrence |
| `interval` | `Interval` | | Recurrence frequency |
| `startDate` | `DateTime` | | First occurrence date |
| `endDate` | `DateTime?` | | Optional end date (null = indefinite) |
| `active` | `Boolean` | `@default(true)` | Whether included in projections |
| `category` | `String?` | | Optional category label |
| `isVariable` | `Boolean` | `@default(false)` | If true, amount can change via PriceAdjustments |
| `isTransfer` | `Boolean` | `@default(false)` | If true, this is a transfer to another account |
| `transferToAccountId` | `String?` | FK to `Account` via `"TransferTarget"`, `onDelete: SetNull` | Target account for transfers |
| `createdAt` | `DateTime` | `@default(now())` | Record creation timestamp |
| `updatedAt` | `DateTime` | `@updatedAt` | Last modification timestamp |
| `accountId` | `String` | FK to `Account`, `onDelete: Cascade` | Owning (source) account |

**Relations:**
- `priceAdjustments`: `PriceAdjustment[]` -- variable pricing schedule
- `transferToAccount`: `Account?` -- target account (named relation `"TransferTarget"`)
- `account`: `Account` -- owning account

**Indexes:** `@@index([accountId])`, `@@index([transferToAccountId])`

**Transfer mechanics:** When `isTransfer` is true and `transferToAccountId` is set, the expense deducts from the source account and the projection engine adds it as income to the target account. Deleting the target account sets `transferToAccountId` to null (`onDelete: SetNull`) rather than cascading.

### PriceAdjustment

Tracks price changes for variable expenses over time. Each adjustment defines a new effective amount starting from a specific date.

| Field | Type | Attributes | Description |
|-------|------|-----------|-------------|
| `id` | `String` | `@id @default(uuid())` | UUID primary key |
| `expenseId` | `String` | FK to `PlannedExpense`, `onDelete: Cascade` | Parent expense |
| `amount` | `Float` | | New effective amount from `startDate` onward |
| `startDate` | `DateTime` | | When this price takes effect |
| `note` | `String?` | | Optional description of the change |
| `createdAt` | `DateTime` | `@default(now())` | Record creation timestamp |

**Indexes:** `@@index([expenseId])`

### CategoryColor

Stores display colors for expense categories. The primary key is the category name itself -- there is no separate UUID.

| Field | Type | Attributes | Description |
|-------|------|-----------|-------------|
| `name` | `String` | `@id` | Category name (primary key) |
| `color` | `String` | `@default("#ef4444")` | Hex color code |
| `description` | `String` | `@default("")` | Optional description |

This model has no relations. Categories are linked to expenses through the `PlannedExpense.category` string field, not through a foreign key. This is a deliberate denormalization -- expenses store the category name directly.

## Interval Enum

```prisma
enum Interval {
  ONE_TIME
  DAILY
  WEEKLY
  BIWEEKLY
  MONTHLY
  QUARTERLY
  YEARLY
}
```

Used by both `IncomeSource.interval` and `PlannedExpense.interval`. The projection engine uses this to determine which dates an event fires on. See [Projections Engine](projections-engine.md) for the matching logic.

## Entity Relationship Diagram

```
Account (1) ---< (many) BalanceSnapshot
Account (1) ---< (many) IncomeSource
Account (1) ---< (many) PlannedExpense        (via accountId)
Account (1) ---< (many) PlannedExpense        (via transferToAccountId, "TransferTarget")

PlannedExpense (1) ---< (many) PriceAdjustment

CategoryColor (standalone, linked by name string to PlannedExpense.category)
```

## Cascade Behavior

| Relationship | On Delete |
|-------------|-----------|
| Account -> BalanceSnapshot | Cascade (deleting account removes its balance history) |
| Account -> IncomeSource | Cascade |
| Account -> PlannedExpense (accountId) | Cascade |
| Account -> PlannedExpense (transferToAccountId) | SetNull (transfer target cleared, expense preserved) |
| PlannedExpense -> PriceAdjustment | Cascade |

## Migration Strategy

### Development: `prisma db push`

The project uses `prisma db push` rather than `prisma migrate dev` as the primary development workflow. This is executed automatically on server container startup:

```dockerfile
# server/Dockerfile CMD
npx prisma db push --skip-generate && npx prisma generate && npx tsx prisma/seed-accounts.ts && npx tsx watch src/index.ts
```

`db push` applies the schema directly to the database without creating migration files. This is appropriate for development but not for production deployments.

### When to use migrations

For breaking schema changes or production, use the Makefile target:

```bash
make db-migrate    # Runs: npx prisma migrate dev (interactive, creates migration file)
```

### Resetting the database

```bash
make db-reset      # Drops and recreates the database (destroys all data)
```

## Seed Script

Located at `server/prisma/seed-accounts.ts`, the seed script runs on every server startup. It is idempotent:

1. Checks if any accounts exist (`prisma.account.count()`).
2. If zero accounts, creates a default account named `"Primary"`.
3. Backfills any existing records with an empty `accountId` (migration artifact from when the app was single-account).

The seed script does not create sample income, expenses, or balance data. Those are added through the UI or spreadsheet import.

## Database Connection

The connection string is configured via the `DATABASE_URL` environment variable, injected by Docker Compose from the `.env` file. The Prisma client singleton lives at `server/src/lib/prisma.ts`:

```typescript
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export default prisma;
```

All route files import this singleton directly. There is no connection pooling configuration beyond Prisma's defaults.
