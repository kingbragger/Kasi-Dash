import { Router } from "express";
import { db, productsTable } from "@workspace/db";
import { eq, ilike, count, and, inArray } from "drizzle-orm";
import {
  ListProductsQueryParams,
  GetProductParams,
  UpdateProductParams,
  DeleteProductParams,
  CreateProductBody,
  UpdateProductBody,
  BulkUpdateProductsBody,
} from "@workspace/api-zod";

const router = Router();

const formatProduct = (p: typeof productsTable.$inferSelect) => ({
  ...p,
  price: parseFloat(String(p.price)),
  compareAtPrice: p.compareAtPrice ? parseFloat(String(p.compareAtPrice)) : null,
  createdAt: p.createdAt.toISOString(),
  updatedAt: p.updatedAt.toISOString(),
});

router.get("/products", async (req, res) => {
  try {
    const parsed = ListProductsQueryParams.safeParse(req.query);
    const { search, status, page = 1, limit = 20 } = parsed.success ? parsed.data : {};
    const offset = (Number(page) - 1) * Number(limit);

    const conditions = [];
    if (search) conditions.push(ilike(productsTable.title, `%${search}%`));
    if (status) conditions.push(eq(productsTable.status, status as "active" | "draft" | "archived"));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [products, totalResult] = await Promise.all([
      db.select().from(productsTable).where(whereClause).limit(Number(limit)).offset(offset),
      db.select({ count: count() }).from(productsTable).where(whereClause),
    ]);

    res.json({
      products: products.map(formatProduct),
      total: Number(totalResult[0].count),
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list products");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/products", async (req, res) => {
  try {
    const data = CreateProductBody.parse(req.body);
    const [product] = await db.insert(productsTable).values({
      title: data.title,
      description: data.description,
      price: String(data.price),
      compareAtPrice: data.compareAtPrice ? String(data.compareAtPrice) : null,
      status: data.status as "active" | "draft" | "archived",
      inventory: data.inventory,
      imageUrl: data.imageUrl ?? null,
      category: data.category ?? null,
      sku: data.sku ?? null,
    }).returning();

    res.status(201).json(formatProduct(product));
  } catch (err) {
    req.log.error({ err }, "Failed to create product");
    res.status(400).json({ error: "Invalid data" });
  }
});

router.get("/products/:id", async (req, res) => {
  try {
    const { id } = GetProductParams.parse({ id: Number(req.params.id) });
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id));
    if (!product) { res.status(404).json({ error: "Not found" }); return; }
    res.json(formatProduct(product));
  } catch (err) {
    req.log.error({ err }, "Failed to get product");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/products/:id", async (req, res) => {
  try {
    const { id } = UpdateProductParams.parse({ id: Number(req.params.id) });
    const data = UpdateProductBody.parse(req.body);

    const updates: Record<string, unknown> = {};
    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.price !== undefined) updates.price = String(data.price);
    if (data.compareAtPrice !== undefined) updates.compareAtPrice = data.compareAtPrice ? String(data.compareAtPrice) : null;
    if (data.status !== undefined) updates.status = data.status;
    if (data.inventory !== undefined) updates.inventory = data.inventory;
    if (data.imageUrl !== undefined) updates.imageUrl = data.imageUrl ?? null;
    if (data.category !== undefined) updates.category = data.category ?? null;
    if (data.sku !== undefined) updates.sku = data.sku ?? null;

    const [product] = await db.update(productsTable).set(updates).where(eq(productsTable.id, id)).returning();
    if (!product) { res.status(404).json({ error: "Not found" }); return; }
    res.json(formatProduct(product));
  } catch (err) {
    req.log.error({ err }, "Failed to update product");
    res.status(400).json({ error: "Invalid data" });
  }
});

router.delete("/products/:id", async (req, res) => {
  try {
    const { id } = DeleteProductParams.parse({ id: Number(req.params.id) });
    await db.delete(productsTable).where(eq(productsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete product");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/products/bulk-update", async (req, res) => {
  try {
    const data = BulkUpdateProductsBody.parse(req.body);
    if (data.ids.length === 0) { res.json({ updated: 0 }); return; }

    const updates: Record<string, unknown> = {};
    if (data.price !== null && data.price !== undefined) updates.price = String(data.price);
    if (data.status !== null && data.status !== undefined) updates.status = data.status;

    if (Object.keys(updates).length === 0) { res.json({ updated: 0 }); return; }

    const result = await db
      .update(productsTable)
      .set(updates)
      .where(inArray(productsTable.id, data.ids))
      .returning({ id: productsTable.id });

    res.json({ updated: result.length });
  } catch (err) {
    req.log.error({ err }, "Failed to bulk update products");
    res.status(400).json({ error: "Invalid data" });
  }
});

export default router;
