# Actual Spending

Actual spending entries let you record real transactions as they happen -- the amount you actually paid, not what you planned to pay. When you link an actual to a forecast expense, the projection engine uses the real amount instead of the estimate, so your balance chart reflects reality.

## Why Use Actual Spending

Forecasts are estimates. Your weekly grocery bill might be budgeted at $100, but some weeks you spend $80 and others $130. By recording actuals:

- Your projection chart shows what really happened on past days instead of what was planned.
- You can compare actual spending against forecasts to spot patterns of over- or under-spending.
- Future forecast amounts remain unchanged, so the projection still estimates ahead while grounding the past in real data.

## The Actual Spending Panel

The Actual Spending panel appears below the Forecast Income and Forecast Expenses grid. It has an amber (warning) color theme to visually distinguish it from forecast panels.

- The panel starts **collapsed** by default.
- Click the panel title ("Actual Spending") to expand it.
- Click the title again to collapse it.

## Adding an Actual Spending Entry

1. Expand the Actual Spending panel and click **+ Add**.
2. Fill in the form fields:
   - **Date**: The date the transaction occurred. Defaults to today.
   - **Amount ($)**: The dollar amount you actually spent.
   - **Note** (optional): A description or memo (e.g., "Groceries at Costco", "Electric bill was higher this month").
   - **Linked Forecast Expense** (optional): Select a forecast expense from the dropdown to link this actual to it. The dropdown shows all active expenses with their name, interval, and amount. See the Linking to Forecast Expenses section below.
   - **Category** (optional): Assign a category. If you select a linked forecast expense that has a category, the category is inherited automatically.
3. Click **Add** to save.

The entry appears in the Actual Spending panel, grouped by date.

## How Actuals Are Displayed

Actual spending entries are grouped by date, with the newest dates first. Each entry shows:

- The dollar amount.
- The note, if one was entered.
- A badge showing the linked forecast expense name, if linked.
- A category badge, if a category is assigned.

## Linking to Forecast Expenses

Linking is the key feature that connects actual spending to your projections. When you link an actual to a forecast expense, you are telling the system "this is what I really paid for that planned expense."

### What the Dropdown Shows

The **Linked Forecast Expense** dropdown lists all active expenses in the current account. Each option shows:

- The expense name
- The interval (e.g., Weekly, Monthly)
- The forecasted amount

### What Linking Does

When an actual spending entry is linked to a forecast expense:

1. The projection engine checks whether the actual's date falls on a day that the linked expense would normally fire (based on its interval and start date).
2. If it does, the actual amount **replaces** the forecast amount for that specific occurrence.
3. If no actual exists for a forecast occurrence, the forecast fires at its normal amount.

### Category Inheritance

When you select a linked forecast expense that has a category assigned, the actual spending entry automatically inherits that category. You can override this by selecting a different category manually.

### Example

You have a forecast expense "Breakfast" set to $30/week, firing every Monday.

- **Monday, March 2**: You record an actual of $60 linked to "Breakfast". The projection shows $60 on that day instead of $30.
- **Monday, March 9**: No actual recorded. The projection shows the forecast amount of $30.
- **Monday, March 16**: You record an actual of $25 linked to "Breakfast". The projection shows $25.

Future Mondays beyond your recorded actuals continue to use the $30 forecast.

## How Actuals Affect Projections

The replacement logic follows these rules:

- **Linked actual on a forecast day**: The actual amount replaces the forecast amount for that single occurrence. The forecast is not fired.
- **Linked actual on a non-forecast day**: The actual is included as a standalone expense on that day. The forecast schedule is not affected.
- **Unlinked actual**: The actual appears as an independent expense in the projection on its date. No forecast is modified.
- **Future forecast occurrences**: Always use the forecast amount unless an actual is recorded for that specific date.

> **Note:** Actuals only affect the specific day they are recorded on. Recording an actual for one week does not change the forecast for any other week.

## Editing an Actual

1. Find the entry in the Actual Spending panel.
2. Click the **Edit** button on its row.
3. The row changes into an edit form with current values pre-filled.
4. Make your changes.
5. Click **Update** to save, or **Cancel** to discard.

## Deleting an Actual

1. Find the entry in the Actual Spending panel.
2. Click the **Del** button on its row.

The entry is removed immediately. The projection reverts to using the forecast amount for that day (if the actual was linked to a forecast expense).

## Visual Indicators

Actual spending entries are visually distinct in both the chart and the ledger so you can tell them apart from forecast transactions at a glance.

### In the Projection Chart

When you hover over a day in the projection chart, the tooltip lists all events for that day. Actual spending entries appear in **amber** with an **"actual" badge** next to the description, distinguishing them from forecast entries.

### In the Ledger

In the ledger table, actual spending entries have:

- An **amber dot** next to the description (instead of the standard green or red dot).
- An **"actual" badge** in the Description column.

These indicators appear regardless of whether the actual is linked to a forecast or standalone.

## Tips

### When to Record Actuals

Focus on expenses where the real amount varies from the forecast. Fixed bills that always match (rent, fixed-rate subscriptions) do not need actuals -- the forecast is already accurate.

Good candidates for actuals:

- Groceries and dining
- Utility bills that fluctuate
- Gas and transportation
- Entertainment and discretionary spending

### How Often to Record

Record actuals as frequently as suits your workflow. Some approaches:

- **Daily**: Log each transaction as it happens for maximum accuracy.
- **Weekly**: Review your bank statement once a week and batch-enter actuals.
- **As-needed**: Only record actuals for expenses that deviate significantly from forecasts.

### Linked vs. Unlinked Actuals

- **Link an actual** when the transaction corresponds to a specific forecast expense. This replaces the forecast in the projection and gives you a direct comparison.
- **Leave an actual unlinked** when the transaction is a one-off purchase or does not match any forecast. The actual still appears in the projection as a standalone expense.

> **Tip:** If you find yourself frequently recording unlinked actuals for the same type of purchase, consider creating a forecast expense for it. This gives you better projections and a baseline to compare against.
