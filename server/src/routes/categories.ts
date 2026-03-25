import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";

const router = Router();

// GET /api/categories — list all category colors
router.get("/", async (_req: Request, res: Response) => {
  try {
    const colors = await prisma.categoryColor.findMany();
    res.json(colors);
  } catch (error) {
    console.error("Failed to fetch category colors:", error);
    res.status(500).json({ error: "Failed to fetch category colors" });
  }
});

// PUT /api/categories/:name — set color for a category
router.put("/:name", async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { color } = req.body;

    if (!color || typeof color !== "string") {
      res.status(400).json({ error: "color is required" });
      return;
    }

    const result = await prisma.categoryColor.upsert({
      where: { name },
      update: { color },
      create: { name, color },
    });

    res.json(result);
  } catch (error) {
    console.error("Failed to update category color:", error);
    res.status(500).json({ error: "Failed to update category color" });
  }
});

export default router;
