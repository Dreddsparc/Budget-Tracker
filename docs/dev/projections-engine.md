# Projections Engine

The projections engine is the core feature of Budget Tracker. It simulates a day-by-day balance starting from the most recent balance snapshot, applying income and expense events based on their configured intervals.

**Source:** `server/src/routes/projections.ts`

## Overview

The projection pipeline:

1. Parse query parameters (date window, overrides).
2. Fetch the latest balance snapshot, all income sources, all expenses (with price adjustments), and incoming transfers -- in parallel.
3. Apply overrides to income and expense `active` states.
4. If the window starts after today, simulate from today to `windowStart` to get the correct starting balance (events are not recorded for this gap).
5. Iterate day-by-day from `windowStart` to `windowEnd`, calling `applyDay()` for each date.
6. Return the `ProjectionDay[]` array.

## Data Types

```typescript
interface ProjectionEvent {
  type: "income" | "expense";
  name: string;
  amount: number;
  category?: string;
}

interface ProjectionDay {
  date: string;           // "YYYY-MM-DD"
  balance: number;        // Running balance after all events on this day
  events: ProjectionEvent[];
}

interface Override {
  id: string;
  active: boolean;
}
```

## Date Window Computation

The engine supports two query modes:

**Preset (days):**
```
GET /api/accounts/:id/projections?days=90
```
`windowStart` = today (UTC midnight), `windowEnd` = today + (days - 1). The `days` parameter is capped at `365 * 2` (730 days), defaulting to 90 if not provided or invalid.

**Custom range:**
```
GET /api/accounts/:id/projections?startDate=2026-06-01&endDate=2026-12-31
```
Both dates are parsed as UTC midnight. The window is still capped at 730 days from `windowStart`.

**Future window handling (lines 262-269):** If `windowStart` is after today, the engine must simulate the gap between today and `windowStart` to compute what the balance would be on that date. It runs `applyDay()` for each day in the gap but does not record those days in the output array.

## matchesInterval

**Signature:** `matchesInterval(interval: Interval, startDate: Date, checkDate: Date): boolean`

Determines whether a given `checkDate` is an occurrence date for an event with the given `interval` and `startDate`. All date comparisons are UTC-normalized to midnight.

**Pre-check (line 45):** If `checkDate < startDate`, always returns `false`.

### ONE_TIME
```typescript
return diffDays === 0;
```
Fires only on the exact start date.

### DAILY
```typescript
return true;
```
Fires every day from the start date onward (the pre-check already excludes dates before start).

### WEEKLY
```typescript
return diffDays % 7 === 0;
```
Fires every 7 days from the start date. Uses the day difference, so it fires on the same weekday.

### BIWEEKLY
```typescript
return diffDays % 14 === 0;
```
Fires every 14 days from the start date.

### MONTHLY
```typescript
return check.getUTCDate() === start.getUTCDate();
```
Fires on the same day-of-month. For example, if start is the 15th, it fires on the 15th of every subsequent month.

**Edge case:** If the start date is the 31st, this will not fire in months with fewer than 31 days (February, April, etc.). The engine does not attempt end-of-month clamping.

### QUARTERLY
```typescript
if (check.getUTCDate() !== start.getUTCDate()) return false;
const monthDiff = (check.getUTCFullYear() - start.getUTCFullYear()) * 12
                + (check.getUTCMonth() - start.getUTCMonth());
return monthDiff >= 0 && monthDiff % 3 === 0;
```
Same day-of-month AND the month difference from start is a multiple of 3. Both conditions must hold.

### YEARLY
```typescript
return check.getUTCMonth() === start.getUTCMonth()
    && check.getUTCDate() === start.getUTCDate();
```
Same month and day-of-month. Does not check year difference beyond the pre-check (the start date must be on or before the check date).

**Edge case for Feb 29:** A yearly event starting on Feb 29 will only fire in leap years.

## getEffectiveAmount

**Signature:** `getEffectiveAmount(item, currentDate): number`

For variable expenses, determines the effective amount on a given date by iterating through price adjustments sorted by `startDate` ascending.

