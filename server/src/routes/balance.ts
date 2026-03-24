import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";

const router = Router();

// GET /api/balance — return latest BalanceSnapshot
router.get("/", async (_req: Request, res: Response) => {
  try {
    const snapshot = await prisma.balanceSnapshot.findFirst({
      orderBy: { date: "desc" },
    });

    if (!snapshot) {
      res.json(null);
      return;
    }

    res.json(snapshot);
  } catch (error) {
    console.error("Failed to fetch balance:", error);
    res.status(500).json({ error: "Failed to fetch balance" });
  }
});

// POST /api/balance — create new BalanceSnapshot
router.post("/", async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;

    if (amount === undefined || typeof amount !== "number") {
      res.status(400).json({ error: "amount is required and must be a number" });
      return;
    }

    const snapshot = await prisma.balanceSnapshot.create({
      data: { amount },
    });

    res.status(201).json(snapshot);
  } catch (error) {
    console.error("Failed to create balance snapshot:", error);
    res.status(500).json({ error: "Failed to create balance snapshot" });
  }
});

export default router;
