import { Router } from "express";
import { db, productsTable } from "@workspace/db";
import { eq, ilike, and, lte, count } from "drizzle-orm";
import {
  ListInventoryQueryParams,
  UpdateInventoryItemParams,
  UpdateInventoryItemBody,
} from "@workspace/api-zod";

const router = Router();

const LOW_STOCK_DEFAULT = 5;

const formatItem = (p: typeof productsTable.$inferSelect, threshold: number) => ({
  id: p.id,
  productId: p.id,
  productTitle: p.title,
  sku: p.sku ?? null,
  quantity: p.inventory,
  lowStockThreshold: threshold,
  isLowStock: p.inventory <= threshold,
  imageUrl: p.imageUrl ?? null,
  updatedAt: p.updatedAt.toISOString(),
});

router.get("/inventory", async (req, res) => {
  try {
    const parsed = ListInventoryQueryParams.safeParse(req.query);
    const { search, low_stock, page = 1, limit = 20 } = parsed.success ? parsed.data : {};
    const offset = (Number(page) - 1) * Number(limit);

    const conditions = [];
    if (search) conditions.push(ilike(productsTable.title, `%${search}%`));
    if (low_stock) conditions.push(lte(productsTable.inventory, LOW_STOCK_DEFAULT));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [products, totalResult] = await Promise.all([
      db.select().from(productsTable).where(whereClause).limit(Number(limit)).offset(offset),
      db.select({ count: count() }).from(productsTable).where(whereClause),
    ]);

    res.json({
      items: products.map((p) => formatItem(p, LOW_STOCK_DEFAULT)),
      total: Number(totalResult[0].count),
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list inventory");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/inventory/:id", async (req, res) => {
  try {
    const { id } = UpdateInventoryItemParams.parse({ id: Number(req.params.id) });
    const data = UpdateInventoryItemBody.parse(req.body);

    const [product] = await db
      .update(productsTable)
      .set({ inventory: data.quantity })
      .where(eq(productsTable.id, id))
      .returning();

    if (!product) { res.status(404).json({ error: "Not found" }); return; }

    res.json(formatItem(product, data.lowStockThreshold ?? LOW_STOCK_DEFAULT));
  } catch (err) {
    req.log.error({ err }, "Failed to update inventory");
    res.status(400).json({ error: "Invalid data" });
  }
});

router.get("/inventory/alerts", async (req, res) => {
  try {
    const products = await db
      .select()
      .from(productsTable)
      .where(lte(productsTable.inventory, LOW_STOCK_DEFAULT));

    res.json(products.map((p) => formatItem(p, LOW_STOCK_DEFAULT)));
  } catch (err) {
    req.log.error({ err }, "Failed to get inventory alerts");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
