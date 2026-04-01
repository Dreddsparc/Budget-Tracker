# :test_tube: Testing

Current testing status, recommended frameworks, setup instructions, and detailed test cases for the most critical areas of the application.

---

## :clipboard: Current Status

No test framework is currently configured for either the server or client projects. There are no test files, no test scripts in `package.json`, and no CI pipeline.

Type checking is available via:

```bash
make typecheck    # Runs tsc --noEmit on both server and client
```

> **Tip:** Run `make typecheck` frequently during development. It is the only automated quality check currently in place.

---

## :bulb: Recommended Test Strategy

### Framework Recommendations

**Server:**
- **Test runner:** Vitest (fast, TypeScript-native, compatible with the Vite ecosystem)
- **HTTP testing:** Supertest (for testing Express routes without starting the server)
- **Database:** Use a test database with Prisma (separate `DATABASE_URL` for tests)

**Client:**
- **Test runner:** Vitest with `@testing-library/react`
- **Component testing:** React Testing Library for unit/integration tests
- **E2E testing:** Playwright for full browser-based end-to-end tests

### Setup

Install test dependencies:

```bash
# Server
cd server
npm install -D vitest supertest @types/supertest

# Client
cd client
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Add Vitest configuration to each project's `vite.config.ts` (or create `vitest.config.ts`):

```typescript
// server/vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
});
```

```typescript
// client/vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test-setup.ts",
  },
});
```

---

## :dart: Key Areas to Test

### Priority 1: Projection Engine

The projection engine is the most critical and complex code in the application. It is also the most testable because `matchesInterval`, `getEffectiveAmount`, and `applyDay` are pure functions with no database dependencies.

> **Pattern:** Pure functions with no side effects are the easiest to test and provide the highest confidence. Start here for maximum impact with minimum setup effort.

**matchesInterval:**

```typescript
// Example test cases
describe("matchesInterval", () => {
  it("ONE_TIME fires only on exact date", () => {
    const start = new Date("2026-03-15T00:00:00Z");
    expect(matchesInterval("ONE_TIME", start, new Date("2026-03-15T00:00:00Z"))).toBe(true);
    expect(matchesInterval("ONE_TIME", start, new Date("2026-03-16T00:00:00Z"))).toBe(false);
  });

  it("WEEKLY fires every 7 days", () => {
    const start = new Date("2026-01-05T00:00:00Z"); // Monday
    expect(matchesInterval("WEEKLY", start, new Date("2026-01-12T00:00:00Z"))).toBe(true);
    expect(matchesInterval("WEEKLY", start, new Date("2026-01-13T00:00:00Z"))).toBe(false);
  });

  it("MONTHLY handles day-of-month matching", () => {
    const start = new Date("2026-01-15T00:00:00Z");
    expect(matchesInterval("MONTHLY", start, new Date("2026-02-15T00:00:00Z"))).toBe(true);
    expect(matchesInterval("MONTHLY", start, new Date("2026-02-14T00:00:00Z"))).toBe(false);
  });

  it("MONTHLY with 31st does not fire in short months", () => {
    const start = new Date("2026-01-31T00:00:00Z");
    expect(matchesInterval("MONTHLY", start, new Date("2026-02-28T00:00:00Z"))).toBe(false);
    expect(matchesInterval("MONTHLY", start, new Date("2026-03-31T00:00:00Z"))).toBe(true);
  });

  it("returns false for dates before start", () => {
    const start = new Date("2026-06-01T00:00:00Z");
    expect(matchesInterval("DAILY", start, new Date("2026-05-31T00:00:00Z"))).toBe(false);
  });
});
```

**Edge cases to cover:**
- BIWEEKLY across month boundaries
- QUARTERLY with months that lack the start day
- YEARLY on Feb 29 (leap year)
- Dates very far in the future (2 years)

**getEffectiveAmount:**

```typescript
describe("getEffectiveAmount", () => {
  it("returns base amount when not variable", () => {
    const item = { amount: 100, isVariable: false, priceAdjustments: [] };
    expect(getEffectiveAmount(item, new Date("2026-06-01"))).toBe(100);
  });

  it("returns latest applicable adjustment", () => {
    const item = {
      amount: 100,
      isVariable: true,
      priceAdjustments: [
        { amount: 110, startDate: new Date("2026-03-01") },
        { amount: 120, startDate: new Date("2026-06-01") },
      ],
    };
    expect(getEffectiveAmount(item, new Date("2026-04-15"))).toBe(110);
    expect(getEffectiveAmount(item, new Date("2026-06-01"))).toBe(120);
    expect(getEffectiveAmount(item, new Date("2026-02-15"))).toBe(100);
  });
});
```

**applyDay:**

Test the full day simulation with mock income, expenses, transfers, and actuals. Verify balance arithmetic and event generation.

**Actual spending integration:**

```typescript
describe("applyDay with actuals", () => {
  it("emits actual events with isActual flag", () => {
    const actuals = [{ amount: 45, name: "Grocery run", category: "Food", forecastExpenseId: null }];
    const result = applyDay(today, 1000, [], [], [], actuals);
    expect(result.events[0].isActual).toBe(true);
    expect(result.balance).toBe(955);
  });

  it("skips forecast expense when covered by a linked actual", () => {
    const expenseId = "expense-uuid";
    const actuals = [{ amount: 45, name: "Groceries", category: "Food", forecastExpenseId: expenseId }];
    const expenses = [{ id: expenseId, name: "Groceries", amount: 50, interval: "WEEKLY", /* ... */ }];
    const result = applyDay(today, 1000, [], expenses, [], actuals);
    // Only the actual event should appear, not the forecast
    expect(result.events).toHaveLength(1);
    expect(result.events[0].isActual).toBe(true);
    expect(result.events[0].amount).toBe(45);
  });

  it("processes unlinked actuals without affecting forecasts", () => {
    const actuals = [{ amount: 20, name: "Coffee", category: null, forecastExpenseId: null }];
    const expenses = [{ id: "other-uuid", name: "Groceries", amount: 50, interval: "WEEKLY", /* ... */ }];
    const result = applyDay(today, 1000, [], expenses, [], actuals);
    // Both actual and forecast should appear
    expect(result.events).toHaveLength(2);
  });
});
```

**Edge cases to cover for actuals:**
- Multiple actuals on the same day, some linked and some not
- Actual linked to an inactive forecast expense
- Actual with no note and no linked forecast (should use "Actual spend" fallback name)
- actualsMap with dates outside the projection window (should be ignored)

---

### Priority 2: API Routes

Test each route with Supertest. Use a test database to avoid side effects.

```typescript
import request from "supertest";
import app from "../src/index";

