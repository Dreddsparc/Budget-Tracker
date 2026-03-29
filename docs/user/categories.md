# Categories

Categories help you organize your expenses into groups like "Housing", "Food", "Transportation", or anything that makes sense for your budget. Categories also control the colors used in charts.

## How Categories Work

- Each expense can optionally be assigned to one category.
- Expenses with the same category are grouped together in the Forecast Expenses panel under a collapsible header.
- Categories are shared across all accounts.
- Charts like Spending by Category, Projection, and Expense Trends use category colors to distinguish different types of spending.

## Assigning a Category to an Expense

When adding or editing an expense, the category field is at the bottom of the form (it does not appear for transfers).

1. Click the **Select a category...** button in the expense form.
2. A modal dialog opens with a list of all existing categories.
3. Browse or search to find the one you want.
4. Click a category to select it.

### The Category Picker in Detail

The category picker modal includes:

- **Search field**: Type to filter the list of categories. The search matches against category names.
- **Category list**: Each category shows its color dot and name. If the category has a description, it appears below the name in smaller text. The currently selected category is highlighted.
- **No category option**: At the top of the list, select "No category" to remove the category assignment.
- **Create new section**: At the bottom, there is a section to create a new category on the spot. Type a name and click **Use** to create it and assign it immediately.

> **Tip:** If you search for a name that does not exist yet, the "create new" section at the bottom will suggest creating it. You can also just type the name in the create field and press Use.

## Managing Categories

Click the **Categories** button at the top of the Forecast Expenses panel to open the category management modal.

### Creating a Category

1. In the category management modal, scroll to the "Add New Category" section at the bottom.
2. Enter a **name** for the category.
3. Click the **color swatch** to choose a color.
4. Optionally enter a **description** (e.g., "Monthly bills for housing").
5. Click **Add Category**.

### Renaming a Category

1. In the category management modal, find the category you want to rename.
2. Click **Edit**.
3. Change the name in the text field.
4. Click **Save**.

When you rename a category, all expenses that use it are automatically updated to the new name. You do not need to manually reassign them.

### Changing a Category's Color

There are two ways to change a category's color:

**From the category management modal:**
1. Click **Edit** on the category.
2. Click the color swatch and pick a new color.
3. Click **Save**.

**Directly from the expenses panel:**
1. Find the category header in the Forecast Expenses panel.
2. Click the small color circle on the right side of the header.
3. A color picker opens -- choose a new color.

The color change applies immediately to all charts and the expenses panel.

### Adding or Changing a Description

1. In the category management modal, click **Edit** on the category.
2. Type or modify the description text.
3. Click **Save**.

Descriptions appear in the category picker when assigning categories to expenses, helping you remember what each category is for.

### Deleting a Category

1. In the category management modal, find the category you want to delete.
2. Click **Delete**.
3. A confirmation message appears: "Delete [name]? Expenses using it will become uncategorized."
4. Click **Delete** to confirm, or **Cancel** to keep it.

Deleting a category does not delete any expenses. Expenses that were in the deleted category are moved to "Uncategorized."

## Category Colors in Charts

Category colors appear in several charts:

- **Projection chart**: The line color reflects the dominant expense category.
- **Spending by Category chart**: Each donut segment uses the category's assigned color.
- **Expense Trends chart**: Each stacked area uses the category's color.

If you have not assigned a color, a default color is generated automatically based on the category name.

## Expenses Without a Category

Expenses that do not have a category assigned are grouped under "Uncategorized" at the bottom of the expenses panel. They still appear in charts -- they just use a default color.
