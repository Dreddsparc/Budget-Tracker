# Ledger

The ledger provides a day-by-day table view of all projected transactions and balances. It is an alternative to the chart view, useful when you want to see exact numbers and specific transaction details.

## Switching to the Ledger

Click the **Ledger** tab in the toggle at the top of the page (next to the Charts tab). The chart area is replaced with the ledger table.

The ledger uses the same date range as the charts. Changing the date range (using the preset buttons or custom picker) updates both views.

## Summary Statistics

At the top of the ledger, four summary cards show key figures for the selected date range:

| Stat | What It Shows |
|------|---------------|
| **Total Income** | Sum of all income transactions, plus the number of income events |
| **Total Expenses** | Sum of all expense transactions, plus the number of expense events |
| **Net Cash Flow** | Income minus expenses. Green if positive, red if negative. Shows the time period. |
| **Ending Balance** | Your projected balance on the last day of the range. Shows the starting date for reference. |

## Reading the Table

The ledger table has five columns:

| Column | Description |
|--------|-------------|
| **Date** | The date of the transaction. Shown only on the first row of each day to reduce visual clutter. |
| **Description** | The name of the income or expense event. A small colored dot appears next to the name -- green for income, red for expense. Actual spending entries have an amber dot and an "actual" badge next to the description, distinguishing them from forecasted transactions. See [Actual Spending](actual-spending.md) for details. |
| **Income** | The dollar amount, shown only for income transactions (in green). |
| **Expense** | The dollar amount, shown only for expense transactions (in red). |
| **Balance** | The running projected balance as of that day. Green if positive, red if negative. |

### Days Without Events

When the "All Days" filter is active, days with no transactions still appear in the table as faded rows showing just the date and balance. This lets you see the balance on every day, even when nothing happens.

### Negative Balance Highlighting

If the balance goes negative on a particular row, that row gets a subtle red background tint to draw your attention.

## Filters

Below the summary statistics, a row of filter buttons lets you control which rows appear:

| Filter | What It Shows |
|--------|---------------|
| **All Days** | Every day in the range, including days with no events |
| **Events Only** | Only days that have at least one income or expense event |
| **Income** | Only income transactions |
| **Expenses** | Only expense transactions |

The active filter button appears highlighted. Click a different filter to switch.

## Search

Next to the filter buttons is a search field. Type a transaction name (or part of a name) to filter the table to only matching transactions. The search is case-insensitive.

The row count is displayed to the right of the search field, so you can see how many rows match your current filter and search.

> **Tip:** Combine filters with search for precise results. For example, select the "Expenses" filter and then search for "insurance" to see only insurance-related expenses.

## Scrolling

The ledger table has a fixed header that stays visible as you scroll through the rows. The table is scrollable both vertically (for long date ranges) and horizontally (on smaller screens).