describe("GET /api/accounts", () => {
  it("returns a list of accounts", async () => {
    const res = await request(app).get("/api/accounts");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("POST /api/accounts", () => {
  it("requires a name", async () => {
    const res = await request(app)
      .post("/api/accounts")
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("name");
  });
});
```

**Key API scenarios to test:**
- CRUD for each resource (accounts, income, expenses, actuals, categories)
- Account scoping (cannot access another account's data)
- Transfer validation (cannot transfer to self, target must exist)
- Expense toggle (active flips correctly)
- Price adjustment CRUD (expense must exist and belong to account)
- Actual spending CRUD (see below)
- Projection query parameter handling (days, date range, invalid overrides)
- Category auto-discovery on GET
- Category rename with expense migration

**Actual spending API scenarios:**

```typescript
describe("actuals routes", () => {
  it("creates an actual with required fields", async () => {
    const res = await request(app)
      .post(`/api/accounts/${accountId}/actuals`)
      .send({ date: "2026-03-20", amount: 45 });
    expect(res.status).toBe(201);
  });

  it("validates forecastExpenseId belongs to the same account", async () => {
    const res = await request(app)
      .post(`/api/accounts/${accountId}/actuals`)
      .send({ date: "2026-03-20", amount: 45, forecastExpenseId: otherAccountExpenseId });
    expect(res.status).toBe(400);
  });

  it("auto-inherits category from linked forecast expense", async () => {
    const res = await request(app)
      .post(`/api/accounts/${accountId}/actuals`)
      .send({ date: "2026-03-20", amount: 45, forecastExpenseId: expenseWithCategory });
    expect(res.status).toBe(201);
    expect(res.body.category).toBe("Food");
  });

  it("returns 404 for update/delete of another account's actual", async () => {
    const res = await request(app)
      .put(`/api/accounts/${accountId}/actuals/${otherAccountActualId}`)
      .send({ amount: 50 });
    expect(res.status).toBe(404);
  });
});
```

---

### Priority 3: Spreadsheet Import/Export

Test the round-trip: export, parse the workbook, verify sheet contents, re-import, verify database state.

```typescript
describe("spreadsheet export", () => {
  it("creates a workbook with all sheets", async () => {
    const res = await request(app)
      .get(`/api/accounts/${testAccountId}/spreadsheet/export`);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("spreadsheetml");

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(res.body);
    expect(wb.getWorksheet("Instructions")).toBeDefined();
    expect(wb.getWorksheet("Income Sources")).toBeDefined();
    expect(wb.getWorksheet("Planned Expenses")).toBeDefined();
  });
});
```

**Import scenarios to test:**
- Valid data creates/updates/deletes correctly
- Invalid rows generate errors but do not block valid rows
- Transfer target resolution by name (case-insensitive)
- Missing expense for price adjustment generates an error
- Re-import of exported data is idempotent
- Account scoping prevents cross-account data modification

---

### Priority 4: Client Components

Use React Testing Library for component behavior:

```typescript
import { render, screen } from "@testing-library/react";
import DateRangeBar from "./components/DateRangeBar";

describe("DateRangeBar", () => {
  it("renders preset day buttons", () => {
    render(<DateRangeBar value={{ kind: "preset", days: 90 }} onChange={() => {}} />);
    expect(screen.getByText("30d")).toBeInTheDocument();
    expect(screen.getByText("90d")).toBeInTheDocument();
  });
});
```

**Client test focus areas:**
- Override toggle behavior in App.tsx
- Chart component rendering with mock projection data
- API error handling
- Form validation in EntryForm

---

## :floppy_disk: Test Database Strategy

For API and spreadsheet tests, use a separate PostgreSQL database:

1. Set `DATABASE_URL` to a test database in the test environment.
2. Run `prisma db push` before tests to ensure the schema is current.
3. Use `prisma.$transaction` or truncate tables between tests for isolation.
4. Consider adding a `make test` target to the Makefile:

```makefile
test-server:
	$(SERVER) npx vitest run

test-client:
	$(CLIENT) npx vitest run
```

> **Warning:** Never run tests against the development database. Use a dedicated test database to avoid data corruption.

---

## :scissors: Extracting Functions for Testing

The projection engine functions (`matchesInterval`, `getEffectiveAmount`, `applyDay`) are currently defined inside `server/src/routes/projections.ts` as module-level functions but are not exported. To test them, you have two options:

1. **Extract to a separate module:** Move the pure functions to `server/src/lib/projections.ts` and export them. The route file imports from there.

2. **Export from the route file:** Add named exports alongside the default router export. This is simpler but mixes concerns.

> **Tip:** Option 1 (extracting to `server/src/lib/projections.ts`) is recommended. It separates the computation logic from the HTTP layer, making the functions independently testable and reusable.

---

## Related

- [Projections Engine](projections-engine.md) -- The engine internals that are the highest-priority test target
- [API Reference](api.md) -- Endpoint behavior to validate with integration tests
- [Spreadsheet Import/Export](spreadsheet.md) -- Round-trip behavior to test
- [Client Architecture](client-architecture.md) -- Component tree and data flow for UI tests
- [Adding Features](adding-features.md) -- Checklist includes verifying TypeScript compilation
