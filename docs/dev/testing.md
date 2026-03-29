# Testing

## Current Status

No test framework is currently configured for either the server or client projects. There are no test files, no test scripts in `package.json`, and no CI pipeline.

Type checking is available via:

```bash
make typecheck    # Runs tsc --noEmit on both server and client
```

## Recommended Test Strategy

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

## Key Areas to Test

### Priority 1: Projection Engine

The projection engine is the most critical and complex code in the application. It is also the most testable because `matchesInterval`, `getEffectiveAmount`, and `applyDay` are pure functions with no database dependencies.

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

Test the full day simulation with mock income, expenses, and transfers. Verify balance arithmetic and event generation.

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
- CRUD for each resource (accounts, income, expenses, categories)
- Account scoping (cannot access another account's data)
- Transfer validation (cannot transfer to self, target must exist)
- Expense toggle (active flips correctly)
- Price adjustment CRUD (expense must exist and belong to account)
- Projection query parameter handling (days, date range, invalid overrides)
- Category auto-discovery on GET
- Category rename with expense migration

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

## Test Database Strategy

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

## Extracting Functions for Testing

The projection engine functions (`matchesInterval`, `getEffectiveAmount`, `applyDay`) are currently defined inside `server/src/routes/projections.ts` as module-level functions but are not exported. To test them, you have two options:

1. **Extract to a separate module:** Move the pure functions to `server/src/lib/projections.ts` and export them. The route file imports from there.

2. **Export from the route file:** Add named exports alongside the default router export. This is simpler but mixes concerns.

Option 1 is recommended as it separates the computation logic from the HTTP layer.
