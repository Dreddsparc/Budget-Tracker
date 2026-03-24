import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";

const router = Router();

// GET /api/income — list all income sources
router.get("/", async (_req: Request, res: Response) => {
  try {
    const sources = await prisma.incomeSource.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(sources);
  } catch (error) {
    console.error("Failed to fetch income sources:", error);
    res.status(500).json({ error: "Failed to fetch income sources" });
  }
});

// POST /api/income — create income source
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, amount, interval, startDate } = req.body;

    if (!name || amount === undefined || !interval || !startDate) {
      res.status(400).json({
        error: "name, amount, interval, and startDate are required",
      });
      return;
    }

    const source = await prisma.incomeSource.create({
      data: {
        name,
        amount,
        interval,
        startDate: new Date(startDate),
      },
    });

    res.status(201).json(source);
  } catch (error) {
    console.error("Failed to create income source:", error);
    res.status(500).json({ error: "Failed to create income source" });
  }
});

// PUT /api/income/:id — update income source
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, amount, interval, startDate, active } = req.body;

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (amount !== undefined) data.amount = amount;
    if (interval !== undefined) data.interval = interval;
    if (startDate !== undefined) data.startDate = new Date(startDate);
    if (active !== undefined) data.active = active;

    const source = await prisma.incomeSource.update({
      where: { id },
      data,
    });

    res.json(source);
  } catch (error) {
    console.error("Failed to update income source:", error);
    res.status(500).json({ error: "Failed to update income source" });
  }
});

// DELETE /api/income/:id — delete income source
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.incomeSource.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error("Failed to delete income source:", error);
    res.status(500).json({ error: "Failed to delete income source" });
  }
});

// PATCH /api/income/:id/toggle — toggle active status
router.patch("/:id/toggle", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const source = await prisma.incomeSource.findUnique({ where: { id } });
    if (!source) {
      res.status(404).json({ error: "Income source not found" });
      return;
    }

    const updated = await prisma.incomeSource.update({
      where: { id },
      data: { active: !source.active },
    });

    res.json(updated);
  } catch (error) {
    console.error("Failed to toggle income source:", error);
    res.status(500).json({ error: "Failed to toggle income source" });
  }
});

export default router;
