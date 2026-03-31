# Adding Features

This guide covers common extension points in the Budget Tracker codebase.

## Adding a New Chart Type

Charts are Recharts components that receive `projections: ProjectionDay[]` as props.

### Steps

1. **Create the component** in `client/src/components/`. Follow the pattern of existing chart files (e.g., `CashFlowChart.tsx`):

```typescript
// client/src/components/MyNewChart.tsx
import { ProjectionDay } from "../types";

interface Props {
  projections: ProjectionDay[];
  categoryColors?: Record<string, string>;
}

export default function MyNewChart({ projections, categoryColors }: Props) {
  // Transform projections data as needed
  // Return a Recharts chart wrapped in a DaisyUI card
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        {/* Recharts component here */}
      </div>
    </div>
  );
}
```

2. **Register the chart type**:

In `client/src/types.ts`, add to the `ChartType` union:

```typescript
export type ChartType = "projection" | "spending" | "income-vs-expenses" | "cash-flow" | "expense-trend" | "my-new-chart";
```

In `client/src/App.tsx`, add to the `CHART_OPTIONS` array:

```typescript
{ value: "my-new-chart", label: "My New Chart" },
```

3. **Import and render** in `App.tsx`:

```typescript
// Add import at top
import MyNewChart from "./components/MyNewChart";

// Add case in renderChart() switch (around line 209)
case "my-new-chart":
  return <MyNewChart projections={projections} categoryColors={categoryColors} />;
```

No server changes required -- all chart components consume the same `projections` data.

### Supporting fullscreen mode

All existing chart components accept an optional `options?: ChartFullscreenOptions` prop. When `options` is provided, the component renders without its card wrapper and uses `options.height` instead of a fixed height. Chart-specific toggles (e.g., `chartStyle`, `barLayout`, `pieStyle`, `trendMode`) are also read from `options` when present.

This pattern keeps chart components backward compatible: callers that omit `options` get the original card-wrapped, fixed-height behavior. The `ChartFullscreen` component is the only caller that provides `options`.

To make a new chart work in fullscreen:

1. Add `options?: ChartFullscreenOptions` to your component's props interface.
2. When `options` is present, use `options.height` for the chart height and skip the card wrapper.
3. Read any chart-specific toggles from `options` (e.g., `options.chartStyle`) and fall back to sensible defaults.
4. If your chart uses SVG gradients with fixed `id` attributes, prefix them (e.g., `"fs-"`) when `options` is present to avoid DOM ID collisions with the non-fullscreen instance.
5. Add a rendering case for your chart type in `ChartFullscreen.tsx`.

## Adding a New Field to Expenses

Adding a field requires changes across the full stack.

### 1. Update the Prisma schema

In `server/prisma/schema.prisma`, add the field to `PlannedExpense`:

```prisma
model PlannedExpense {
  // ... existing fields ...
  myNewField  String?   @default("default_value")
}
```

Run `make db-push` to apply the change (or `make db-migrate` for a proper migration).

### 2. Update the expenses route

In `server/src/routes/expenses.ts`:

**POST handler** -- add the field to the destructured body and the `create` data:

```typescript
const { name, amount, interval, startDate, endDate, category, isVariable, isTransfer, transferToAccountId, myNewField } = req.body;

// In the create data:
data: {
  // ... existing fields ...
  myNewField: myNewField || null,
}
```

**PUT handler** -- add the field to the update logic:

```typescript
if (myNewField !== undefined) data.myNewField = myNewField;
```

### 3. Update the client type

In `client/src/types.ts`, add the field to `PlannedExpense`:

```typescript
export interface PlannedExpense {
  // ... existing fields ...
  myNewField?: string;
}
```

### 4. Update the UI

Modify `client/src/components/ExpenseList.tsx` and/or `EntryForm.tsx` to display and edit the new field.

### 5. Update the spreadsheet (if needed)

In `server/src/routes/spreadsheet.ts`:

- **Export:** Add a column to the "Planned Expenses" sheet.
- **Import:** Parse the new column in the expense import section and include it in the create/update data.

## Adding a New API Endpoint

### Account-scoped endpoint

1. **Add the route** in the appropriate route file (e.g., `server/src/routes/expenses.ts`):

```typescript
router.get("/some-new-endpoint", async (req: Request, res: Response) => {
  const { accountId } = req.params;  // Available via mergeParams
  // ... implementation
});
```

No changes to `server/src/index.ts` needed -- the route is already mounted under `/api/accounts/:accountId/expenses`.

### New route group

If the endpoint belongs to a new domain:

1. **Create a new route file** at `server/src/routes/newdomain.ts`:

