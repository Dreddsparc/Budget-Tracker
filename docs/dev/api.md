# API Reference

All endpoints are served by the Express server on port 3001. In development, the Vite proxy forwards `/api` requests from the client (port 5173) to the server automatically.

All request and response bodies use JSON (`Content-Type: application/json`) unless otherwise noted.

## Common Error Response

All endpoints return errors in this shape:

```json
{ "error": "Descriptive error message" }
```

Standard HTTP status codes:
- `400` -- Bad request (missing fields, invalid data)
- `404` -- Resource not found
- `500` -- Server error

---

## Accounts

Account management is global (not scoped to another account).

**Source:** `server/src/routes/accounts.ts`

### GET /api/accounts

List all accounts, ordered by creation date ascending.

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "Primary",
    "createdAt": "2026-01-15T10:00:00.000Z",
    "updatedAt": "2026-01-15T10:00:00.000Z"
  }
]
```

### POST /api/accounts

Create a new account.

**Request Body:**
```json
{ "name": "Savings" }
```

**Validation:** `name` is required and must be a non-empty string after trimming.

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "name": "Savings",
  "createdAt": "...",
  "updatedAt": "..."
}
```

### PUT /api/accounts/:id

Rename an account.

**Request Body:**
```json
{ "name": "Joint Checking" }
```

**Validation:** `name` is required and must be a non-empty string after trimming.

**Response:** `200 OK` -- Updated account object.

### DELETE /api/accounts/:id

Delete an account and all its data (balance, income, expenses cascade).

**Constraint:** Cannot delete the last remaining account. Returns `400` if only one account exists.

**Response:** `204 No Content`

---

## Balance

Scoped to an account. Uses `Router({ mergeParams: true })` to access `:accountId`.

**Source:** `server/src/routes/balance.ts`

### GET /api/accounts/:accountId/balance

Get the most recent balance snapshot for the account.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "amount": 5000.00,
  "date": "2026-03-26T00:00:00.000Z",
  "createdAt": "2026-03-26T12:00:00.000Z",
  "accountId": "uuid"
}
```

Returns `null` (JSON literal) if no balance has been set.

### POST /api/accounts/:accountId/balance

Create a new balance snapshot. Does not replace the old one -- all snapshots are preserved. The most recent by `date` is used for projections.

**Request Body:**
```json
{ "amount": 5000.00 }
```

**Validation:** `amount` is required and must be a number.

**Response:** `201 Created` -- The new BalanceSnapshot object.

---

## Income

Scoped to an account.

**Source:** `server/src/routes/income.ts`

### GET /api/accounts/:accountId/income

List all income sources for the account, ordered by creation date descending.

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "Salary",
    "amount": 3000.00,
    "interval": "BIWEEKLY",
    "startDate": "2026-01-01T00:00:00.000Z",
    "active": true,
    "createdAt": "...",
    "updatedAt": "...",
    "accountId": "uuid"
  }
]
```

### POST /api/accounts/:accountId/income

Create a new income source.

**Request Body:**
```json
{
  "name": "Salary",
  "amount": 3000.00,
  "interval": "BIWEEKLY",
  "startDate": "2026-01-01"
}
```

**Required fields:** `name`, `amount`, `interval`, `startDate`

**Response:** `201 Created`

### PUT /api/accounts/:accountId/income/:id

Update an income source. All fields are optional -- only provided fields are updated.

**Request Body (all optional):**
```json
{
  "name": "Updated Salary",
  "amount": 3500.00,
  "interval": "MONTHLY",
  "startDate": "2026-02-01",
  "active": false
}
```

**Validation:** Returns `404` if the income source does not exist or does not belong to this account.

**Response:** `200 OK` -- Updated income source.

### DELETE /api/accounts/:accountId/income/:id

Delete an income source.

**Validation:** Returns `404` if not found or not owned by this account.

**Response:** `204 No Content`

### PATCH /api/accounts/:accountId/income/:id/toggle

Toggle the `active` state. If currently `true`, sets to `false`, and vice versa.

**Request Body:** None.

**Response:** `200 OK` -- Updated income source with new `active` value.

### GET /api/accounts/:accountId/income/transfers

