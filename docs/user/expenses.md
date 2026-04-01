# :credit_card: Expenses

Everything you need to know about adding, editing, and managing your planned expenses.

Expenses represent money going out of an account. These can be recurring bills, one-time purchases, subscriptions, or any planned spending.

---

## Adding an Expense

1. In the **Forecast Expenses** panel (right side, below the chart), click **+ Add**.
2. Fill in the form fields:
   - **Name**: A descriptive label (e.g., "Rent", "Netflix", "Car Insurance").
   - **Amount ($)**: The dollar amount per occurrence.
   - **Interval**: How often this expense recurs. See [Income - Understanding Intervals](income.md#understanding-intervals) for the full list (One Time, Daily, Weekly, Biweekly, Monthly, Quarterly, Yearly).
   - **Start Date**: When this expense begins. Defaults to today.
   - **End Date** (optional): When this expense stops recurring. Leave blank for ongoing expenses.
   - **Variable price** (optional): Check this if the amount changes over time. See the Variable Pricing section below.
   - **Transfer to another account** (optional): Check this to mark the expense as a transfer. See [Transfers](transfers.md).
   - **Category** (optional): Assign a category to organize this expense. See [Categories](categories.md).
3. Click **Add** to save.

---

## Editing an Expense

1. Find the expense in the Forecast Expenses panel.
2. Click the **Edit** button on its row.
3. The row changes into an edit form with current values pre-filled.
4. Make your changes.
5. Click **Update** to save, or **Cancel** to discard.

---

## Deleting an Expense

1. Find the expense in the Forecast Expenses panel.
2. Click the **Del** button on its row.

The item is removed immediately without a confirmation prompt.

---

## Toggling Active/Inactive

Each expense has a toggle switch on the left side of its row.

- **Active (on)**: The expense is included in projections. The row appears at full opacity.
- **Inactive (off)**: The expense is excluded from projections. The row appears faded.

Like income toggles, this change is saved to the database and persists across sessions.

---

## How Expenses Are Grouped

Expenses are organized into collapsible category groups in the panel:

- Each category appears as a header row with a color dot, the category name, a count of active items (e.g., "3/5"), and the total dollar amount of active items.
- Click a category header to expand or collapse the group and see its individual expenses.
- Expenses without a category appear under "Uncategorized" at the bottom.
- Expenses marked as transfers are grouped under "Transfer To [Account Name]."

### Quick Color Change

Each category header has a small color circle on the right side. Click it to open a color picker and change that category's color without opening the full category management modal.

---

## Variable Pricing

Some expenses change in amount over time. For example, your electric bill might be higher in summer and lower in winter, or your rent might increase after a lease renewal.

### Setting Up Variable Pricing

1. When adding or editing an expense, check the **Variable price** toggle.
2. Save the expense. The initial amount you entered becomes the **base price**.
3. After saving, a **Prices** button appears on the expense row.

### Adding Price Adjustments

1. Click the **Prices** button on a variable expense to expand the price schedule.
2. You will see the base price listed at the top.
3. Click **+ Add price change**.
4. Fill in:
   - **From**: The date this new price takes effect.
   - **Amount ($)**: The new dollar amount starting from that date.
   - **Note** (optional): A reason for the change (e.g., "Lease renewal", "Summer rate").
5. Click **Save**.

You can add multiple price adjustments. They are displayed in chronological order.

### How Price Adjustments Work in Projections

The projection engine uses the most recent price adjustment that applies to each date:

- Before any adjustment dates, the base price is used.
- On and after an adjustment date, that adjustment's amount is used.
- If a later adjustment exists, it takes effect on its start date.

For example, if your base price is $100, you add an adjustment to $120 starting June 1, and another to $130 starting September 1, then the projections will show $100 before June 1, $120 from June 1 through August 31, and $130 from September 1 onward.

### Removing a Price Adjustment

In the price schedule, click the **x** button next to any adjustment to remove it. The base price remains unaffected.

---

## End Dates

If an expense has an end date, it stops appearing in projections after that date. The end date is shown on the expense row as "ends [date]."

This is useful for:

- Subscriptions you plan to cancel on a specific date
- Loan payments with a known payoff date
- Temporary expenses like a rental while traveling

---

## Linking to Actual Spending

Expenses can be linked to actual spending entries. When you record a real transaction in the Actual Spending panel and select a forecast expense from the dropdown, that actual amount replaces the forecast amount in the projection for that day. This lets your chart reflect what you really spent instead of what you planned to spend. See [Actual Spending](actual-spending.md) for full details.

---

## Collapsible Panel

The Forecast Expenses panel works the same way as the income panel:

- Click the title ("Forecast Expenses") to collapse or expand.
- When collapsed, the panel shows the total of all active expenses for the current calendar month (labeled "this month"). This total reflects how many times each expense actually fires during the month based on its interval and start date, rather than simply summing the per-occurrence amounts.

For example, a $30/week expense that fires four times in the current month displays as approximately $120, not $30.

---

## See Also

- [Income](income.md) -- Managing the income side of your budget
- [Categories](categories.md) -- Organizing expenses into groups with custom colors
- [Actual Spending](actual-spending.md) -- Recording real transactions and comparing to forecasts
- [Transfers](transfers.md) -- Marking an expense as a transfer to another account
- [Tips and Workflows](tips.md) -- Variable bill handling and what-if scenarios
