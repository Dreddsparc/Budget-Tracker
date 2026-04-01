# :left_right_arrow: Transfers

Your guide to moving money between accounts and keeping both sides of the ledger in sync.

Transfers let you move money between accounts. A transfer is an expense in the source account and automatic income in the target account, keeping both projections accurate.

---

## Setting Up a Transfer

Transfers are created as expenses with the transfer option enabled.

1. Go to the account you want to transfer money **from** (the source account).
2. In the **Forecast Expenses** panel, click **+ Add**.
3. Fill in the form:
   - **Name**: A label for the transfer (e.g., "Savings Transfer", "Emergency Fund").
   - **Amount ($)**: The dollar amount to transfer each time.
   - **Interval**: How often the transfer occurs (Monthly, Biweekly, etc.).
   - **Start Date**: When the transfers begin.
   - **End Date** (optional): When the transfers stop.
4. Check the **Transfer to another account** toggle.
5. A dropdown appears -- select the target account.
6. Click **Add**.

> **Note:** The transfer toggle only appears if you have more than one account. If you do not see it, create another account first (see [Accounts](accounts.md)).

---

## How Transfers Appear

Transfers show up differently depending on which account you are viewing.

### In the Source Account

The transfer appears as a normal expense in the Forecast Expenses panel:

- It is grouped under "Transfer To [Target Account Name]."
- It displays a blue "Transfer" badge with an arrow and the target account name.
- It is subtracted from the source account's projected balance like any other expense.
- You can edit, delete, and toggle it like any other expense.

### In the Target Account

The transfer appears as **read-only income** in the Forecast Income panel:

- It is grouped under a "Transfer from [Source Account Name]" heading.
- Each transfer shows its name, amount, and interval.
- It is labeled "read-only" because you can only modify it from the source account.
- It is added to the target account's projected balance like any other income.

### The Naming Convention

In the target account's projections (charts and ledger), transfers appear with a shortened name that includes the month abbreviation:

**[Transfer Name]-[Month Abbreviation]**

For example, if you create a monthly transfer named "Savings Transfer" in your checking account targeting your savings account:

- In the **checking** account ledger, it appears as "Savings Transfer" (expense).
- In the **savings** account ledger, it appears as "Savings Transfer-Apr", "Savings Transfer-May", etc. (income).

This naming convention helps you identify which month each transfer occurrence belongs to when browsing the target account.

---

## Transfers and Charts

Transfers affect the Projection chart and Ledger (they change your account balance), but they are **excluded** from the spending analysis charts:

- **Spending by Category** -- transfers do not appear in the pie chart
- **Income vs Expenses** -- transfers are not counted in the expense bars
- **Cash Flow** -- transfers are not counted in the expense side of the net calculation
- **Expense Trends** -- transfers do not appear in the category breakdown

> **Note:** This is because transfers are not real spending -- they are money moving between your own accounts. The spending charts show only actual expenses.

---

## Editing a Transfer

To change a transfer's amount, interval, or other details:

1. Switch to the **source account** (the account the money comes from).
2. Find the transfer in the Forecast Expenses panel.
3. Click **Edit** and make your changes.
4. Click **Update**.

Changes are reflected in both the source and target account projections.

---

## Deleting a Transfer

1. Switch to the **source account**.
2. Find the transfer in the Forecast Expenses panel.
3. Click **Del**.

The transfer is removed from both accounts -- it no longer appears as an expense in the source or as income in the target.

---

## Toggling a Transfer

You can toggle a transfer on or off using the switch on its row in the source account. When toggled off:

- The transfer is excluded from the source account's projections.
- The corresponding income in the target account is also excluded.

---

## Common Transfer Scenarios

### Automatic Savings

Set up a monthly transfer from checking to savings to model your savings plan:

- Source: Checking
- Target: Savings
- Name: "Monthly Savings"
- Amount: $500
- Interval: Monthly

### Paying Yourself from a Business Account

If you pay yourself from a business account:

- Source: Business
- Target: Personal Checking
- Name: "Owner Draw"
- Amount: $3,000
- Interval: Biweekly

### Temporary Transfers

Use an end date for transfers that should stop at a known point:

- Example: Funding a vacation account with $200/month until December
- Set the end date to December 31

---

## See Also

- [Accounts](accounts.md) -- Creating the accounts you transfer between
- [Expenses](expenses.md) -- Transfers are created as expenses with a special toggle
- [Income](income.md) -- How incoming transfers appear in the target account
- [Charts](charts.md) -- How transfers are excluded from spending analysis charts
