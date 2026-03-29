# Spreadsheet Import/Export

The spreadsheet system provides Excel-based data exchange using ExcelJS. Users can export their account data to a `.xlsx` file, modify it externally, and re-import it.

**Source:** `server/src/routes/spreadsheet.ts`

## Overview

- **Export** generates a 6-sheet workbook with formatting, validation, frozen panes, and auto-filters.
- **Import** parses each sheet, validates fields, and performs create/update/delete operations scoped to the account.
- File upload uses multer with memory storage and a 10 MB size limit.
- Transfer targets are resolved by account name (not ID) during import.

## Export Workbook Structure

The exported workbook contains 6 sheets:

### 1. Instructions

A plain text sheet with usage instructions. Not parsed during import. Contains guidance on column formats, how to add/edit/delete rows, and tips for working with the spreadsheet.

### 2. Balance

| Column | Key | Width | Description |
|--------|-----|-------|-------------|
| A | Current Balance | 25 | The most recent balance amount |
| B | As Of Date | 20 | Date of the balance snapshot (YYYY-MM-DD) |

Always 1 data row. If no balance exists, exports `0` with today's date.

### 3. Income Sources

| Column | Key | Width | Description |
|--------|-----|-------|-------------|
| A | ID | 10 | UUID (keep for updates, leave blank for new rows) |
| B | Name | 30 | Income source name |
| C | Amount | 15 | Amount per occurrence (currency formatted) |
| D | Interval | 15 | Dropdown: ONE_TIME, DAILY, WEEKLY, etc. |
| E | Start Date | 15 | YYYY-MM-DD |
| F | Active | 10 | Dropdown: TRUE / FALSE |

Includes 20 blank pre-formatted rows for adding new entries.

### 4. Planned Expenses

| Column | Key | Width | Description |
|--------|-----|-------|-------------|
| A | ID | 10 | UUID |
| B | Name | 30 | Expense name |
| C | Amount | 15 | Amount per occurrence |
| D | Interval | 15 | Interval dropdown |
| E | Start Date | 15 | YYYY-MM-DD |
| F | End Date | 15 | YYYY-MM-DD (optional) |
| G | Active | 10 | TRUE / FALSE dropdown |
| H | Category | 18 | Category name (free text) |
| I | Is Variable | 12 | TRUE / FALSE dropdown |
| J | Is Transfer | 12 | TRUE / FALSE dropdown |
| K | Transfer To Account | 22 | Account name (resolved to ID on import) |

Includes 20 blank pre-formatted rows. Transfer targets are exported as account names (not UUIDs) for human readability.

### 5. Price Adjustments

| Column | Key | Width | Description |
|--------|-----|-------|-------------|
| A | ID | 10 | UUID of the price adjustment |
| B | Expense Name | 30 | Name of the parent expense (for human reference) |
| C | Expense ID | 10 | UUID of the parent expense |
| D | Amount | 15 | New effective amount |
| E | Start Date | 15 | When this price takes effect |
| F | Note | 35 | Optional description |

Includes 15 blank pre-formatted rows. On import, if Expense ID is blank, the system resolves it by matching Expense Name (case-insensitive).

### 6. Category Colors

