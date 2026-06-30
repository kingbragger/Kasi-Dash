import { Router } from "express";
import { db, cartItemsTable, productsTable, ordersTable, orderItemsTable, paymentsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { z } from "zod";

const router = Router();

const shippingSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(5),
  city: z.string().min(2),
  province: z.string().min(2),
  postalCode: z.string().min(4),
  phone: z.string().min(10),
  notes: z.string().optional(),
  paymentMethod: z.enum(["ozow", "cod"]).default("ozow"),
});

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `KBT-${timestamp}-${random}`;
}

router.post("/checkout", requireAuth, async (req, res) => {
  try {
    const shipping = shippingSchema.parse(req.body);
    const userId = req.user!.userId;

    const cartItems = await db
      .select({
        id: cartItemsTable.id,
        quantity: cartItemsTable.quantity,
        productId: productsTable.id,
        title: productsTable.title,
        price: productsTable.price,
        sku: productsTable.sku,
        inventory: productsTable.inventory,
        status: productsTable.status,
      })
      .from(cartItemsTable)
      .innerJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
      .where(eq(cartItemsTable.userId, userId));

    if (cartItems.length === 0) {
      res.status(400).json({ error: "Cart is empty" });
      return;
    }

    for (const item of cartItems) {
      if (item.status !== "active") {
        res.status(400).json({ error: `"${item.title}" is no longer available` });
        return;
      }
      if (item.inventory < item.quantity) {
        res.status(400).json({ error: `Insufficient stock for "${item.title}" (${item.inventory} available)` });
        return;
      }
    }

    const total = cartItems.reduce((sum, item) => sum + parseFloat(String(item.price)) * item.quantity, 0);
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const [order] = await db.insert(ordersTable).values({
      orderNumber: generateOrderNumber(),
      userId,
      customerName: shipping.name,
      customerEmail: req.user!.email,
      status: "pending",
      total: total.toFixed(2),
      itemCount,
      shippingName: shipping.name,
      shippingAddress: shipping.address,
      shippingCity: shipping.city,
      shippingProvince: shipping.province,
      shippingPostalCode: shipping.postalCode,
      shippingPhone: shipping.phone,
      notes: shipping.notes,
    }).returning();

    await db.insert(orderItemsTable).values(
      cartItems.map(item => ({
        orderId: order.id,
        productId: item.productId,
        productTitle: item.title,
        productSku: item.sku,
        unitPrice: String(parseFloat(String(item.price)).toFixed(2)),
        quantity: item.quantity,
        subtotal: String((parseFloat(String(item.price)) * item.quantity).toFixed(2)),
      }))
    );

    for (const item of cartItems) {
      await db.update(productsTable)
        .set({ inventory: item.inventory - item.quantity })
        .where(eq(productsTable.id, item.productId));
    }

    const [payment] = await db.insert(paymentsTable).values({
      orderId: order.id,
      amount: total.toFixed(2),
      provider: shipping.paymentMethod === "cod" ? "cod" : "ozow",
      status: "pending",
    }).returning();

    await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, userId));

    res.status(201).json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentId: payment.id,
      total,
      paymentMethod: shipping.paymentMethod,
      status: order.status,
    });
  } catch (err) {
    req.log.error({ err }, "Checkout failed");
    res.status(400).json({ error: "Checkout failed" });
  }
});

export default router;
