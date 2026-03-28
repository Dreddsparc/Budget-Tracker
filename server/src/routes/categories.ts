import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";

const router = Router();

// GET /api/categories — list all categories (auto-discovers from expenses)
router.get("/", async (_req: Request, res: Response) => {
  try {
    // Find all unique category names used in expenses
    const expenses = await prisma.plannedExpense.findMany({
      where: { category: { not: null } },
      select: { category: true },
      distinct: ["category"],
    });
    const usedNames = new Set(
      expenses.map((e) => e.category).filter((c): c is string => c !== null)
    );

    // Get existing category records
    const existing = await prisma.categoryColor.findMany({
      orderBy: { name: "asc" },
    });
    const existingNames = new Set(existing.map((c) => c.name));

    // Auto-create entries for categories used in expenses but not yet in the table
    const missing = [...usedNames].filter((name) => !existingNames.has(name));
    if (missing.length > 0) {
      await prisma.categoryColor.createMany({
        data: missing.map((name) => ({ name, color: "#ef4444", description: "" })),
        skipDuplicates: true,
      });
    }

    // Re-fetch to include the newly created ones
    const categories = missing.length > 0
      ? await prisma.categoryColor.findMany({ orderBy: { name: "asc" } })
      : existing;

    res.json(categories);
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// POST /api/categories — create a new category
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, color, description } = req.body;
    if (!name || !String(name).trim()) {
      res.status(400).json({ error: "Category name is required" });
      return;
    }

    const category = await prisma.categoryColor.create({
      data: {
        name: String(name).trim(),
        color: color || "#ef4444",
        description: description || "",
      },
    });
    res.status(201).json(category);
  } catch (error) {
    console.error("Failed to create category:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
});

// PUT /api/categories/:name — update a category (color, description, or rename)
router.put("/:name", async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { color, description, newName } = req.body;

    // If renaming, we need to create new + migrate expenses + delete old
    if (newName && String(newName).trim() !== name) {
      const trimmedNew = String(newName).trim();

      // Check if target name already exists
      const existing = await prisma.categoryColor.findUnique({ where: { name: trimmedNew } });
      if (existing) {
        res.status(400).json({ error: `Category "${trimmedNew}" already exists` });
        return;
      }

      // Create new category with the new name
      const current = await prisma.categoryColor.findUnique({ where: { name } });
      await prisma.categoryColor.create({
        data: {
          name: trimmedNew,
          color: color ?? current?.color ?? "#ef4444",
          description: description ?? current?.description ?? "",
        },
      });

      // Update all expenses that use the old category name
      await prisma.plannedExpense.updateMany({
        where: { category: name },
        data: { category: trimmedNew },
      });

      // Delete old category
      await prisma.categoryColor.delete({ where: { name } });

      const result = await prisma.categoryColor.findUnique({ where: { name: trimmedNew } });
      res.json(result);
      return;
    }

    // Simple update (color/description only)
    const data: Record<string, string> = {};
    if (color !== undefined) data.color = color;
    if (description !== undefined) data.description = description;

    const result = await prisma.categoryColor.upsert({
      where: { name },
      update: data,
      create: { name, color: color || "#ef4444", description: description || "" },
    });

    res.json(result);
  } catch (error) {
    console.error("Failed to update category:", error);
    res.status(500).json({ error: "Failed to update category" });
  }
});

// DELETE /api/categories/:name — delete a category (expenses keep their category string)
router.delete("/:name", async (req: Request, res: Response) => {
  try {
    const { name } = req.params;

    const existing = await prisma.categoryColor.findUnique({ where: { name } });
    if (!existing) {
      res.status(404).json({ error: "Category not found" });
      return;
    }

    // Clear category from expenses that use it
    await prisma.plannedExpense.updateMany({
      where: { category: name },
      data: { category: null },
    });

    await prisma.categoryColor.delete({ where: { name } });
    res.status(204).send();
  } catch (error) {
    console.error("Failed to delete category:", error);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

export default router;
