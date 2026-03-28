import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";

const router = Router();

// GET /api/accounts
router.get("/", async (_req: Request, res: Response) => {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: { createdAt: "asc" },
    });
    res.json(accounts);
  } catch (error) {
    console.error("Failed to fetch accounts:", error);
    res.status(500).json({ error: "Failed to fetch accounts" });
  }
});

// POST /api/accounts
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name || !String(name).trim()) {
      res.status(400).json({ error: "Account name is required" });
      return;
    }
    const account = await prisma.account.create({
      data: { name: String(name).trim() },
    });
    res.status(201).json(account);
  } catch (error) {
    console.error("Failed to create account:", error);
    res.status(500).json({ error: "Failed to create account" });
  }
});

// PUT /api/accounts/:id
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || !String(name).trim()) {
      res.status(400).json({ error: "Account name is required" });
      return;
    }
    const account = await prisma.account.update({
      where: { id },
      data: { name: String(name).trim() },
    });
    res.json(account);
  } catch (error) {
    console.error("Failed to update account:", error);
    res.status(500).json({ error: "Failed to update account" });
  }
});

// DELETE /api/accounts/:id
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const count = await prisma.account.count();
    if (count <= 1) {
      res.status(400).json({ error: "Cannot delete the last account" });
      return;
    }
    await prisma.account.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error("Failed to delete account:", error);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

export default router;
