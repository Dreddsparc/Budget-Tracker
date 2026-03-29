# Spreadsheet Import/Export

Budget Tracker lets you export your financial data to an Excel spreadsheet (.xlsx), make changes in any spreadsheet application, and import the modified file back. This is useful for bulk editing, sharing data, or keeping an offline backup.

## Exporting Data

1. Click the **Export** button in the top-right area of the navigation bar (next to the balance display).
2. An .xlsx file downloads to your computer.

The exported file covers only the currently selected account. The filename includes the current date (e.g., `budget-tracker-2026-03-26.xlsx`).

### What the Export Contains

The spreadsheet includes the following sheets:

| Sheet | Contents |
|-------|----------|
| **Instructions** | Guidance on how to edit the spreadsheet and import it back |
| **Balance** | Your current account balance |
| **Income** | All income sources with ID, name, amount, interval, start date, and active status |
| **Expenses** | All expenses with ID, name, amount, interval, start date, end date, category, active status, variable flag, "Is Transfer" flag, and "Transfer To Account" column |
| **Price Adjustments** | All price adjustments for variable expenses, with expense ID, amount, date, and note |
| **Category Colors** | Category names, colors, and descriptions |

> **Note:** Each row with existing data has an **ID** column. This ID is how the import process matches rows to existing records. Do not modify or delete ID values for rows you want to update.

## Editing in a Spreadsheet Application

Open the exported file in Excel, Google Sheets, LibreOffice Calc, or any application that supports .xlsx files.

### Updating Existing Records

Change any value in a row that has an ID. When you import the file, Budget Tracker matches the ID to the existing record and updates it with the new values.

### Adding New Records

To add a new income source, expense, or price adjustment:

1. Add a new row in the appropriate sheet.
2. **Leave the ID column blank.** A blank ID tells Budget Tracker to create a new record.
3. Fill in all other required fields.

### Removing Records

To delete an income source, expense, or price adjustment:

1. Remove the entire row from the spreadsheet.
2. When you import, Budget Tracker notices the row is missing and deletes the corresponding record.

### Important Format Rules

- **Intervals** must use the exact values: ONE_TIME, DAILY, WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, or YEARLY.
- **Dates** should be in a standard date format (the format used in the export will work).
- **Amounts** should be numeric (no dollar signs or commas).
- **Active status** should be TRUE or FALSE.
- **Do not rename sheets** -- Budget Tracker identifies sheets by their names.
- **Do not rearrange columns** -- the import expects columns in the same order as the export.

## Importing Data

1. Make your edits and save the spreadsheet file.
2. Click the **Import** button in the top-right area of the navigation bar.
3. Select the edited .xlsx file from your computer.
4. Budget Tracker processes the file and shows a summary of changes.

### Import Results

After a successful import, a notification appears in the bottom-right corner showing what changed:

- **Balance**: Whether the balance was updated.
- **Income**: How many income sources were added, updated, or removed.
- **Expenses**: How many expenses were added, updated, or removed.
- **Price Adjustments**: How many price adjustments were added, updated, or removed.
- **Categories**: How many categories were synced.

If there are any warnings (e.g., a row with invalid data that was skipped), they appear in an expandable "warnings" section.

Click **dismiss** to close the notification.

### Import Scope

Imports are scoped to the currently selected account. If you export from your checking account, make changes, and import while viewing your savings account, the changes will apply to the savings account. Be sure you have the correct account selected before importing.

> **Tip:** Always export first, make changes to that export, and import it back to the same account. This avoids accidentally applying changes to the wrong account.

## Common Spreadsheet Workflows

### Bulk-Adding Expenses

1. Export your current data.
2. In the Expenses sheet, add many new rows at once with blank IDs.
3. Import the file to create them all in one step.

### Annual Review

1. Export your data at the end of the year for a snapshot.
2. Use spreadsheet tools (pivot tables, formulas) to analyze your spending patterns.
3. Adjust amounts for the new year.
4. Import the changes.

### Sharing with a Partner

1. Export the data.
2. Share the .xlsx file.
3. Your partner reviews and suggests changes.
4. Import the edited file.
