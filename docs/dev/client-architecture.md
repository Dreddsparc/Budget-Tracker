# Client Architecture

The client is a React 19 single-page application built with Vite, Tailwind CSS v4, and DaisyUI v5. There is no client-side router -- the entire UI is rendered by `App.tsx`.

## Entry Point

```
client/src/main.tsx  ->  App.tsx
```

`main.tsx` renders `<App />` into the root DOM element. All application state and data fetching lives in `App.tsx`.

## Component Tree

```
App
  |-- Navbar
  |     |-- Account selector (dropdown)
  |     |-- "Manage" button -> AccountManageModal
  |     |-- SpreadsheetControls (Export/Import buttons)
  |     |-- Balance display -> SetBalanceModal
  |
  |-- Controls Bar
  |     |-- View toggle (Chart / Ledger tabs)
  |     |-- Chart type selector (dropdown, visible in chart mode)
  |     |-- DateRangeBar (preset buttons + custom range picker)
  |
  |-- Main Content Area (switches on viewMode)
  |     |-- Chart mode: one of
  |     |     |-- ProjectionChart
  |     |     |-- SpendingPieChart
  |     |     |-- IncomeExpenseBarChart
  |     |     |-- CashFlowChart
  |     |     |-- ExpenseTrendChart
  |     |-- Ledger mode:
  |           |-- LedgerView
  |
  |-- Income/Expense Columns (always visible below charts)
  |     |-- IncomeList
  |     |     |-- EntryForm (inline add form)
  |     |     |-- Individual income items with toggle/edit/delete
  |     |     |-- Monthly total (collapsed panel header, via monthlyTotal.ts)
  |     |-- ExpenseList
  |           |-- EntryForm (inline add form)
  |           |-- Individual expense items with toggle/edit/delete
  |           |-- PriceSchedule (for variable expenses)
  |           |-- Monthly total (collapsed panel header, via monthlyTotal.ts)
  |
  |-- ActualSpendList (below income/expense grid)
  |     |-- Add/edit form (date, amount, note, forecast dropdown, category)
  |     |-- Entries grouped by date
  |
  |-- Modals
        |-- SetBalanceModal
        |-- AccountManageModal
        |-- CategoryManageModal
```

## State Management

All state lives in `App.tsx` using `useState` hooks. There is no external state management library (no Redux, Zustand, or Context providers).

### Core State Variables

| Variable | Type | Description |
|----------|------|-------------|
| `accounts` | `Account[]` | All accounts |
| `activeAccountId` | `string \| null` | Currently selected account (persisted to localStorage) |
| `balance` | `number \| null` | Current balance for the active account |
| `income` | `IncomeSource[]` | Income sources for the active account |
| `incomingTransfers` | `IncomingTransfer[]` | Transfers from other accounts to this one |
| `expenses` | `PlannedExpense[]` | Planned expenses for the active account |
| `actuals` | `ActualSpend[]` | Actual spending records for the active account |
| `overrides` | `Override[]` | Client-side active/inactive toggles for what-if analysis |
| `categories` | `CategoryColor[]` | All category definitions |
| `categoryColors` | `Record<string, string>` | Derived map of category name to hex color |
| `projections` | `ProjectionDay[]` | Computed projection data |
| `dateRange` | `DateRange` | Selected date range (preset days or custom start/end) |
| `viewMode` | `"chart" \| "ledger"` | Current view |
| `chartType` | `ChartType` | Selected chart type |
| `refreshKey` | `number` | Increment to force re-fetch of projections |
| `loading` | `boolean` | Initial data loading state |
| `projectionsLoading` | `boolean` | Projection computation loading state |

### DateRange Type

```typescript
type DateRange =
  | { kind: "preset"; days: number }
  | { kind: "custom"; startDate: string; endDate: string };
```

Default: `{ kind: "preset", days: 90 }`

### Override Type

```typescript
interface Override {
  id: string;
  type: "income" | "expense";
  active: boolean;
}
```

## Data Flow

### Initial Load Sequence

1. **Mount:** `fetchAccounts()` loads all accounts.
2. **Account selection:** Checks localStorage for `activeAccountId`. If found and valid, uses it; otherwise defaults to the first account.
3. **Account change effect:** When `activeAccountId` changes, `fetchAll()` runs.
4. **fetchAll:** Loads balance, income, incoming transfers, expenses, actuals, and categories in parallel via `Promise.all`.
5. **fetchProjections:** Triggered by changes to `activeAccountId`, `dateRange`, `overrides`, or `refreshKey`.

### fetchAll (lines 81-115)

```
Promise.all([
  api.getBalance(accountId),
  api.getIncome(accountId),
  api.getIncomingTransfers(accountId),
  api.getExpenses(accountId),
  api.getActuals(accountId),
  api.getCategories()
])
```

After fetching:
- If no balance exists, opens `SetBalanceModal` automatically.
- Builds `categoryColors` map from the categories array.

