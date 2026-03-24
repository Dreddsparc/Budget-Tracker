import { Router, Request, Response } from "express";
import { Interval } from "@prisma/client";
import prisma from "../lib/prisma";

const router = Router();

interface ProjectionEvent {
  type: "income" | "expense";
  name: string;
  amount: number;
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

/**
 * Check whether a recurring item hits on a given date based on its
 * interval and startDate. All comparisons use UTC to avoid timezone drift.
 */
function matchesInterval(
  interval: Interval,
  startDate: Date,
  checkDate: Date
): boolean {
  // Normalize to UTC midnight for clean date comparison
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

  // Cannot trigger before the start date
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
      // Same day-of-month as startDate
      return check.getUTCDate() === start.getUTCDate();

    case "QUARTERLY":
      // Every 3 months on same day-of-month
      if (check.getUTCDate() !== start.getUTCDate()) return false;
      const monthDiff =
        (check.getUTCFullYear() - start.getUTCFullYear()) * 12 +
        (check.getUTCMonth() - start.getUTCMonth());
      return monthDiff >= 0 && monthDiff % 3 === 0;

    case "YEARLY":
      // Same month and day each year
      return (
        check.getUTCMonth() === start.getUTCMonth() &&
        check.getUTCDate() === start.getUTCDate()
      );

    default:
      return false;
  }
}

// GET /api/projections?days=90&overrides=[...]
router.get("/", async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 90;

    // Cap at a reasonable limit to prevent abuse
    const cappedDays = Math.min(days, 365 * 2);

    // Parse optional overrides for what-if scenarios
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

    // Fetch latest balance snapshot as starting point
    const latestBalance = await prisma.balanceSnapshot.findFirst({
      orderBy: { date: "desc" },
    });
    let runningBalance = latestBalance?.amount ?? 0;

    // Fetch all income sources and expenses
    const [incomeSources, expenses] = await Promise.all([
      prisma.incomeSource.findMany(),
      prisma.plannedExpense.findMany(),
    ]);

    // Apply overrides to determine effective active status
    const effectiveIncome = incomeSources.map((s) => ({
      ...s,
      active: overrideMap.has(s.id) ? overrideMap.get(s.id)! : s.active,
    }));

    const effectiveExpenses = expenses.map((e) => ({
      ...e,
      active: overrideMap.has(e.id) ? overrideMap.get(e.id)! : e.active,
    }));

    const projections: ProjectionDay[] = [];
    const today = new Date();
    const startOfToday = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
    );

    for (let i = 0; i < cappedDays; i++) {
      const currentDate = new Date(startOfToday);
      currentDate.setUTCDate(currentDate.getUTCDate() + i);

      const events: ProjectionEvent[] = [];

      // Check each active income source
      for (const source of effectiveIncome) {
        if (!source.active) continue;
        if (matchesInterval(source.interval, source.startDate, currentDate)) {
          events.push({
            type: "income",
            name: source.name,
            amount: source.amount,
          });
          runningBalance += source.amount;
        }
      }

      // Check each active planned expense
      for (const expense of effectiveExpenses) {
        if (!expense.active) continue;
        // Respect endDate if set
        if (expense.endDate && currentDate > expense.endDate) continue;
        if (
          matchesInterval(expense.interval, expense.startDate, currentDate)
        ) {
          events.push({
            type: "expense",
            name: expense.name,
            amount: expense.amount,
          });
          runningBalance -= expense.amount;
        }
      }

      projections.push({
        date: currentDate.toISOString().split("T")[0],
        balance: Math.round(runningBalance * 100) / 100,
        events,
      });
    }

    res.json(projections);
  } catch (error) {
    console.error("Failed to compute projections:", error);
    res.status(500).json({ error: "Failed to compute projections" });
  }
});

export default router;