List incoming transfers from other accounts. These are `PlannedExpense` records from other accounts where `isTransfer` is true and `transferToAccountId` matches the current account.

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "Monthly savings contribution",
    "amount": 500.00,
    "interval": "MONTHLY",
    "startDate": "2026-01-01T00:00:00.000Z",
    "endDate": null,
    "active": true,
    "sourceAccountName": "Checking"
  }
]
```

Note: The response is a mapped shape, not the raw PlannedExpense. It includes `sourceAccountName` resolved from the expense's owning account.

---

## Expenses

Scoped to an account.

**Source:** `server/src/routes/expenses.ts`

### GET /api/accounts/:accountId/expenses

List all expenses for the account, ordered by creation date descending. Includes `priceAdjustments` for each expense, ordered by `startDate` ascending.

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "Rent",
    "amount": 1500.00,
    "interval": "MONTHLY",
    "startDate": "2026-01-01T00:00:00.000Z",
    "endDate": null,
    "active": true,
    "category": "Housing",
    "isVariable": false,
    "isTransfer": false,
    "transferToAccountId": null,
    "priceAdjustments": [],
    "createdAt": "...",
    "updatedAt": "...",
    "accountId": "uuid"
  }
]
```

### POST /api/accounts/:accountId/expenses

Create a new expense.

**Request Body:**
```json
{
  "name": "Rent",
  "amount": 1500.00,
  "interval": "MONTHLY",
  "startDate": "2026-01-01",
  "endDate": null,
  "category": "Housing",
  "isVariable": false,
  "isTransfer": false,
  "transferToAccountId": null
}
```

**Required fields:** `name`, `amount`, `interval`, `startDate`

**Optional fields:** `endDate`, `category`, `isVariable`, `isTransfer`, `transferToAccountId`

**Transfer validation:**
- If `isTransfer` is true and `transferToAccountId` is provided, the target account must exist and must not be the same as the current account. Returns `400` on violation.

**Response:** `201 Created` -- Expense object with empty `priceAdjustments` array.

### PUT /api/accounts/:accountId/expenses/:id

Update an expense. All fields are optional.

**Request Body (all optional):**
```json
{
  "name": "Updated Rent",
  "amount": 1600.00,
  "interval": "MONTHLY",
  "startDate": "2026-02-01",
  "endDate": "2027-01-01",
  "category": "Housing",
  "active": true,
  "isVariable": false,
  "isTransfer": false,
  "transferToAccountId": null
}
```

**Note:** Setting `isTransfer` to `false` automatically clears `transferToAccountId` to `null`.

**Response:** `200 OK` -- Updated expense with `priceAdjustments`.

### DELETE /api/accounts/:accountId/expenses/:id

Delete an expense and all its price adjustments (cascade).

**Response:** `204 No Content`

### PATCH /api/accounts/:accountId/expenses/:id/toggle

Toggle the `active` state.

**Response:** `200 OK` -- Updated expense with `priceAdjustments`.

### GET /api/accounts/:accountId/expenses/:id/prices

