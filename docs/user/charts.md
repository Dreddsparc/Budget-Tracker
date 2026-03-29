# Charts

Budget Tracker includes five chart types, each offering a different perspective on your financial data. Switch between them using the dropdown menu next to the Charts/Ledger toggle at the top of the page.

## Switching Chart Types

1. Make sure you are in **Charts** mode (the Charts tab should be active in the toggle at the top).
2. Use the dropdown menu next to the toggle to select a chart type:
   - Projection
   - Spending by Category
   - Income vs Expenses
   - Cash Flow
   - Expense Trends

All charts respect the currently selected date range. See the Date Range section at the bottom of this page for how to change it.

---

## Projection Chart

**What it shows:** Your projected account balance over time, plotted day by day as an area chart.

**When to use it:** This is the default chart and the most commonly used view. Use it to answer "What will my balance look like over the next X days?"

**How to read it:**

- The horizontal axis is time (days).
- The vertical axis is your account balance in dollars.
- The filled area shows your balance trajectory.
- A green fill indicates a positive balance. A red fill indicates you are below zero.
- A horizontal reference line at **$0** makes it easy to see when you might go negative.
- The line color changes based on the expense category that dominates your spending, giving you a visual cue about what is driving your balance changes.

**Interacting with it:**

- Hover over any point on the chart to see a tooltip with the exact date, balance, and a list of all income and expense events for that day.

---

## Spending by Category Chart

**What it shows:** A donut (ring) chart breaking down your total expenses by category over the selected date range.

**When to use it:** Use it to understand where your money is going. Helpful for identifying your largest spending categories and finding areas to cut back.

**How to read it:**

- Each colored segment represents one expense category.
- Segments are sorted by amount, largest first.
- Each segment shows its percentage of total spending.
- Categories use the colors you have assigned (see [Categories](categories.md)).

**Interacting with it:**

- Hover over any segment to see a tooltip with the category name, dollar amount, and percentage.

---

## Income vs Expenses Chart

**What it shows:** Monthly grouped bar chart comparing total income against total expenses.

**When to use it:** Use it to compare your earnings to your spending month by month. Helpful for spotting months where expenses exceed income.

**How to read it:**

- Each month has two bars side by side.
- **Green bars** represent total income for that month.
- **Red bars** represent total expenses for that month.
- The height of each bar corresponds to the dollar amount.

**Interacting with it:**

- Hover over any bar to see a tooltip showing the month, income total, expense total, and net amount (income minus expenses).

---

## Cash Flow Chart

**What it shows:** Monthly net cash flow as vertical bars, plus a running cumulative total.

**When to use it:** Use it to see which months you have a surplus and which months you have a deficit. The cumulative line shows whether you are trending up or down over time.

**How to read it:**

- Each bar represents the net cash flow for one month (income minus expenses).
- **Green bars** indicate a surplus (you earned more than you spent).
- **Red bars** indicate a deficit (you spent more than you earned).
- A cumulative total is also shown, so you can see the overall trend.

**Interacting with it:**

- Hover over any bar to see the exact net amount for that month.

---

## Expense Trends Chart

**What it shows:** A stacked area chart of your expenses over time, broken down by category and smoothed into weekly intervals.

**When to use it:** Use it to see how your spending patterns change over time. Helpful for identifying seasonal patterns or trends in specific categories.

**How to read it:**

- The horizontal axis is time (in weekly intervals).
- Each colored area represents one expense category, stacked on top of each other.
- The total height at any point shows your total weekly spending.
- Categories use their assigned colors.
- Weekly smoothing reduces the noise of daily fluctuations, making trends easier to spot.

**Interacting with it:**

- Hover over any point to see the breakdown by category for that week.

---

## Date Range

All charts and the ledger share the same date range. You control it using the bar at the top of the page, below the Charts/Ledger toggle.

### Preset Ranges

Click one of the preset buttons to quickly set a range starting from today:

| Button | Range |
|--------|-------|
| 30d | 30 days |
| 60d | 60 days |
| 90d | 90 days (default) |
| 6mo | 6 months (180 days) |
| 1yr | 1 year (365 days) |

### Custom Range

1. Click the **Custom** button.
2. A panel expands with several options:
   - **Month picker**: Select a specific month from a dropdown (ranges from 3 months ago to 12 months ahead).
   - **Multi-month shortcuts**: Click 2mo, 3mo, or 6mo to select that many months starting from the current start date.
   - **Manual date inputs**: Type or pick specific From and To dates.
3. Click **Apply** (for manual date inputs) or simply select a month/shortcut to apply immediately.

When a custom range is active and the custom panel is closed, the selected date range is displayed as text (e.g., "Mar 1, 2026 -- May 31, 2026").
