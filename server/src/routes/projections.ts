import { Router, Request, Response } from "express";
import { Interval } from "@prisma/client";
import prisma from "../lib/prisma";

const router = Router({ mergeParams: true });

interface ProjectionEvent {
  type: "income" | "expense";
  name: string;
  amount: number;
  category?: string;
  isActual?: boolean;
  isTransfer?: boolean;
}

interface ProjectionDay {
  date: string;
  balance: number;
  events: ProjectionEvent[];
}

interface Override {
  id: string;
  active: boolean;
}

function matchesInterval(
  interval: Interval,
  startDate: Date,
  checkDate: Date
): boolean {
  const start = new Date(
    Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate()
    )
  );
  const check = new Date(
    Date.UTC(
      checkDate.getUTCFullYear(),
      checkDate.getUTCMonth(),
      checkDate.getUTCDate()
    )
  );

  if (check < start) return false;

  const diffMs = check.getTime() - start.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  switch (interval) {
    case "ONE_TIME":
      return diffDays === 0;
    case "DAILY":
      return true;
    case "WEEKLY":
      return diffDays % 7 === 0;
    case "BIWEEKLY":
      return diffDays % 14 === 0;
    case "MONTHLY":
      return check.getUTCDate() === start.getUTCDate();
    case "QUARTERLY":
      if (check.getUTCDate() !== start.getUTCDate()) return false;
      const monthDiff =
        (check.getUTCFullYear() - start.getUTCFullYear()) * 12 +
        (check.getUTCMonth() - start.getUTCMonth());
      return monthDiff >= 0 && monthDiff % 3 === 0;
    case "YEARLY":
      return (
        check.getUTCMonth() === start.getUTCMonth() &&
        check.getUTCDate() === start.getUTCDate()
      );
    default:
      return false;
  }
}

interface ItemWithAdjustments {
  id: string;
  interval: Interval;
  startDate: Date;
  endDate?: Date | null;
  active: boolean;
  name: string;
  amount: number;
  category: string | null;
  isVariable: boolean;
  isTransfer?: boolean;
  priceAdjustments: { amount: number; startDate: Date }[];
  sourceAccountName?: string;
}

interface ActualForDay {
  amount: number;
  name: string;
  category: string | null;
  forecastExpenseId: string | null;
}

function getEffectiveAmount(
  item: { amount: number; isVariable: boolean; priceAdjustments: { amount: number; startDate: Date }[] },
  currentDate: Date
): number {
  if (!item.isVariable || item.priceAdjustments.length === 0) {
    return item.amount;
  }
  let effectiveAmount = item.amount;
  for (const adj of item.priceAdjustments) {
    const adjDate = new Date(Date.UTC(adj.startDate.getUTCFullYear(), adj.startDate.getUTCMonth(), adj.startDate.getUTCDate()));
    const checkDate = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate()));
    if (adjDate <= checkDate) {
      effectiveAmount = adj.amount;
    } else {
      break;
    }
  }
  return effectiveAmount;
}

function applyDay(
  currentDate: Date,
  runningBalance: number,
  effectiveIncome: { interval: Interval; startDate: Date; active: boolean; name: string; amount: number }[],
  effectiveExpenses: ItemWithAdjustments[],
  incomingTransfers: ItemWithAdjustments[],
  actualsForDay: ActualForDay[]
): { balance: number; events: ProjectionEvent[] } {
  const events: ProjectionEvent[] = [];
  let balance = runningBalance;

  // Regular income
  for (const source of effectiveIncome) {
    if (!source.active) continue;
    if (matchesInterval(source.interval, source.startDate, currentDate)) {
      events.push({ type: "income", name: source.name, amount: source.amount });
      balance += source.amount;
    }
  }

  // Incoming transfers (from other accounts)
  const MONTH_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  for (const transfer of incomingTransfers) {
    if (!transfer.active) continue;
    if (transfer.endDate && currentDate > transfer.endDate) continue;
    if (matchesInterval(transfer.interval, transfer.startDate, currentDate)) {
      const amount = getEffectiveAmount(transfer, currentDate);
      const mon = MONTH_ABBR[currentDate.getUTCMonth()];
      const eventName = `${transfer.name}-${mon}`;
      const categoryName = transfer.sourceAccountName
        ? `Transfer from ${transfer.sourceAccountName}`
        : "Transfer";
      events.push({ type: "income", name: eventName, amount, category: categoryName });
      balance += amount;
    }
  }

  // Actual spends for this day — these replace linked forecast expenses
  const coveredForecastIds = new Set<string>();
  for (const actual of actualsForDay) {
    if (actual.forecastExpenseId) {
      coveredForecastIds.add(actual.forecastExpenseId);
    }
    const event: ProjectionEvent = {
      type: "expense",
      name: actual.name,
      amount: actual.amount,
      isActual: true,
    };
    if (actual.category) event.category = actual.category;
    events.push(event);
    balance -= actual.amount;
  }

  // Forecast expenses — skip any covered by actuals
  for (const expense of effectiveExpenses) {
    if (!expense.active) continue;
    if (expense.endDate && currentDate > expense.endDate) continue;
    if (matchesInterval(expense.interval, expense.startDate, currentDate)) {
      if (coveredForecastIds.has(expense.id)) continue;
      const amount = getEffectiveAmount(expense, currentDate);
      const event: ProjectionEvent = { type: "expense", name: expense.name, amount };
      if (expense.category) event.category = expense.category;
      if (expense.isTransfer) event.isTransfer = true;
      events.push(event);
      balance -= amount;
    }
  }

  return { balance: Math.round(balance * 100) / 100, events };
}

