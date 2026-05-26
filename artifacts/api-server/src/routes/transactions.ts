import { Router } from "express";
import { db, transactionsTable, categoriesTable } from "@workspace/db";
import { eq, and, like, gte, lte, sql, desc } from "drizzle-orm";
import {
  ListTransactionsQueryParams,
  CreateTransactionBody,
  GetTransactionParams,
  UpdateTransactionParams,
  UpdateTransactionBody,
  DeleteTransactionParams,
} from "@workspace/api-zod";

const router = Router();

function getMonthRange(period: string) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (period === "this_month") {
    const start = new Date(year, month, 1).toISOString().split("T")[0];
    const end = new Date(year, month + 1, 0).toISOString().split("T")[0];
    return { start, end };
  } else if (period === "last_month") {
    const start = new Date(year, month - 1, 1).toISOString().split("T")[0];
    const end = new Date(year, month, 0).toISOString().split("T")[0];
    return { start, end };
  } else if (period === "last_90_days") {
    const start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const end = now.toISOString().split("T")[0];
    return { start, end };
  }
  return null;
}

router.get("/", async (req, res) => {
  const parsed = ListTransactionsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }

  const { type, categoryId, search, period, page = 1, limit = 10 } = parsed.data;

  const conditions: ReturnType<typeof eq>[] = [];

  if (type) conditions.push(eq(transactionsTable.type, type));
  if (categoryId) conditions.push(eq(transactionsTable.categoryId, categoryId));
  if (search) conditions.push(like(transactionsTable.description, `%${search}%`));

  const range = period ? getMonthRange(period) : null;
  if (range) {
    conditions.push(gte(transactionsTable.date, range.start));
    conditions.push(lte(transactionsTable.date, range.end));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult, incomeResult, expenseResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(transactionsTable).where(whereClause),
    db
      .select({ total: sql<number>`coalesce(sum(amount::numeric), 0)` })
      .from(transactionsTable)
      .where(and(whereClause, eq(transactionsTable.type, "income"))),
    db
      .select({ total: sql<number>`coalesce(sum(amount::numeric), 0)` })
      .from(transactionsTable)
      .where(and(whereClause, eq(transactionsTable.type, "expense"))),
  ]);

  const total = totalResult[0]?.count ?? 0;
  const totalIncome = Number(incomeResult[0]?.total ?? 0);
  const totalExpenses = Number(expenseResult[0]?.total ?? 0);
  const balance = totalIncome - totalExpenses;
  const offset = (page - 1) * limit;

  const rows = await db
    .select({
      id: transactionsTable.id,
      type: transactionsTable.type,
      amount: transactionsTable.amount,
      description: transactionsTable.description,
      origin: transactionsTable.origin,
      date: transactionsTable.date,
      account: transactionsTable.account,
      paymentMethod: transactionsTable.paymentMethod,
      categoryId: transactionsTable.categoryId,
      recurring: transactionsTable.recurring,
      recurringFrequency: transactionsTable.recurringFrequency,
      notes: transactionsTable.notes,
      createdAt: transactionsTable.createdAt,
      categoryName: categoriesTable.name,
      categoryIcon: categoriesTable.icon,
      categoryColor: categoriesTable.color,
    })
    .from(transactionsTable)
    .leftJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
    .where(whereClause)
    .orderBy(desc(transactionsTable.date), desc(transactionsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const transactions = rows.map((r) => ({
    ...r,
    amount: Number(r.amount),
  }));

  res.json({ transactions, total, page, limit, totalIncome, totalExpenses, balance });
});

router.post("/", async (req, res) => {
  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }

  const [tx] = await db
    .insert(transactionsTable)
    .values({
      type: parsed.data.type,
      amount: String(parsed.data.amount),
      description: parsed.data.description,
      origin: parsed.data.origin ?? null,
      date: parsed.data.date,
      account: parsed.data.account ?? null,
      paymentMethod: parsed.data.paymentMethod ?? null,
      categoryId: parsed.data.categoryId ?? null,
      recurring: parsed.data.recurring,
      recurringFrequency: parsed.data.recurringFrequency ?? null,
      notes: parsed.data.notes ?? null,
    })
    .returning();

  let cat = null;
  if (tx.categoryId) {
    const cats = await db.select().from(categoriesTable).where(eq(categoriesTable.id, tx.categoryId));
    cat = cats[0] ?? null;
  }

  res.status(201).json({
    ...tx,
    amount: Number(tx.amount),
    categoryName: cat?.name ?? null,
    categoryIcon: cat?.icon ?? null,
    categoryColor: cat?.color ?? null,
  });
});

router.get("/:id", async (req, res) => {
  const params = GetTransactionParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const rows = await db
    .select({
      id: transactionsTable.id,
      type: transactionsTable.type,
      amount: transactionsTable.amount,
      description: transactionsTable.description,
      origin: transactionsTable.origin,
      date: transactionsTable.date,
      account: transactionsTable.account,
      paymentMethod: transactionsTable.paymentMethod,
      categoryId: transactionsTable.categoryId,
      recurring: transactionsTable.recurring,
      recurringFrequency: transactionsTable.recurringFrequency,
      notes: transactionsTable.notes,
      createdAt: transactionsTable.createdAt,
      categoryName: categoriesTable.name,
      categoryIcon: categoriesTable.icon,
      categoryColor: categoriesTable.color,
    })
    .from(transactionsTable)
    .leftJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
    .where(eq(transactionsTable.id, params.data.id));

  if (!rows[0]) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json({ ...rows[0], amount: Number(rows[0].amount) });
});

router.put("/:id", async (req, res) => {
  const params = UpdateTransactionParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }

  const [tx] = await db
    .update(transactionsTable)
    .set({
      type: parsed.data.type,
      amount: String(parsed.data.amount),
      description: parsed.data.description,
      origin: parsed.data.origin ?? null,
      date: parsed.data.date,
      account: parsed.data.account ?? null,
      paymentMethod: parsed.data.paymentMethod ?? null,
      categoryId: parsed.data.categoryId ?? null,
      recurring: parsed.data.recurring,
      recurringFrequency: parsed.data.recurringFrequency ?? null,
      notes: parsed.data.notes ?? null,
    })
    .where(eq(transactionsTable.id, params.data.id))
    .returning();

  if (!tx) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  let cat = null;
  if (tx.categoryId) {
    const cats = await db.select().from(categoriesTable).where(eq(categoriesTable.id, tx.categoryId));
    cat = cats[0] ?? null;
  }

  res.json({
    ...tx,
    amount: Number(tx.amount),
    categoryName: cat?.name ?? null,
    categoryIcon: cat?.icon ?? null,
    categoryColor: cat?.color ?? null,
  });
});

router.delete("/:id", async (req, res) => {
  const params = DeleteTransactionParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  await db.delete(transactionsTable).where(eq(transactionsTable.id, params.data.id));
  res.status(204).send();
});

export default router;
