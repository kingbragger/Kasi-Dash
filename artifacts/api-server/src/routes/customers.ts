import { Router } from "express";
import { db, customersTable, ordersTable } from "@workspace/db";
import { eq, ilike, count, sql } from "drizzle-orm";
import {
  ListCustomersQueryParams,
  GetCustomerParams,
} from "@workspace/api-zod";

const router = Router();

const formatCustomer = (c: typeof customersTable.$inferSelect) => ({
  id: c.id,
  name: c.name,
  email: c.email,
  location: c.location ?? null,
  totalOrders: c.totalOrders,
  totalSpent: parseFloat(String(c.totalSpent)),
  lifetimeValue: parseFloat(String(c.totalSpent)) * 1.2,
  isRepeat: c.isRepeat,
  createdAt: c.createdAt.toISOString(),
});

router.get("/customers", async (req, res) => {
  try {
    const parsed = ListCustomersQueryParams.safeParse(req.query);
    const { search, page = 1, limit = 20 } = parsed.success ? parsed.data : {};
    const offset = (Number(page) - 1) * Number(limit);

    const whereClause = search ? ilike(customersTable.name, `%${search}%`) : undefined;

    const [customers, totalResult] = await Promise.all([
      db.select().from(customersTable).where(whereClause).limit(Number(limit)).offset(offset),
      db.select({ count: count() }).from(customersTable).where(whereClause),
    ]);

    res.json({
      customers: customers.map(formatCustomer),
      total: Number(totalResult[0].count),
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list customers");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/customers/stats", async (req, res) => {
  try {
    const [stats] = await db
      .select({
        total: count(),
        repeatCount: sql<number>`count(*) filter (where is_repeat = true)`,
        avgLTV: sql<number>`coalesce(avg(total_spent::numeric), 0)`,
      })
      .from(customersTable);

    const locations = await db
      .select({
        location: customersTable.location,
        count: count(),
      })
      .from(customersTable)
      .where(sql`location is not null`)
      .groupBy(customersTable.location)
      .orderBy(sql`count(*) desc`)
      .limit(5);

    res.json({
      totalCustomers: Number(stats.total),
      repeatCustomerRate: stats.total > 0
        ? (Number(stats.repeatCount) / Number(stats.total)) * 100
        : 0,
      averageLifetimeValue: parseFloat(String(stats.avgLTV ?? 0)) * 1.2,
      topLocations: locations.map((l) => ({
        location: l.location ?? "Unknown",
        count: Number(l.count),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get customer stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/customers/:id", async (req, res) => {
  try {
    const { id } = GetCustomerParams.parse({ id: Number(req.params.id) });

    const [customer] = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.id, id));

    if (!customer) { res.status(404).json({ error: "Not found" }); return; }

    const customerOrders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.customerId, id));

    res.json({
      customer: formatCustomer(customer),
      orders: customerOrders.map((o) => ({
        ...o,
        total: parseFloat(String(o.total)),
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get customer");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
