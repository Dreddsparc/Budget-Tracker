# Getting Started

This guide walks you through your first time using Budget Tracker, from opening the app to seeing your first balance projection.

## Installing Docker Desktop

Budget Tracker runs inside Docker, which means you do not need to install Node.js, PostgreSQL, or any other dependencies directly. Docker Desktop handles all of that for you in isolated containers.

### macOS

1. Go to [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) and click **Download for Mac**. Choose the Apple Silicon or Intel chip version to match your Mac (if you are unsure, click the Apple menu in the top-left corner of your screen, then **About This Mac** -- it will say "Apple M1/M2/M3" or "Intel").
2. Open the downloaded `.dmg` file and drag Docker into your Applications folder.
3. Open Docker Desktop from your Applications folder. You may be prompted to grant permissions -- click **OK** or **Allow** when asked.
4. Wait for the whale icon to appear in the menu bar at the top of your screen. When it stops animating, Docker is ready.

### Windows 11

1. **Enable WSL 2 first.** Open the Start menu, type **PowerShell**, right-click **Windows PowerShell**, and select **Run as administrator**. In the window that opens, type the following and press Enter:
   ```
   wsl --install
   ```
   When it finishes, restart your computer.

2. After restarting, go to [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) and click **Download for Windows**.
3. Run the installer. When you see the configuration options, make sure **Use WSL 2 based engine** is checked. Complete the installation.
4. Open Docker Desktop from your Start menu. Accept the service agreement when prompted.

### Verify Docker is working

Open a terminal (Terminal on macOS, PowerShell or Command Prompt on Windows) and run:

```bash
docker --version
```

You should see something like `Docker version 27.x.x`. If you get an error saying the command is not found, Docker Desktop may not be running -- open it from your Applications folder or Start menu and try again.

### Important

Docker Desktop must be running every time you use Budget Tracker. If you restart your computer, open Docker Desktop before running `make dev`. You will know it is ready when the whale icon appears in your menu bar (macOS) or system tray (Windows).

## What You Will Need

Before you start, have an approximate idea of:

- Your current account balance (checking, savings, or whichever account you want to track first)
- Your main income sources and how often they occur (weekly, biweekly, monthly, etc.)
- Your recurring expenses and their amounts

## Step 1: Open the App

Navigate to the Budget Tracker URL in your web browser. On first load, the app creates a default account for you and immediately asks you to set a balance.

## Step 2: Set Your Starting Balance

The first thing you will see is a prompt to enter your current balance. This is the foundation for all projections -- the app calculates future balances by adding income and subtracting expenses starting from this number.

1. Enter your current account balance in the field provided.
2. Click **Save**.

> **Tip:** Use your actual current balance, not a rounded number. The more accurate your starting point, the more useful your projections will be.

After saving, the balance appears in the top-right corner of the navigation bar. You can update it at any time by clicking on it.

## Step 3: Add Your First Income Source

The **Forecast Income** panel is on the left side below the chart area.

1. Click the **+ Add** button in the Forecast Income panel.
2. Fill in the form:
   - **Name**: A descriptive label (e.g., "Salary", "Freelance Work").
   - **Amount**: The dollar amount per occurrence.
   - **Interval**: How often you receive this income. Options are One Time, Daily, Weekly, Biweekly, Monthly, Quarterly, and Yearly.
   - **Start Date**: When this income begins (defaults to today).
3. Click **Add** to save.

Your income source now appears in the list, and the projection chart above updates immediately to reflect it.

## Step 4: Add Your First Expense

The **Forecast Expenses** panel is on the right side below the chart area.

1. Click the **+ Add** button in the Forecast Expenses panel.
2. Fill in the form:
   - **Name**: A descriptive label (e.g., "Rent", "Car Payment").
   - **Amount**: The dollar amount per occurrence.
   - **Interval**: How often this expense recurs.
   - **Start Date**: When this expense begins.
   - **End Date** (optional): When this expense stops. Leave blank for ongoing expenses.
   - **Category** (optional): Assign a category for organization. See [Categories](categories.md) for details.
3. Click **Add** to save.

## Step 5: Read Your Projection

After adding income and expenses, look at the projection chart at the top of the page. It shows your projected balance day by day, starting from today.

- The chart defaults to a **90-day** view.
- **Green areas** indicate a positive (above zero) balance.
- **Red areas** indicate a negative balance.
- A horizontal reference line marks the $0 point.
- Hover over any point to see the exact balance and what transactions occurred that day.

You can change the time range using the preset buttons (30d, 60d, 90d, 6mo, 1yr) or set a custom date range. See [Charts](charts.md) for more detail on all five chart types.

## What to Do Next

Now that you have the basics set up, here are some next steps:

- **Add more accounts**: If you have a savings account or other accounts, see [Accounts](accounts.md).
- **Set up transfers**: Move money between accounts automatically. See [Transfers](transfers.md).
- **Organize with categories**: Group your expenses by type. See [Categories](categories.md).
- **Try what-if scenarios**: Toggle items on and off to see how changes affect your forecast. See [Tips and Workflows](tips.md).
- **Explore the charts**: Switch between five different chart views. See [Charts](charts.md).
- **Browse the ledger**: See a day-by-day transaction list. See [Ledger](ledger.md).
- **Record actual spending**: Once you start making real purchases, record them in the Actual Spending panel and link them to your forecast expenses. The projection will use your real amounts instead of estimates. See [Actual Spending](actual-spending.md).
