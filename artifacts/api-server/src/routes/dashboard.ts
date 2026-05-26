import { Router } from "express";
import { db, transactionsTable, categoriesTable } from "@workspace/db";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";

const router = Router();

function getCurrentMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const start = new Date(year, month, 1).toISOString().split("T")[0];
  const end = new Date(year, month + 1, 0).toISOString().split("T")[0];
  const monthLabel = now.toLocaleString("pt-BR", { month: "long", year: "numeric" });
  return { start, end, monthLabel };
}

router.get("/summary", async (_req, res) => {
  const { start, end, monthLabel } = getCurrentMonthRange();

  const [incomeResult, expenseResult] = await Promise.all([
    db
      .select({ total: sql<number>`coalesce(sum(amount::numeric), 0)` })
      .from(transactionsTable)
      .where(and(gte(transactionsTable.date, start), lte(transactionsTable.date, end), eq(transactionsTable.type, "income"))),
    db
      .select({ total: sql<number>`coalesce(sum(amount::numeric), 0)` })
      .from(transactionsTable)
      .where(and(gte(transactionsTable.date, start), lte(transactionsTable.date, end), eq(transactionsTable.type, "expense"))),
  ]);

  const totalIncome = Number(incomeResult[0]?.total ?? 0);
  const totalExpenses = Number(expenseResult[0]?.total ?? 0);
  const balance = totalIncome - totalExpenses;
  const withinLimit = totalExpenses <= totalIncome * 0.8;

  res.json({ balance, totalIncome, totalExpenses, month: monthLabel, withinLimit });
});

router.get("/recent-transactions", async (_req, res) => {
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
    .orderBy(desc(transactionsTable.date), desc(transactionsTable.createdAt))
    .limit(5);

  res.json(rows.map((r) => ({ ...r, amount: Number(r.amount) })));
});

router.get("/category-breakdown", async (_req, res) => {
  const { start, end } = getCurrentMonthRange();

  const rows = await db
    .select({
      categoryId: transactionsTable.categoryId,
      categoryName: categoriesTable.name,
      categoryIcon: categoriesTable.icon,
      categoryColor: categoriesTable.color,
      total: sql<number>`coalesce(sum(${transactionsTable.amount}::numeric), 0)`,
      count: sql<number>`count(*)::int`,
    })
    .from(transactionsTable)
    .leftJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
    .where(and(gte(transactionsTable.date, start), lte(transactionsTable.date, end), eq(transactionsTable.type, "expense")))
    .groupBy(transactionsTable.categoryId, categoriesTable.name, categoriesTable.icon, categoriesTable.color)
    .orderBy(sql`sum(${transactionsTable.amount}::numeric) desc`);

  const grandTotal = rows.reduce((sum, r) => sum + Number(r.total), 0);

  const result = rows.map((r) => ({
    categoryId: r.categoryId ?? 0,
    categoryName: r.categoryName ?? "Sem categoria",
    categoryIcon: r.categoryIcon ?? "🏷️",
    categoryColor: r.categoryColor ?? "#888780",
    total: Number(r.total),
    percentage: grandTotal > 0 ? Math.round((Number(r.total) / grandTotal) * 100) : 0,
    count: r.count,
  }));

  res.json(result);
});

export default router;
