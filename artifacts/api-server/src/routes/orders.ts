import { Router } from "express";
import { db, ordersTable } from "@workspace/db";
import { eq, desc, sql, count } from "drizzle-orm";
import {
  ListOrdersQueryParams,
  GetOrderParams,
  FulfilOrderParams,
  CancelOrderParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/orders", async (req, res) => {
  try {
    const parsed = ListOrdersQueryParams.safeParse(req.query);
    const { status, page = 1, limit = 20 } = parsed.success ? parsed.data : {};

    const offset = (Number(page) - 1) * Number(limit);

    const whereClause = status
      ? eq(ordersTable.status, status as "pending" | "paid" | "fulfilled" | "cancelled" | "refunded")
      : undefined;

    const [orders, totalResult] = await Promise.all([
      db
        .select()
        .from(ordersTable)
        .where(whereClause)
        .orderBy(desc(ordersTable.createdAt))
        .limit(Number(limit))
        .offset(offset),
      db.select({ count: count() }).from(ordersTable).where(whereClause),
    ]);

    res.json({
      orders: orders.map((o) => ({
        ...o,
        total: parseFloat(String(o.total)),
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
      })),
      total: Number(totalResult[0].count),
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list orders");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/orders/stats", async (req, res) => {
  try {
    const rows = await db
      .select({ status: ordersTable.status, count: count() })
      .from(ordersTable)
      .groupBy(ordersTable.status);

    const stats: Record<string, number> = {
      pending: 0, paid: 0, fulfilled: 0, cancelled: 0, refunded: 0,
    };
    for (const row of rows) {
      stats[row.status] = Number(row.count);
    }

    res.json(stats);
  } catch (err) {
    req.log.error({ err }, "Failed to get order stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/orders/:id", async (req, res) => {
  try {
    const { id } = GetOrderParams.parse({ id: Number(req.params.id) });
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
    if (!order) { res.status(404).json({ error: "Not found" }); return; }

    res.json({
      ...order,
      total: parseFloat(String(order.total)),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get order");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/orders/:id/fulfil", async (req, res) => {
  try {
    const { id } = FulfilOrderParams.parse({ id: Number(req.params.id) });
    const [order] = await db
      .update(ordersTable)
      .set({ status: "fulfilled" })
      .where(eq(ordersTable.id, id))
      .returning();

    if (!order) { res.status(404).json({ error: "Not found" }); return; }

    res.json({
      ...order,
      total: parseFloat(String(order.total)),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fulfil order");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/orders/:id/cancel", async (req, res) => {
  try {
    const { id } = CancelOrderParams.parse({ id: Number(req.params.id) });
    const [order] = await db
      .update(ordersTable)
      .set({ status: "cancelled" })
      .where(eq(ordersTable.id, id))
      .returning();

    if (!order) { res.status(404).json({ error: "Not found" }); return; }

    res.json({
      ...order,
      total: parseFloat(String(order.total)),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to cancel order");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
