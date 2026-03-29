# Accounts

Budget Tracker supports multiple accounts, so you can separately track your checking account, savings account, or any other financial account. Each account has its own balance, income sources, expenses, and projections.

## Switching Between Accounts

The account selector is in the center of the navigation bar at the top of the page.

1. Click the dropdown menu in the center of the navbar.
2. Select the account you want to view.

The page updates immediately to show that account's balance, income, expenses, and projections.

> **Note:** Your account selection is remembered in your browser. When you return to Budget Tracker later, it opens to the last account you were viewing.

## Managing Accounts

Click the **Manage** button next to the account dropdown to open the account management modal. From here you can create, rename, and delete accounts.

### Creating a New Account

1. Click **Manage** next to the account dropdown.
2. At the bottom of the modal, type a name for the new account (e.g., "Savings", "Emergency Fund").
3. Click **Add Account**.

The new account is created and automatically selected as your active account. It will have no balance, income, or expenses -- you will be prompted to set a starting balance.

### Renaming an Account

1. Click **Manage** next to the account dropdown.
2. Find the account you want to rename and click **Rename**.
3. Type the new name in the text field.
4. Press **Enter** or click **Save** to confirm.
5. To cancel, press **Escape** or click **Cancel**.

### Deleting an Account

1. Click **Manage** next to the account dropdown.
2. Find the account you want to delete and click **Delete**.
3. A confirmation message appears: "Delete [account name] and all its data?"
4. Click **Delete** to confirm, or **Cancel** to keep the account.

Deleting an account permanently removes all of its data, including its balance, income sources, expenses, and price adjustments.

> **Important:** You cannot delete your last remaining account. The Delete button is hidden when only one account exists. If you want to start over, rename the account and update its balance instead.

### Identifying the Active Account

In the account management modal, the currently active account is highlighted and displays an "Active" badge next to its name.

## How Accounts Stay Separate

Each account is completely independent:

- **Balance**: Every account has its own current balance, set separately.
- **Income**: Income sources belong to one specific account.
- **Expenses**: Expenses belong to one specific account.
- **Projections**: Charts and the ledger only show data for the currently selected account.
- **Transfers**: The exception -- transfers connect two accounts. See [Transfers](transfers.md) for details.
- **What-if overrides**: Toggling items on/off for what-if analysis resets when you switch accounts.