### fetchProjections (lines 118-134)

```
api.getProjections(accountId, range, activeOverrides)
```

Depends on: `activeAccountId`, `dateRange`, `overrides`, `refreshKey` (via `useCallback` dependency array).

The result is stored in the `projections` state variable, which is passed as props to all chart components and `LedgerView`.

### Props Flow for Charts

All chart components receive `projections` as a prop. Some also receive `categoryColors`:

| Component | Props |
|-----------|-------|
| `ProjectionChart` | `projections`, `categoryColors` |
| `SpendingPieChart` | `projections`, `categoryColors` |
| `IncomeExpenseBarChart` | `projections` |
| `CashFlowChart` | `projections` |
| `ExpenseTrendChart` | `projections`, `categoryColors` |
| `LedgerView` | `projections`, `dateRange`, `loading` |

### Override Flow

1. User clicks a toggle on an income or expense item.
2. `handleToggleOverride(id, active, type)` is called.
3. The override is added to the `overrides` array (or updated if already present).
4. Since `overrides` is a dependency of `fetchProjections`, the projections re-fetch automatically.
5. The overrides are passed as a query parameter to the API -- they are not persisted.
6. Overrides are cleared (`setOverrides([])`) when the active account changes.

### Refresh Flow

When data is modified (income/expense CRUD, balance set), the pattern is:

1. The list component calls its API function directly (e.g., `api.createIncome`).
2. It then calls `onRefresh()` (passed from `App.tsx`).
3. `onRefresh` re-fetches the specific data (income or expenses) and calls `refresh()`.
4. `refresh()` increments `refreshKey`, which triggers `fetchProjections`.

## Key Components

### DateRangeBar

Renders preset duration buttons (30, 60, 90, 180, 365 days) and a custom date range picker. Calls `onChange(dateRange)` when the selection changes.

### ProjectionChart

Line chart (Recharts) showing projected balance over time. Displays the balance curve with event markers. In the tooltip, actual events are shown in a warning color with an "actual" badge.

### SpendingPieChart

Pie chart showing expense distribution by category within the projection window. Uses `categoryColors` for slice coloring.

### LedgerView

Table view of projection data. Shows each day's events (income and expenses) and the running balance. Receives projections as props -- it does not fetch its own data. Actual events (where `isActual` is true) are rendered with a warning-colored dot and an "actual" badge to distinguish them from forecast entries.

### IncomeList / ExpenseList

CRUD lists with inline `EntryForm` for adding new items. Each item has toggle, edit, and delete actions. `ExpenseList` additionally handles:
- Category assignment and color management
- Transfer configuration (selecting target account)
- Variable expense flag and `PriceSchedule` sub-component

### ActualSpendList

Collapsible card panel for managing actual spending records. Contains an add/edit form with fields for date, amount, note, a forecast expense dropdown, and category. Entries are displayed grouped by date. When the user creates, updates, or deletes an actual, the component calls `onRefresh` (which is `handleActualsRefresh` in `App.tsx`) to re-fetch actuals and trigger a projection refresh.

### monthlyTotal.ts

Utility module exporting `calcMonthlyTotal()`. Calculates how many times income or expense items fire in the current calendar month using client-side interval matching that mirrors the server's `matchesInterval` logic. Used by `IncomeList` and `ExpenseList` to display a monthly total in the collapsed panel header.

### SpreadsheetControls

Export and import buttons. Export triggers a file download via `api.exportSpreadsheet`. Import opens a file picker and uploads via `api.importSpreadsheet`, then calls `onImportComplete` (which is `fetchAll`).

## API Layer

`client/src/api.ts` is a single file containing all API calls. The core helper:

```typescript
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}
```

`BASE` is an empty string -- all paths are relative, relying on the Vite proxy to forward `/api` to the server.

Account-scoped actual spending functions: `getActuals`, `createActual`, `updateActual`, `deleteActual`.

Two functions bypass the JSON helper:
- `exportSpreadsheet` -- returns a `Blob` for file download.
- `importSpreadsheet` -- sends `FormData` (no JSON Content-Type header).

## Type Definitions

`client/src/types.ts` contains all client-side interfaces. These are manually kept in sync with the Prisma schema -- there is no code generation step. Key differences from the server types:
- Dates are `string` (ISO format) rather than `Date` objects.
- `BalanceSnapshot` omits `accountId` and `createdAt` (not used in the UI).
- `IncomingTransfer` is a flattened shape with `sourceAccountName` rather than a nested account relation.
- `ActualSpend` includes the optional nested `forecastExpense` summary (`{ id, name, category }`).
- `ProjectionEvent` includes the optional `isActual` boolean flag.

## Styling

The client uses Tailwind CSS v4 with DaisyUI v5 for component styling. All styles are applied through utility classes directly in JSX -- there are no separate CSS modules or styled-components. DaisyUI provides pre-built components like `btn`, `card`, `modal`, `tabs`, `select`, and `navbar`.