```typescript
function getEffectiveAmount(item, currentDate) {
  if (!item.isVariable || item.priceAdjustments.length === 0) {
    return item.amount;  // Use the base amount
  }
  let effectiveAmount = item.amount;
  for (const adj of item.priceAdjustments) {
    // UTC-normalize both dates
    if (adjDate <= checkDate) {
      effectiveAmount = adj.amount;
    } else {
      break;  // Adjustments are sorted; no need to check further
    }
  }
  return effectiveAmount;
}
```

**How it works:** The function walks through adjustments in chronological order. Each adjustment whose `startDate` is on or before `currentDate` becomes the new effective amount. The `break` on a future adjustment is an optimization since the list is sorted ascending.

**Example:** An expense with base amount $100 and adjustments:
- Jan 1: $110
- Apr 1: $120

On March 15, `getEffectiveAmount` returns $110. On April 1, it returns $120.

## applyDay

**Signature:** `applyDay(currentDate, runningBalance, effectiveIncome, effectiveExpenses, incomingTransfers): { balance, events }`

Processes all events for a single day and returns the updated balance and event list.

### Processing Order

1. **Regular income** -- iterates `effectiveIncome`, checks `active` and `matchesInterval`.
2. **Incoming transfers** -- iterates `incomingTransfers`, checks `active`, `endDate`, and `matchesInterval`. Uses `getEffectiveAmount` since transfers can be variable.
3. **Expenses** -- iterates `effectiveExpenses`, checks `active`, `endDate`, and `matchesInterval`. Uses `getEffectiveAmount`.

Income and incoming transfers add to the balance. Expenses subtract from the balance.

### Balance Rounding

The returned balance is rounded to 2 decimal places to avoid floating-point drift:

```typescript
return { balance: Math.round(balance * 100) / 100, events };
```

## Transfer Income Handling

Transfers are expenses in the source account that also appear as income in the target account. The projections endpoint queries incoming transfers with:

```typescript
prisma.plannedExpense.findMany({
  where: {
    transferToAccountId: accountId,  // This account is the target
    isTransfer: true,
    active: true,
    NOT: { accountId },              // Exclude self-transfers (shouldn't exist)
  },
  include: {
    priceAdjustments: { orderBy: { startDate: "asc" } },
    account: { select: { name: true } },
  },
})
```

Transfer events are named with a month abbreviation suffix:

```typescript
const eventName = `${transfer.name}-${MONTH_ABBR[currentDate.getUTCMonth()]}`;
// e.g., "Monthly savings contribution-Mar"
```

The category is set to identify the source:

```typescript
const categoryName = `Transfer from ${transfer.sourceAccountName}`;
```

## Override System

Overrides are client-side toggles that temporarily change the `active` state of income or expense items. They are passed as a JSON-encoded query parameter:

```
?overrides=[{"id":"abc-123","active":false}]
```

**Processing (lines 167-180):**
1. Parse the `overrides` JSON string.
2. Build a `Map<id, boolean>` for O(1) lookup.
3. Before the simulation loop, map over income and expense arrays, replacing `active` with the override value if the item's ID is in the map.

Overrides are not persisted. They exist only for the duration of the request.

**Client usage:** The override system enables what-if analysis. The user can toggle an income source or expense off in the UI without changing the database, and the chart immediately updates to show the projected impact.

## Edge Cases

### No balance snapshot
If no `BalanceSnapshot` exists for the account, the starting balance defaults to `0`.

### endDate on expenses
Expenses with an `endDate` stop firing after that date:
```typescript
if (expense.endDate && currentDate > expense.endDate) continue;
```
This check is performed inside `applyDay` for both expenses and incoming transfers.

### Monthly day-of-month overflow
A monthly expense starting on the 31st will not fire in February, April, June, September, or November. The engine compares `check.getUTCDate() === start.getUTCDate()` without adjustment.

### Leap year handling
A yearly event on Feb 29 will only fire in leap years. There is no fallback to Feb 28.

### UTC normalization
All dates are normalized to UTC midnight before comparison:
```typescript
const start = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
```
This prevents timezone-related issues where a date might be off by one day.

### Day difference calculation
Uses `Math.round` on the millisecond difference to handle DST edge cases:
```typescript
const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
```
Since all dates are UTC-normalized to midnight, this should always be exact, but `Math.round` provides a safety margin.
