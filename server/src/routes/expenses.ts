import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";

const router = Router();

// GET /api/expenses — list all planned expenses
router.get("/", async (_req: Request, res: Response) => {
  try {
    const expenses = await prisma.plannedExpense.findMany({
      orderBy: { createdAt: "desc" },
      include: { priceAdjustments: { orderBy: { startDate: "asc" } } },
    });
    res.json(expenses);
  } catch (error) {
    console.error("Failed to fetch expenses:", error);
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

// POST /api/expenses — create planned expense
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, amount, interval, startDate, endDate, category, isVariable } = req.body;

    if (!name || amount === undefined || !interval || !startDate) {
      res.status(400).json({
        error: "name, amount, interval, and startDate are required",
      });
      return;
    }

    const expense = await prisma.plannedExpense.create({
      data: {
        name,
        amount,
        interval,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        category: category || null,
        isVariable: isVariable ?? false,
      },
      include: { priceAdjustments: { orderBy: { startDate: "asc" } } },
    });

    res.status(201).json(expense);
  } catch (error) {
    console.error("Failed to create expense:", error);
    res.status(500).json({ error: "Failed to create expense" });
  }
});

// PUT /api/expenses/:id — update planned expense
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, amount, interval, startDate, endDate, category, active, isVariable } =
      req.body;

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (amount !== undefined) data.amount = amount;
    if (interval !== undefined) data.interval = interval;
    if (startDate !== undefined) data.startDate = new Date(startDate);
    if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
    if (category !== undefined) data.category = category;
    if (active !== undefined) data.active = active;
    if (isVariable !== undefined) data.isVariable = isVariable;

    const expense = await prisma.plannedExpense.update({
      where: { id },
      data,
      include: { priceAdjustments: { orderBy: { startDate: "asc" } } },
    });

    res.json(expense);
  } catch (error) {
    console.error("Failed to update expense:", error);
    res.status(500).json({ error: "Failed to update expense" });
  }
});

// DELETE /api/expenses/:id — delete planned expense
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.plannedExpense.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error("Failed to delete expense:", error);
    res.status(500).json({ error: "Failed to delete expense" });
  }
});

// PATCH /api/expenses/:id/toggle — toggle active status
router.patch("/:id/toggle", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const expense = await prisma.plannedExpense.findUnique({ where: { id } });
    if (!expense) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }

    const updated = await prisma.plannedExpense.update({
      where: { id },
      data: { active: !expense.active },
      include: { priceAdjustments: { orderBy: { startDate: "asc" } } },
    });

    res.json(updated);
  } catch (error) {
    console.error("Failed to toggle expense:", error);
    res.status(500).json({ error: "Failed to toggle expense" });
  }
});

// GET /api/expenses/:id/prices — list price adjustments for an expense
router.get("/:id/prices", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const expense = await prisma.plannedExpense.findUnique({ where: { id } });
    if (!expense) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }

    const adjustments = await prisma.priceAdjustment.findMany({
      where: { expenseId: id },
      orderBy: { startDate: "asc" },
    });

    res.json(adjustments);
  } catch (error) {
    console.error("Failed to fetch price adjustments:", error);
    res.status(500).json({ error: "Failed to fetch price adjustments" });
  }
});

// POST /api/expenses/:id/prices — add a price adjustment
router.post("/:id/prices", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, startDate, note } = req.body;

    if (amount === undefined || !startDate) {
      res.status(400).json({ error: "amount and startDate are required" });
      return;
    }

    const expense = await prisma.plannedExpense.findUnique({ where: { id } });
    if (!expense) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }

    const adjustment = await prisma.priceAdjustment.create({
      data: {
        expenseId: id,
        amount,
        startDate: new Date(startDate),
        note: note || null,
      },
    });

    res.status(201).json(adjustment);
  } catch (error) {
    console.error("Failed to create price adjustment:", error);
    res.status(500).json({ error: "Failed to create price adjustment" });
  }
});

// PUT /api/expenses/:expenseId/prices/:priceId — update a price adjustment
router.put("/:expenseId/prices/:priceId", async (req: Request, res: Response) => {
  try {
    const { expenseId, priceId } = req.params;
    const { amount, startDate, note } = req.body;

    const existing = await prisma.priceAdjustment.findFirst({
      where: { id: priceId, expenseId },
    });
    if (!existing) {
      res.status(404).json({ error: "Price adjustment not found" });
      return;
    }

    const data: Record<string, unknown> = {};
    if (amount !== undefined) data.amount = amount;
    if (startDate !== undefined) data.startDate = new Date(startDate);
    if (note !== undefined) data.note = note || null;

    const adjustment = await prisma.priceAdjustment.update({
      where: { id: priceId },
      data,
    });

    res.json(adjustment);
  } catch (error) {
    console.error("Failed to update price adjustment:", error);
    res.status(500).json({ error: "Failed to update price adjustment" });
  }
});

// DELETE /api/expenses/:expenseId/prices/:priceId — delete a price adjustment
router.delete("/:expenseId/prices/:priceId", async (req: Request, res: Response) => {
  try {
    const { expenseId, priceId } = req.params;

    const existing = await prisma.priceAdjustment.findFirst({
      where: { id: priceId, expenseId },
    });
    if (!existing) {
      res.status(404).json({ error: "Price adjustment not found" });
      return;
    }

    await prisma.priceAdjustment.delete({ where: { id: priceId } });
    res.status(204).send();
  } catch (error) {
    console.error("Failed to delete price adjustment:", error);
    res.status(500).json({ error: "Failed to delete price adjustment" });
  }
});

export default router;