List all price adjustments for an expense, ordered by `startDate` ascending.

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "expenseId": "uuid",
    "amount": 1600.00,
    "startDate": "2026-06-01T00:00:00.000Z",
    "note": "Rent increase",
    "createdAt": "..."
  }
]
```

### POST /api/accounts/:accountId/expenses/:id/prices

Create a new price adjustment for an expense.

**Request Body:**
```json
{
  "amount": 1600.00,
  "startDate": "2026-06-01",
  "note": "Annual rent increase"
}
```

**Required fields:** `amount`, `startDate`

**Response:** `201 Created`

### PUT /api/accounts/:accountId/expenses/:expenseId/prices/:priceId

Update a price adjustment.

**Request Body (all optional):**
```json
{
  "amount": 1650.00,
  "startDate": "2026-07-01",
  "note": "Revised increase"
}
```

**Validation:** Returns `404` if the expense or price adjustment is not found or does not belong to this account.

**Response:** `200 OK`

### DELETE /api/accounts/:accountId/expenses/:expenseId/prices/:priceId

Delete a price adjustment.

**Response:** `204 No Content`

---

## Projections

Scoped to an account.

**Source:** `server/src/routes/projections.ts`

### GET /api/accounts/:accountId/projections

Compute a day-by-day balance forecast. See [Projections Engine](projections-engine.md) for algorithm details.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `days` | `number` | Number of days to project (default: 90, max: 730) |
| `startDate` | `string` | Start date in `YYYY-MM-DD` format (used with `endDate`) |
| `endDate` | `string` | End date in `YYYY-MM-DD` format (used with `startDate`) |
| `overrides` | `string` | JSON array of `{ id: string, active: boolean }` objects |

Use either `days` or the `startDate`/`endDate` pair. If both are provided, `startDate`/`endDate` takes precedence.

The window is capped at 2 years (730 days) regardless of the requested range.

**Override format:**
```
?overrides=[{"id":"uuid-1","active":false},{"id":"uuid-2","active":true}]
```

Overrides temporarily change the `active` state of income or expense items for this projection request only.

**Response:** `200 OK`
```json
[
  {
    "date": "2026-03-26",
    "balance": 5000.00,
    "events": [
      { "type": "income", "name": "Salary", "amount": 3000.00 },
      { "type": "expense", "name": "Rent", "amount": 1500.00, "category": "Housing" }
    ]
  },
  {
    "date": "2026-03-27",
    "balance": 5000.00,
    "events": []
  }
]
```

**Error responses:**
- `400` -- Invalid `overrides` JSON
- `500` -- Computation failure

---

## Categories

Global routes -- not scoped to an account.

**Source:** `server/src/routes/categories.ts`

### GET /api/categories

List all category colors. Also auto-discovers categories: queries all distinct `category` values from `PlannedExpense` and creates `CategoryColor` entries for any that do not yet exist (with the default color `#ef4444`).

**Response:** `200 OK`
```json
[
  { "name": "Housing", "color": "#3498db", "description": "" },
  { "name": "Food", "color": "#ef4444", "description": "" }
]
```

### POST /api/categories

Create a new category.

**Request Body:**
```json
{
  "name": "Transportation",
  "color": "#27ae60",
  "description": "Car, transit, rideshare"
}
```

**Required:** `name` (non-empty string after trimming)

**Defaults:** `color` defaults to `"#ef4444"`, `description` defaults to `""`.

**Response:** `201 Created`

### PUT /api/categories/:name

Update a category's color, description, or rename it.

**Request Body:**
```json
{
  "color": "#2ecc71",
  "description": "Updated description",
  "newName": "Transport"
}
```

All fields are optional.

**Rename behavior:** When `newName` is provided and differs from the current name:
1. Checks that `newName` does not already exist (returns `400` if it does).
2. Creates a new `CategoryColor` with the new name.
3. Updates all expenses using the old category name to the new name.
4. Deletes the old `CategoryColor` record.

**Simple update behavior:** When no `newName` is provided, uses `upsert` to update color/description.

**Response:** `200 OK` -- Updated category object.

### DELETE /api/categories/:name

Delete a category. Sets `category` to `null` on all expenses that used this category name.

**Response:** `204 No Content`

---

## Spreadsheet

Scoped to an account. See [Spreadsheet Import/Export](spreadsheet.md) for detailed documentation.

**Source:** `server/src/routes/spreadsheet.ts`

### GET /api/accounts/:accountId/spreadsheet/export

Download the account's data as an Excel (.xlsx) file.

**Response:** `200 OK` with `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

The filename follows the pattern: `budget-tracker-{account-name}-{date}.xlsx`

### POST /api/accounts/:accountId/spreadsheet/import

Upload an Excel file to import data. Uses `multer` with a 10 MB file size limit. The file field name is `file`.

**Request:** `multipart/form-data` with a single file field named `file`.

**Response:** `200 OK`
```json
{
  "message": "Import completed successfully",
  "results": {
    "balance": { "updated": true },
    "income": { "created": 2, "updated": 1, "deleted": 0 },
    "expenses": { "created": 3, "updated": 2, "deleted": 1 },
    "priceAdjustments": { "created": 1, "updated": 0, "deleted": 0 },
    "categories": { "created": 1, "updated": 2 },
    "errors": ["Expense row 15: invalid interval \"BIMONTHLY\""]
  }
}
```

The `errors` array contains non-fatal validation issues. Rows with errors are skipped; valid rows are still processed.

---

## Health

### GET /api/health

**Response:** `200 OK`
```json
{ "status": "ok" }
```

Used by Docker health checks to determine when the server is ready.
