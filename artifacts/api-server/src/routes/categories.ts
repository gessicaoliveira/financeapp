import { Router } from "express";
import { db, categoriesTable, transactionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import {
  CreateCategoryBody,
  UpdateCategoryBody,
  UpdateCategoryParams,
  DeleteCategoryParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const cats = await db.select().from(categoriesTable).orderBy(categoriesTable.isDefault, categoriesTable.name);

  const counts = await db
    .select({
      categoryId: transactionsTable.categoryId,
      count: sql<number>`count(*)::int`,
      total: sql<number>`sum(${transactionsTable.amount}::numeric)`,
    })
    .from(transactionsTable)
    .groupBy(transactionsTable.categoryId);

  const countMap = new Map(counts.map((c) => [c.categoryId, c]));

  const result = cats.map((cat) => {
    const stats = countMap.get(cat.id);
    return {
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      isDefault: cat.isDefault,
      transactionCount: stats?.count ?? 0,
      totalAmount: Number(stats?.total ?? 0),
    };
  });

  res.json(result);
});

router.post("/", async (req, res) => {
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }
  const [cat] = await db
    .insert(categoriesTable)
    .values({ ...parsed.data, isDefault: false })
    .returning();
  res.status(201).json({ ...cat, transactionCount: 0, totalAmount: 0 });
});

router.put("/:id", async (req, res) => {
  const params = UpdateCategoryParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }
  const [cat] = await db
    .update(categoriesTable)
    .set(parsed.data)
    .where(eq(categoriesTable.id, params.data.id))
    .returning();
  if (!cat) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  const stats = await db
    .select({
      count: sql<number>`count(*)::int`,
      total: sql<number>`sum(${transactionsTable.amount}::numeric)`,
    })
    .from(transactionsTable)
    .where(eq(transactionsTable.categoryId, cat.id));
  res.json({ ...cat, transactionCount: stats[0]?.count ?? 0, totalAmount: Number(stats[0]?.total ?? 0) });
});

router.delete("/:id", async (req, res) => {
  const params = DeleteCategoryParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const cat = await db.select().from(categoriesTable).where(eq(categoriesTable.id, params.data.id));
  if (!cat[0]) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (cat[0].isDefault) {
    res.status(400).json({ error: "Cannot delete default categories" });
    return;
  }
  await db.delete(categoriesTable).where(eq(categoriesTable.id, params.data.id));
  res.status(204).send();
});

export default router;
