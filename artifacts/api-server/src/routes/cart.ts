import { Router } from "express";
import { db, cartItemsTable, productsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { z } from "zod";

const router = Router();

async function getCartWithProducts(userId: number) {
  const items = await db
    .select({
      id: cartItemsTable.id,
      quantity: cartItemsTable.quantity,
      productId: productsTable.id,
      title: productsTable.title,
      price: productsTable.price,
      compareAtPrice: productsTable.compareAtPrice,
      imageUrl: productsTable.imageUrl,
      inventory: productsTable.inventory,
      sku: productsTable.sku,
      status: productsTable.status,
    })
    .from(cartItemsTable)
    .innerJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
    .where(eq(cartItemsTable.userId, userId));

  const formatted = items.map(i => ({
    id: i.id,
    quantity: i.quantity,
    product: {
      id: i.productId,
      title: i.title,
      price: parseFloat(String(i.price)),
      compareAtPrice: i.compareAtPrice ? parseFloat(String(i.compareAtPrice)) : null,
      imageUrl: i.imageUrl,
      inventory: i.inventory,
      sku: i.sku,
      status: i.status,
    },
    subtotal: parseFloat(String(i.price)) * i.quantity,
  }));

  const total = formatted.reduce((s, i) => s + i.subtotal, 0);
  const itemCount = formatted.reduce((s, i) => s + i.quantity, 0);

  return { items: formatted, total, itemCount };
}

router.get("/cart", requireAuth, async (req, res) => {
  try {
    const cart = await getCartWithProducts(req.user!.userId);
    res.json(cart);
  } catch (err) {
    req.log.error({ err }, "Failed to get cart");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/cart/items", requireAuth, async (req, res) => {
  try {
    const { productId, quantity = 1 } = z.object({
      productId: z.number().int().positive(),
      quantity: z.number().int().min(1).max(100).optional(),
    }).parse(req.body);

    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId)).limit(1);
    if (!product) { res.status(404).json({ error: "Product not found" }); return; }
    if (product.status !== "active") { res.status(400).json({ error: "Product unavailable" }); return; }
    if (product.inventory < quantity) {
      res.status(400).json({ error: `Only ${product.inventory} in stock` });
      return;
    }

    const existing = await db.select().from(cartItemsTable)
      .where(and(eq(cartItemsTable.userId, req.user!.userId), eq(cartItemsTable.productId, productId)))
      .limit(1);

    if (existing.length > 0) {
      const newQty = existing[0].quantity + quantity;
      if (newQty > product.inventory) {
        res.status(400).json({ error: `Only ${product.inventory} in stock` });
        return;
      }
      await db.update(cartItemsTable).set({ quantity: newQty }).where(eq(cartItemsTable.id, existing[0].id));
    } else {
      await db.insert(cartItemsTable).values({ userId: req.user!.userId, productId, quantity });
    }

    const cart = await getCartWithProducts(req.user!.userId);
    res.json(cart);
  } catch (err) {
    req.log.error({ err }, "Failed to add to cart");
    res.status(400).json({ error: "Invalid data" });
  }
});

router.patch("/cart/items/:id", requireAuth, async (req, res) => {
  try {
    const itemId = parseInt(req.params.id as string);
    const { quantity } = z.object({ quantity: z.number().int().min(0) }).parse(req.body);

    const [item] = await db.select().from(cartItemsTable)
      .where(and(eq(cartItemsTable.id, itemId), eq(cartItemsTable.userId, req.user!.userId)));

    if (!item) { res.status(404).json({ error: "Cart item not found" }); return; }

    if (quantity === 0) {
      await db.delete(cartItemsTable).where(eq(cartItemsTable.id, itemId));
    } else {
      await db.update(cartItemsTable).set({ quantity }).where(eq(cartItemsTable.id, itemId));
    }

    const cart = await getCartWithProducts(req.user!.userId);
    res.json(cart);
  } catch (err) {
    req.log.error({ err }, "Failed to update cart item");
    res.status(400).json({ error: "Invalid data" });
  }
});

router.delete("/cart/items/:id", requireAuth, async (req, res) => {
  try {
    const itemId = parseInt(req.params.id as string);
    await db.delete(cartItemsTable)
      .where(and(eq(cartItemsTable.id, itemId), eq(cartItemsTable.userId, req.user!.userId)));

    const cart = await getCartWithProducts(req.user!.userId);
    res.json(cart);
  } catch (err) {
    req.log.error({ err }, "Failed to remove cart item");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/cart", requireAuth, async (req, res) => {
  try {
    await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, req.user!.userId));
    res.json({ items: [], total: 0, itemCount: 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to clear cart");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
