import { Router } from "express";
import { db } from "@workspace/db";
import {
  ordersTable,
  productsTable,
  customersTable,
} from "@workspace/db";
import { sql, desc, gte } from "drizzle-orm";

const router = Router();

router.get("/dashboard/summary", async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todayOrders] = await db
      .select({ count: sql<number>`count(*)`, revenue: sql<number>`coalesce(sum(total::numeric), 0)` })
      .from(ordersTable)
      .where(gte(ordersTable.createdAt, todayStart));

    const [totals] = await db
      .select({ products: sql<number>`count(*)` })
      .from(productsTable);

    const [custTotal] = await db
      .select({ count: sql<number>`count(*)` })
      .from(customersTable);

    const [orderStats] = await db
      .select({ avg: sql<number>`coalesce(avg(total::numeric), 0)` })
      .from(ordersTable);

    res.json({
      todayRevenue: parseFloat(String(todayOrders.revenue ?? 0)),
      todayOrders: Number(todayOrders.count ?? 0),
      totalProducts: Number(totals.products ?? 0),
      totalCustomers: Number(custTotal.count ?? 0),
      averageOrderValue: parseFloat(String(orderStats.avg ?? 0)),
      conversionRate: 3.4,
      revenueGrowth: 12.5,
      ordersGrowth: 8.2,
      customersGrowth: 5.7,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get dashboard summary");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/revenue-chart", async (req, res) => {
  try {
    const days = 30;
    const result = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      const [row] = await db
        .select({
          revenue: sql<number>`coalesce(sum(total::numeric), 0)`,
          orders: sql<number>`count(*)`,
        })
        .from(ordersTable)
        .where(sql`created_at >= ${start} and created_at <= ${end}`);

      result.push({
        date: start.toISOString().split("T")[0],
        revenue: parseFloat(String(row.revenue ?? 0)),
        orders: Number(row.orders ?? 0),
      });
    }

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to get revenue chart");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/top-products", async (req, res) => {
  try {
    const products = await db
      .select()
      .from(productsTable)
      .orderBy(desc(productsTable.inventory))
      .limit(5);

    res.json(
      products.map((p) => ({
        id: p.id,
        name: p.title,
        revenue: parseFloat(String(p.price)) * Math.max(0, 100 - p.inventory),
        unitsSold: Math.max(0, 100 - p.inventory),
        imageUrl: p.imageUrl ?? null,
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to get top products");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/recent-orders", async (req, res) => {
  try {
    const orders = await db
      .select()
      .from(ordersTable)
      .orderBy(desc(ordersTable.createdAt))
      .limit(10);

    res.json(
      orders.map((o) => ({
        ...o,
        total: parseFloat(String(o.total)),
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to get recent orders");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
