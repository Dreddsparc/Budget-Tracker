# Income

Income sources represent money coming into an account. This could be a salary, freelance payments, rental income, or any other regular or one-time payment you expect to receive.

## Adding an Income Source

1. In the **Forecast Income** panel (left side, below the chart), click **+ Add**.
2. Fill in the form fields:
   - **Name**: A descriptive label (e.g., "Salary", "Side Gig", "Tax Refund").
   - **Amount ($)**: The dollar amount you receive each time.
   - **Interval**: How often you receive this income (see intervals below).
   - **Start Date**: The first date this income occurs. Defaults to today.
3. Click **Add** to save.

The new income source appears in the list, and all charts and the ledger update immediately.

## Understanding Intervals

The interval determines how often an income source repeats in your projections:

| Interval | Meaning |
|----------|---------|
| One Time | Occurs only once, on the start date |
| Daily | Every day |
| Weekly | Every 7 days |
| Biweekly | Every 14 days |
| Monthly | Once per month, on the same day of the month |
| Quarterly | Every 3 months |
| Yearly | Once per year |

> **Tip:** For a paycheck you receive every two weeks, use **Biweekly**. For a paycheck on the 1st and 15th of each month, create two separate Monthly income entries.

## Editing an Income Source

1. Find the income source in the Forecast Income panel.
2. Click the **Edit** button on its row.
3. The row changes into an edit form with the current values pre-filled.
4. Make your changes.
5. Click **Update** to save, or **Cancel** to discard.

## Deleting an Income Source

1. Find the income source in the Forecast Income panel.
2. Click the **Del** button on its row.

The item is removed immediately. There is no confirmation prompt, so be sure before clicking.

## Toggling Active/Inactive

Each income source has a toggle switch on the left side of its row.

- **Active (on)**: The income is included in projections. The row appears at full opacity.
- **Inactive (off)**: The income is excluded from projections. The row appears faded.

Toggling is saved to the database -- it persists across sessions and devices. This is different from what-if overrides (see [Tips and Workflows](tips.md)), which are temporary.

> **Tip:** Use the toggle to "pause" an income source you expect to resume later, rather than deleting it and recreating it.

## Incoming Transfers

If another account has a transfer set up that sends money to the account you are currently viewing, those transfers appear at the bottom of the Forecast Income panel under a heading like "Transfer from Checking."

- Incoming transfers are **read-only**. You cannot edit or delete them from the receiving account.
- They are grouped by the source account name.
- Each transfer shows its name, amount, and interval.
- The group header shows the total amount from that source.

To modify or remove an incoming transfer, switch to the source account and edit or delete the expense that created it. See [Transfers](transfers.md) for details.

## Collapsible Panel

The Forecast Income panel can be collapsed to save screen space.

- Click the panel title ("Forecast Income") to collapse or expand it.
- When collapsed, the panel shows just the title and a summary of the total active income amount per month.
- Click the title again to expand and see all income sources.