| Column | Key | Width | Description |
|--------|-----|-------|-------------|
| A | Category Name | 25 | Category name (acts as primary key) |
| B | Color (hex) | 18 | Hex color code (e.g., #3498db) |
| C | Preview | 12 | Cell filled with the color (visual only) |

Includes 10 blank pre-formatted rows.

## Formatting System

### Color Palette

The spreadsheet uses a consistent color system defined in the `COLORS` object (line 14):

| Constant | Hex | Usage |
|----------|-----|-------|
| `darkBlue` | `1B2A4A` | Instructions title |
| `green` | `27AE60` | Balance and Income sheet headers |
| `red` | `E74C3C` | Expenses sheet header |
| `orange` | `F39C12` | Price Adjustments sheet header |
| `purple` | `8E44AD` | Category Colors sheet header |

Each sheet has a matching tab color and alternating row colors using the "light" variant of the header color.

### Formatting Helpers

| Function | Purpose |
|----------|---------|
| `headerFill(color)` | Solid fill for header rows |
| `headerFont(color, size)` | Bold white Calibri font for headers |
| `bodyFont(size)` | Standard Calibri font for data rows |
| `thinBorder()` | Thin gray borders on all sides |
| `applyHeaderRow(sheet, rowNum, fill)` | Applies header styling to a row (fill, font, border, alignment, 28px height) |
| `applyDataRows(sheet, start, end, altColor)` | Applies body styling with optional alternating row colors |
| `styleIdColumn(sheet, col, start, end)` | Styles ID columns with smaller, gray font |
| `formatAsDate(sheet, col, start, end)` | Sets `YYYY-MM-DD` number format |
| `formatAsCurrency(sheet, col, start, end)` | Sets `$#,##0.00` number format |
| `addIntervalValidation(sheet, colLetter, start, end)` | Adds dropdown validation for Interval enum values |
| `addBoolValidation(sheet, colLetter, start, end)` | Adds TRUE/FALSE dropdown validation |

### Sheet Features

All data sheets (Income, Expenses, Price Adjustments, Categories) have:
- **Frozen panes:** Row 1 frozen (`ySplit: 1`), so headers remain visible during scrolling.
- **Auto-filters:** Applied to the header row for sorting and filtering.

## Import Logic

### General Pattern

For each sheet, the import follows the same pattern:

1. **Collect existing IDs** from the database (scoped to the account).
2. **Iterate rows**, skipping the header (row 1) and rows where the name/key field is blank.
3. **Validate** required fields (amount, interval, startDate). Invalid rows generate an error message in the results but do not block the import.
4. **Match by ID:** If column A has an ID that exists in the database, the row is an **update**. If the ID is blank or not found, the row is a **create**.
5. **Detect deletions:** Any existing database IDs not seen in the spreadsheet rows are **deleted**.
6. All operations run in parallel using `Promise.all`.

### Balance Import

Reads cell A2 from the "Balance" sheet. If it is a valid number, creates a new `BalanceSnapshot` with today's date.

### Income Import

Validates: `name` (non-empty), `amount` (valid number), `interval` (valid enum value), `startDate` (valid date).

Boolean parsing for `active` accepts: `true`, `"TRUE"`, `"YES"`, `"1"`.

### Expense Import

Same validation as income, plus:
- `endDate` is optional (parsed with `parseDate`).
- `category` defaults to `null` if empty.
- Transfer target resolution: if `isTransfer` is true and a transfer account name is provided, the system looks up the account by name (case-insensitive). If the account is not found, the expense is imported as a regular expense and an error message is added.
- `isTransfer` is set to `false` if the transfer target cannot be resolved.

### Price Adjustment Import

Resolves the parent expense by:
1. Using the Expense ID (column C) if provided.
2. Falling back to a case-insensitive name match on the Expense Name (column B).

If neither resolves to an existing expense, the row is skipped with an error.

### Category Import

Uses `upsert` -- creates the category if it does not exist, updates the color if it does. No deletion logic for categories (they are preserved even if not in the spreadsheet).

### Date Parsing

The `parseDate` function (line 129) handles multiple date formats:

```typescript
function parseDate(val: unknown): string | null {
  if (!val) return null;
  if (val instanceof Date) return toDateStr(val);        // Excel Date objects
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10); // "2026-03-26T..."
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : toDateStr(d);       // Fallback parsing
}
```

## Account Scoping

All import operations are scoped to the active account (`accountId` from the URL parameter):

- Income creates/updates/deletes only affect records where `accountId` matches.
- Expense creates/updates/deletes only affect records where `accountId` matches.
- Price adjustment deletes are scoped to expenses owned by the account.
- Balance snapshots are created with the current `accountId`.
- Category colors are global (not account-scoped).

This means importing a spreadsheet for Account A will never modify data belonging to Account B.

## Round-Trip Safety

The export/import cycle is designed to be safe:

1. Export generates IDs in column A for all existing records.
2. Import uses those IDs to match rows to database records for updates.
3. Rows without IDs are treated as new records.
4. Rows removed from the spreadsheet trigger deletions.

**Caution:** If you export from Account A and import into Account B, the IDs will not match any records in Account B, so all rows will be treated as creates (and any existing Account B data will be deleted since those IDs are not in the spreadsheet). Always import back into the same account that was exported.

## File Size Limit

The multer configuration limits uploads to 10 MB:

```typescript
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});
```

The file is loaded entirely into memory as a buffer before being parsed by ExcelJS.
