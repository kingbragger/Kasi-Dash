import { Router } from "express";
import { db, paymentsTable, ordersTable, notificationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { requireAuth } from "../middleware/auth";
import { z } from "zod";

const router = Router();

const OZOW_SITE_CODE = process.env.OZOW_SITE_CODE || "";
const OZOW_PRIVATE_KEY = process.env.OZOW_PRIVATE_KEY || "";
const OZOW_API_KEY = process.env.OZOW_API_KEY || "";
const OZOW_IS_TEST = process.env.OZOW_IS_TEST !== "false";
const OZOW_PAY_URL = OZOW_IS_TEST
  ? "https://staging.ozow.com"
  : "https://pay.ozow.com";

function buildOzowHash(params: Record<string, string>, privateKey: string): string {
  const concat = Object.values(params).join("") + privateKey;
  return crypto.createHash("sha512").update(concat).digest("hex").toLowerCase();
}

function getBaseUrl(req: any): string {
  const host = process.env.REPLIT_DEV_DOMAIN || req.get("host") || "localhost";
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

router.post("/payments/ozow/initiate", requireAuth, async (req, res) => {
  try {
    const { paymentId } = z.object({ paymentId: z.number().int() }).parse(req.body);

    const [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.id, paymentId));
    if (!payment) { res.status(404).json({ error: "Payment not found" }); return; }

    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, payment.orderId));
    if (!order) { res.status(404).json({ error: "Order not found" }); return; }

    const base = getBaseUrl(req);
    const amount = parseFloat(String(payment.amount)).toFixed(2);

    if (!OZOW_SITE_CODE || !OZOW_PRIVATE_KEY) {
      res.json({
        mode: "test",
        message: "Ozow credentials not configured — simulating payment",
        paymentId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount,
        redirectUrl: `${base}/store/payment-result?paymentId=${paymentId}&status=success&testMode=true`,
      });
      return;
    }

    const transactionRef = `KBT-${order.id}-${Date.now()}`;
    const cancelUrl = `${base}/store/payment-result?paymentId=${paymentId}&status=cancelled`;
    const errorUrl = `${base}/store/payment-result?paymentId=${paymentId}&status=error`;
    const successUrl = `${base}/api/payments/ozow/success?paymentId=${paymentId}`;
    const notifyUrl = `${base}/api/payments/ozow/webhook`;

    const params: Record<string, string> = {
      SiteCode: OZOW_SITE_CODE,
      CountryCode: "ZA",
      CurrencyCode: "ZAR",
      Amount: amount,
      TransactionReference: transactionRef,
      BankReference: order.orderNumber,
      Customer: order.customerEmail,
      CancelUrl: cancelUrl,
      ErrorUrl: errorUrl,
      SuccessUrl: successUrl,
      NotifyUrl: notifyUrl,
      IsTest: OZOW_IS_TEST ? "true" : "false",
    };

    params.HashCheck = buildOzowHash(params, OZOW_PRIVATE_KEY);

    await db.update(paymentsTable).set({
      transactionId: transactionRef,
      meta: params,
    }).where(eq(paymentsTable.id, paymentId));

    const queryString = new URLSearchParams(params).toString();
    const ozowUrl = `${OZOW_PAY_URL}?${queryString}`;

    res.json({ redirectUrl: ozowUrl, transactionRef });
  } catch (err) {
    req.log.error({ err }, "Failed to initiate Ozow payment");
    res.status(400).json({ error: "Payment initiation failed" });
  }
});

router.get("/payments/ozow/success", async (req, res) => {
  try {
    const paymentId = parseInt(String(req.query.paymentId));
    const ozowTransactionId = String(req.query.TransactionId || req.query.transactionId || "");

    const [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.id, paymentId));
    if (!payment) { res.redirect("/store/orders"); return; }

    await db.update(paymentsTable).set({
      status: "success",
      transactionId: ozowTransactionId || payment.transactionId,
    }).where(eq(paymentsTable.id, paymentId));

    await db.update(ordersTable).set({ status: "paid" }).where(eq(ordersTable.id, payment.orderId));

    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, payment.orderId));
    if (order) {
      await db.insert(notificationsTable).values({
        type: "new_order",
        title: "Payment received",
        message: `Order ${order.orderNumber} has been paid — R${parseFloat(String(payment.amount)).toFixed(2)}`,
        isRead: false,
      });
    }

    const base = getBaseUrl(req);
    res.redirect(`${base}/store/orders?success=1`);
  } catch (err) {
    req.log.error({ err }, "Failed to handle Ozow success");
    res.redirect("/store/orders?error=1");
  }
});

router.post("/payments/ozow/webhook", async (req, res) => {
  try {
    const { TransactionId, TransactionReference, Status, Amount } = req.body;

    if (Status?.toLowerCase() === "complete") {
      const payment = await db.select().from(paymentsTable)
        .where(eq(paymentsTable.transactionId, TransactionReference))
        .limit(1);

      if (payment.length > 0) {
        await db.update(paymentsTable).set({ status: "success", transactionId: TransactionId })
          .where(eq(paymentsTable.id, payment[0].id));
        await db.update(ordersTable).set({ status: "paid" })
          .where(eq(ordersTable.id, payment[0].orderId));
      }
    }

    res.json({ received: true });
  } catch (err) {
    req.log.error({ err }, "Webhook error");
    res.status(500).json({ error: "Webhook failed" });
  }
});

router.post("/payments/test-confirm/:paymentId", requireAuth, async (req, res) => {
  try {
    const paymentId = parseInt(req.params.paymentId as string);
    const [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.id, paymentId));
    if (!payment) { res.status(404).json({ error: "Not found" }); return; }

    await db.update(paymentsTable).set({ status: "success", transactionId: `TEST-${Date.now()}` })
      .where(eq(paymentsTable.id, paymentId));

    const [order] = await db.update(ordersTable)
      .set({ status: "paid" })
      .where(eq(ordersTable.id, payment.orderId))
      .returning();

    await db.insert(notificationsTable).values({
      type: "new_order",
      title: "Payment confirmed",
      message: `Order ${order.orderNumber} paid — R${parseFloat(String(payment.amount)).toFixed(2)}`,
      isRead: false,
    });

    res.json({ success: true, orderNumber: order.orderNumber });
  } catch (err) {
    req.log.error({ err }, "Failed to confirm test payment");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