```typescript
import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";

const router = Router({ mergeParams: true });  // If account-scoped

router.get("/", async (req: Request, res: Response) => {
  const { accountId } = req.params;
  // ...
});

export default router;
```

2. **Mount it** in `server/src/index.ts`:

```typescript
import newdomainRoutes from "./routes/newdomain";
app.use("/api/accounts/:accountId/newdomain", newdomainRoutes);
```

3. **Add the client API function** in `client/src/api.ts`:

```typescript
export function getNewDomainData(accountId: string): Promise<NewDomainType[]> {
  return request<NewDomainType[]>(`/api/accounts/${accountId}/newdomain`);
}
```

## Adding a New Interval Type

Intervals affect the projection engine, all forms, and the spreadsheet.

### 1. Update the Prisma enum

In `server/prisma/schema.prisma`:

```prisma
enum Interval {
  ONE_TIME
  DAILY
  WEEKLY
  BIWEEKLY
  MONTHLY
  QUARTERLY
  YEARLY
  SEMIMONTHLY  // new
}
```

Run `make db-push`.

### 2. Add matching logic

In `server/src/routes/projections.ts`, add a case to the `matchesInterval` switch statement:

```typescript
case "SEMIMONTHLY":
  // Fires on the 1st and 15th of each month, for example
  const day = check.getUTCDate();
  return day === 1 || day === 15;
```

### 3. Update the client enum

In `client/src/types.ts`:

```typescript
export enum Interval {
  // ... existing values ...
  SEMIMONTHLY = "SEMIMONTHLY",
}
```

### 4. Update forms

The `EntryForm` component renders interval options. Add the new value to the interval dropdown.

### 5. Update spreadsheet validation

In `server/src/routes/spreadsheet.ts`, the `VALID_INTERVALS` constant is derived from `Object.values(Interval)`, so it picks up new enum values automatically. No changes needed here.

## Modifying the Projection Engine

The projection engine is in `server/src/routes/projections.ts`. Key modification points:

### Adding a new event type

If you need events beyond "income" and "expense":

1. Update the `ProjectionEvent` interface:

```typescript
interface ProjectionEvent {
  type: "income" | "expense" | "adjustment";
  name: string;
  amount: number;
  category?: string;
}
```

2. Add processing logic in `applyDay()`, following the pattern of existing income/expense processing.

3. Update the client `ProjectionEvent` type in `client/src/types.ts`.

4. Update chart components to handle the new event type.

### Changing balance calculation

The balance is computed in `applyDay()` (line 110). Income adds, expenses subtract:

```typescript
balance += source.amount;   // income
balance -= amount;           // expense
```

After all events, the balance is rounded:

```typescript
return { balance: Math.round(balance * 100) / 100, events };
```

### Adding data sources to projections

To include a new data source (e.g., recurring adjustments), add it to the parallel fetch in the route handler (around line 213):

```typescript
const [incomeSources, expenses, rawTransfers, newSource] = await Promise.all([
  prisma.incomeSource.findMany({ where: { accountId } }),
  // ... existing queries ...
  prisma.newModel.findMany({ where: { accountId } }),
]);
```

Then pass the new data to `applyDay()` and add processing logic there.

## Adding a New Prisma Model

1. Define the model in `server/prisma/schema.prisma`.
2. Run `make db-push` to create the table.
3. Create or modify a route file to expose CRUD endpoints.
4. Add the client type in `client/src/types.ts`.
5. Add API functions in `client/src/api.ts`.
6. Add UI components as needed.
7. If the data should be exportable, update `server/src/routes/spreadsheet.ts` to include a new sheet.

**Real-world example -- ActualSpend:** The `ActualSpend` model follows this pattern exactly. It was added as a new Prisma model with an optional foreign key to `PlannedExpense` (`forecastExpenseId`, `onDelete: SetNull`). A new route file (`server/src/routes/actuals.ts`) provides account-scoped CRUD with ownership validation and category inheritance from the linked forecast. The client gained an `ActualSpend` type, four API functions (`getActuals`, `createActual`, `updateActual`, `deleteActual`), and the `ActualSpendList` component. The projection engine was updated to fetch actuals, build an `actualsMap` by date, and skip forecast expenses that are covered by linked actuals. See [Projections Engine -- Actual Spending Integration](projections-engine.md#actual-spending-integration) for the engine changes.

## Checklist for Any Feature

- [ ] Schema change applied (`make db-push`)
- [ ] Server route handles the new data
- [ ] Client type updated in `types.ts`
- [ ] API function added in `api.ts`
- [ ] UI component renders and accepts the data
- [ ] Spreadsheet export/import updated (if applicable)
- [ ] TypeScript compiles cleanly (`make typecheck`)
