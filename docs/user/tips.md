# Tips and Workflows

This page covers practical techniques, what-if analysis, and common workflows to get the most out of Budget Tracker.

## What-If Analysis with Toggles

One of the most useful features is the ability to temporarily exclude income or expenses from your projections to see how changes affect your forecast.

### How It Works

Every income source and expense has a toggle (checkbox) on its row. When you turn an item off:

- It is immediately excluded from the projection calculations.
- All charts and the ledger update instantly to show the new forecast.
- The change is **not saved to the database** -- it is a temporary override for exploration purposes.

### What-If Override vs. Database Toggle

There are two different ways an item can be toggled:

| Action | Persistence | Purpose |
|--------|-------------|---------|
| Clicking the toggle switch | Saved to database | Permanently pause an income/expense |
| What-if override | Temporary, resets on account switch | Explore scenarios |

> **Note:** When you switch accounts, all what-if overrides reset. Your items return to their saved active/inactive state.

### Example Scenarios

**"What if I cancel my gym membership?"**
1. Find the gym expense and toggle it off.
2. Watch the projection chart update to show your balance without that expense.
3. Toggle it back on when you are done exploring.

**"What if I get a raise?"**
1. Edit your salary income to the new amount temporarily, or add a second income source for the raise amount.
2. Compare the projections.

**"What if I delay a large purchase?"**
1. Toggle off the one-time expense to see your balance without it.
2. Check if the timing works better in a different month.

## Date Range Selection Tips

### Quick Comparisons

Switch between preset ranges to get different perspectives:

- **30d**: See the immediate short-term picture. Good for checking if you will make it to next payday.
- **90d**: A solid medium-term view. Good for planning the next quarter.
- **1yr**: The big picture. Good for seeing seasonal patterns and long-term trends.

### Custom Ranges for Specific Periods

Use the custom date range to focus on specific periods:

- Select a single month to see that month's activity in detail.
- Use the multi-month shortcuts (2mo, 3mo, 6mo) for quarter or half-year planning.
- Set manual dates to align with your fiscal year, lease term, or any custom period.

## Collapsible Panels

Both the Forecast Income and Forecast Expenses panels can be collapsed by clicking their titles.

- When collapsed, each panel shows its title and the total active amount for the current calendar month (e.g., "$4,500.00 this month"). This total counts how many times each item fires during the month based on its interval and start date.
- This is useful when you want to focus on the charts or ledger without scrolling past long lists of items.
- Click the title again to expand and see all entries.

## Updating Your Balance

Your starting balance is the foundation for all projections. Keep it accurate:

1. Click the balance display in the top-right corner of the navigation bar.
2. Enter your current actual balance.
3. Click **Save**.

> **Tip:** Update your balance regularly (weekly or after any large transaction) to keep projections aligned with reality. The projections calculate forward from whatever balance you have set, so an outdated balance makes all future projections inaccurate.

## Common Workflows

### Monthly Budget Review

1. Set the date range to the current month (use Custom and select the month).
2. Switch to the **Spending by Category** chart to see where money is going.
3. Switch to the **Ledger** view and filter by **Expenses** to review each transaction.
4. Check the summary statistics at the top of the ledger for totals.

### Paycheck-to-Paycheck Planning

1. Set a **30-day** or custom range covering your next pay period.
2. Use the **Projection** chart to see if your balance stays positive.
3. If the line dips below zero, try toggling off non-essential expenses to find what to defer.

### Saving Toward a Goal

1. Create a separate account for your savings goal (see [Accounts](accounts.md)).
2. Set up a transfer from your checking account (see [Transfers](transfers.md)).
3. View the savings account and switch to the **Projection** chart to see when you will reach your goal amount.
4. Experiment with different transfer amounts using what-if analysis.

### Handling Variable Bills

For expenses that change in amount (utilities, insurance with annual adjustments):

1. When creating the expense, enable the **Variable price** toggle.
2. After saving, expand the price schedule and add adjustments for known future amounts.
3. The projections automatically use the correct amount for each date.

See [Expenses - Variable Pricing](expenses.md#variable-pricing) for step-by-step details.

### Preparing for Large Expenses

1. Add the large expense as a one-time expense on the expected date.
2. Check the **Projection** chart to see how it affects your balance.
3. If the balance goes negative, consider:
   - Adjusting the date
   - Setting up a savings transfer to build up funds
   - Toggling off other expenses to see what is flexible

### Comparing Account Performance

1. Switch between accounts using the dropdown in the navbar.
2. Use the **Cash Flow** chart on each account to compare monthly surpluses and deficits.
3. Use the **Income vs Expenses** chart to see which account is healthiest.

## Tracking Actual Spending vs. Forecast

Once your forecast is set up, you can record actual spending as real transactions hit your bank account. This lets the projection chart reflect reality instead of estimates.

### Recording Actuals as They Happen

1. When you see a charge on your bank statement, open the **Actual Spending** panel (the amber panel below the income/expenses grid).
2. Click **+ Add** and enter the date, amount, and an optional note.
3. If the charge corresponds to a forecast expense, select it from the **Linked Forecast** dropdown. The category is inherited automatically.
4. Click **Add** to save.

### Reading the Projection with Actuals

When an actual spending entry is linked to a forecast expense and falls on a day that expense would fire, the projection uses the actual amount instead of the forecast. On the chart, these entries appear in amber with an "actual" badge in the tooltip. In the ledger, they have an amber dot and badge.

Future occurrences of the same forecast expense are unaffected -- they continue to use the forecast amount until you record another actual.

### Spotting Over- and Under-Spending

Compare actuals to their linked forecasts to identify patterns:

- If your actuals are consistently higher than the forecast, consider updating the forecast amount to improve accuracy.
- If your actuals come in lower, your projection is conservative -- your real balance will be higher than shown.
- Unlinked actuals (one-off purchases with no forecast) still appear in the projection as standalone expenses, so nothing is missed.

> **Tip:** You do not need to record every transaction as an actual. Focus on variable or unpredictable expenses where the forecast amount is an estimate. Fixed bills like rent or subscriptions that always match the forecast amount do not need actuals.

See [Actual Spending](actual-spending.md) for the complete guide.

## Working with the Spreadsheet

For bulk operations, use the export/import workflow:

1. **Export** your current data.
2. Make all changes in Excel or Google Sheets.
3. **Import** the modified file.

This is faster than editing many items one by one in the app. See [Spreadsheet Import/Export](spreadsheet.md) for complete details.
