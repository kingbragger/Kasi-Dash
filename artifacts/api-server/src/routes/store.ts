import { Router } from "express";
import { db, productsTable, ordersTable, orderItemsTable, usersTable } from "@workspace/db";
import { eq, ilike, and, count, desc, sql } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { z } from "zod";

const router = Router();

const formatProduct = (p: typeof productsTable.$inferSelect) => ({
  ...p,
  price: parseFloat(String(p.price)),
  compareAtPrice: p.compareAtPrice ? parseFloat(String(p.compareAtPrice)) : null,
  createdAt: p.createdAt.toISOString(),
  updatedAt: p.updatedAt.toISOString(),
});

router.get("/store/products", async (req, res) => {
  try {
    const search = String(req.query.search || "");
    const category = String(req.query.category || "");
    const page = Math.max(1, parseInt(String(req.query.page || "1")));
    const limit = Math.min(50, parseInt(String(req.query.limit || "20")));
    const offset = (page - 1) * limit;

    const conditions = [eq(productsTable.status, "active")];
    if (search) conditions.push(ilike(productsTable.title, `%${search}%`));
    if (category) conditions.push(eq(productsTable.category, category));
    const whereClause = and(...conditions);

    const [products, totalResult, categories] = await Promise.all([
      db.select().from(productsTable).where(whereClause).orderBy(desc(productsTable.createdAt)).limit(limit).offset(offset),
      db.select({ count: count() }).from(productsTable).where(whereClause),
      db.selectDistinct({ category: productsTable.category }).from(productsTable)
        .where(and(eq(productsTable.status, "active"), sql`category is not null`)),
    ]);

    res.json({
      products: products.map(formatProduct),
      total: Number(totalResult[0].count),
      page,
      limit,
      categories: categories.map(c => c.category).filter(Boolean),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list store products");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/store/products/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id));
    if (!product) { res.status(404).json({ error: "Product not found" }); return; }
    if (product.status === "archived") { res.status(404).json({ error: "Product not found" }); return; }
    res.json(formatProduct(product));
  } catch (err) {
    req.log.error({ err }, "Failed to get store product");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/store/orders", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const orders = await db.select().from(ordersTable)
      .where(eq(ordersTable.userId, userId))
      .orderBy(desc(ordersTable.createdAt));

    const ordersWithItems = await Promise.all(
      orders.map(async (o) => {
        const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, o.id));
        return {
          ...o,
          total: parseFloat(String(o.total)),
          createdAt: o.createdAt.toISOString(),
          updatedAt: o.updatedAt.toISOString(),
          items: items.map(i => ({
            ...i,
            unitPrice: parseFloat(String(i.unitPrice)),
            subtotal: parseFloat(String(i.subtotal)),
            createdAt: i.createdAt.toISOString(),
          })),
        };
      })
    );

    res.json(ordersWithItems);
  } catch (err) {
    req.log.error({ err }, "Failed to get store orders");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/store/orders/:id", requireAuth, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id as string);
    const [order] = await db.select().from(ordersTable)
      .where(and(eq(ordersTable.id, orderId), eq(ordersTable.userId, req.user!.userId)));

    if (!order) { res.status(404).json({ error: "Order not found" }); return; }

    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId));

    res.json({
      ...order,
      total: parseFloat(String(order.total)),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: items.map(i => ({
        ...i,
        unitPrice: parseFloat(String(i.unitPrice)),
        subtotal: parseFloat(String(i.subtotal)),
        createdAt: i.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get store order");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
