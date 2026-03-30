import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";

const router = Router({ mergeParams: true });

// GET /api/accounts/:accountId/actuals
router.get("/", async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const actuals = await prisma.actualSpend.findMany({
      where: { accountId },
      include: {
        forecastExpense: { select: { id: true, name: true, category: true } },
      },
      orderBy: { date: "desc" },
    });
    res.json(actuals);
  } catch (error) {
    console.error("Failed to fetch actuals:", error);
    res.status(500).json({ error: "Failed to fetch actuals" });
  }
});

// POST /api/accounts/:accountId/actuals
router.post("/", async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const { date, amount, note, category, forecastExpenseId } = req.body;

    if (!date || amount === undefined) {
      res.status(400).json({ error: "date and amount are required" });
      return;
    }

    let resolvedCategory = category || null;

    // If linked to a forecast expense, verify ownership and inherit category
    if (forecastExpenseId) {
      const expense = await prisma.plannedExpense.findFirst({
        where: { id: forecastExpenseId, accountId },
      });
      if (!expense) {
        res.status(400).json({ error: "Forecast expense not found in this account" });
        return;
      }
      if (!resolvedCategory && expense.category) {
        resolvedCategory = expense.category;
      }
    }

    const actual = await prisma.actualSpend.create({
      data: {
        date: new Date(date),
        amount,
        note: note || null,
        category: resolvedCategory,
        forecastExpenseId: forecastExpenseId || null,
        accountId,
      },
      include: {
        forecastExpense: { select: { id: true, name: true, category: true } },
      },
    });

    res.status(201).json(actual);
  } catch (error) {
    console.error("Failed to create actual:", error);
    res.status(500).json({ error: "Failed to create actual spend" });
  }
});

// PUT /api/accounts/:accountId/actuals/:id
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { accountId, id } = req.params;
    const { date, amount, note, category, forecastExpenseId } = req.body;

    const existing = await prisma.actualSpend.findFirst({
      where: { id, accountId },
    });
    if (!existing) {
      res.status(404).json({ error: "Actual spend not found" });
      return;
    }

    if (forecastExpenseId) {
      const expense = await prisma.plannedExpense.findFirst({
        where: { id: forecastExpenseId, accountId },
      });
      if (!expense) {
        res.status(400).json({ error: "Forecast expense not found in this account" });
        return;
      }
    }

    const data: Record<string, unknown> = {};
    if (date !== undefined) data.date = new Date(date);
    if (amount !== undefined) data.amount = amount;
    if (note !== undefined) data.note = note || null;
    if (category !== undefined) data.category = category || null;
    if (forecastExpenseId !== undefined) data.forecastExpenseId = forecastExpenseId || null;

    const actual = await prisma.actualSpend.update({
      where: { id },
      data,
      include: {
        forecastExpense: { select: { id: true, name: true, category: true } },
      },
    });

    res.json(actual);
  } catch (error) {
    console.error("Failed to update actual:", error);
    res.status(500).json({ error: "Failed to update actual spend" });
  }
});

// DELETE /api/accounts/:accountId/actuals/:id
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { accountId, id } = req.params;

    const existing = await prisma.actualSpend.findFirst({
      where: { id, accountId },
    });
    if (!existing) {
      res.status(404).json({ error: "Actual spend not found" });
      return;
    }

    await prisma.actualSpend.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error("Failed to delete actual:", error);
    res.status(500).json({ error: "Failed to delete actual spend" });
  }
});

export default router;