// GET /api/accounts/:accountId/projections
router.get("/", async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;

    let overrides: Override[] = [];
    if (req.query.overrides) {
      try {
        overrides = JSON.parse(req.query.overrides as string);
      } catch {
        res.status(400).json({ error: "Invalid overrides JSON" });
        return;
      }
    }

    const overrideMap = new Map<string, boolean>();
    for (const o of overrides) {
      overrideMap.set(o.id, o.active);
    }

    // Determine the date window
    const today = new Date();
    const todayUTC = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
    );

    let windowStart: Date;
    let windowEnd: Date;

    if (req.query.startDate && req.query.endDate) {
      windowStart = new Date(req.query.startDate as string + "T00:00:00Z");
      windowEnd = new Date(req.query.endDate as string + "T00:00:00Z");
    } else {
      const days = Math.min(parseInt(req.query.days as string) || 90, 365 * 2);
      windowStart = todayUTC;
      windowEnd = new Date(todayUTC);
      windowEnd.setUTCDate(windowEnd.getUTCDate() + days - 1);
    }

    // Cap window to 2 years max
    const maxEnd = new Date(windowStart);
    maxEnd.setUTCDate(maxEnd.getUTCDate() + 365 * 2);
    if (windowEnd > maxEnd) windowEnd = maxEnd;

    // Fetch account-scoped data + incoming transfers + actuals
    const latestBalance = await prisma.balanceSnapshot.findFirst({
      where: { accountId },
      orderBy: { date: "desc" },
    });
    let runningBalance = latestBalance?.amount ?? 0;

    const [incomeSources, expenses, rawTransfers, actuals] = await Promise.all([
      prisma.incomeSource.findMany({ where: { accountId } }),
      prisma.plannedExpense.findMany({
        where: { accountId },
        include: { priceAdjustments: { orderBy: { startDate: "asc" } } },
      }),
      prisma.plannedExpense.findMany({
        where: {
          transferToAccountId: accountId,
          isTransfer: true,
          active: true,
          NOT: { accountId },
        },
        include: {
          priceAdjustments: { orderBy: { startDate: "asc" } },
          account: { select: { name: true } },
        },
      }),
      prisma.actualSpend.findMany({
        where: { accountId },
        include: { forecastExpense: { select: { id: true, name: true } } },
      }),
    ]);

    // Build actuals map: "YYYY-MM-DD" → ActualForDay[]
    const actualsMap = new Map<string, ActualForDay[]>();
    for (const a of actuals) {
      const dateKey = a.date.toISOString().split("T")[0];
      const entry: ActualForDay = {
        amount: a.amount,
        name: a.note || (a.forecastExpense ? a.forecastExpense.name : "Actual spend"),
        category: a.category,
        forecastExpenseId: a.forecastExpenseId,
      };
      const list = actualsMap.get(dateKey);
      if (list) list.push(entry);
      else actualsMap.set(dateKey, [entry]);
    }

    const effectiveIncome = incomeSources.map((s) => ({
      ...s,
      active: overrideMap.has(s.id) ? overrideMap.get(s.id)! : s.active,
    }));

    const effectiveExpenses: ItemWithAdjustments[] = expenses.map((e) => ({
      ...e,
      active: overrideMap.has(e.id) ? overrideMap.get(e.id)! : e.active,
    }));

    const incomingTransfers: ItemWithAdjustments[] = rawTransfers.map((t) => {
      const srcName = (t as unknown as { account: { name: string } }).account.name;
      return {
        id: t.id,
        interval: t.interval,
        startDate: t.startDate,
        endDate: t.endDate,
        active: t.active,
        name: t.name,
        amount: t.amount,
        category: `Transfer from ${srcName}`,
        isVariable: t.isVariable,
        priceAdjustments: t.priceAdjustments,
        sourceAccountName: srcName,
      };
    });

    // If window starts after today, simulate from today to get correct starting balance
    if (windowStart > todayUTC) {
      const current = new Date(todayUTC);
      while (current < windowStart) {
        const dateKey = current.toISOString().split("T")[0];
        const actualsForDay = actualsMap.get(dateKey) || [];
        const result = applyDay(current, runningBalance, effectiveIncome, effectiveExpenses, incomingTransfers, actualsForDay);
        runningBalance = result.balance;
        current.setUTCDate(current.getUTCDate() + 1);
      }
    }

    // Generate projections for the visible window
    const projections: ProjectionDay[] = [];
    const current = new Date(windowStart);

    while (current <= windowEnd) {
      const dateKey = current.toISOString().split("T")[0];
      const actualsForDay = actualsMap.get(dateKey) || [];
      const result = applyDay(current, runningBalance, effectiveIncome, effectiveExpenses, incomingTransfers, actualsForDay);
      runningBalance = result.balance;

      projections.push({
        date: current.toISOString().split("T")[0],
        balance: result.balance,
        events: result.events,
      });

      current.setUTCDate(current.getUTCDate() + 1);
    }

    res.json(projections);
  } catch (error) {
    console.error("Failed to compute projections:", error);
    res.status(500).json({ error: "Failed to compute projections" });
  }
});

export default router;
