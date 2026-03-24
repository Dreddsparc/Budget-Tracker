import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";

const router = Router();

// GET /api/expenses — list all planned expenses
router.get("/", async (_req: Request, res: Response) => {
  try {
    const expenses = await prisma.plannedExpense.findMany({
      orderBy: { createdAt: "desc" },
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
    const { name, amount, interval, startDate, endDate, category } = req.body;

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
      },
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
    const { name, amount, interval, startDate, endDate, category, active } =
      req.body;

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (amount !== undefined) data.amount = amount;
    if (interval !== undefined) data.interval = interval;
    if (startDate !== undefined) data.startDate = new Date(startDate);
    if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
    if (category !== undefined) data.category = category;
    if (active !== undefined) data.active = active;

    const expense = await prisma.plannedExpense.update({
      where: { id },
      data,
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
    });

    res.json(updated);
  } catch (error) {
    console.error("Failed to toggle expense:", error);
    res.status(500).json({ error: "Failed to toggle expense" });
  }
});

export default router;
