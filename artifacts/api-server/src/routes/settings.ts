import { Router } from "express";
import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateSettingsBody } from "@workspace/api-zod";

const router = Router();

const formatSettings = (s: typeof settingsTable.$inferSelect) => ({
  ...s,
  updatedAt: s.updatedAt.toISOString(),
});

async function ensureSettings() {
  const existing = await db.select().from(settingsTable).limit(1);
  if (existing.length > 0) return existing[0];

  const [created] = await db.insert(settingsTable).values({}).returning();
  return created;
}

router.get("/settings", async (req, res) => {
  try {
    const settings = await ensureSettings();
    res.json(formatSettings(settings));
  } catch (err) {
    req.log.error({ err }, "Failed to get settings");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/settings", async (req, res) => {
  try {
    const data = UpdateSettingsBody.parse(req.body);
    const existing = await ensureSettings();

    const updates: Record<string, unknown> = {};
    if (data.businessName !== undefined) updates.businessName = data.businessName;
    if (data.currency !== undefined) updates.currency = data.currency;
    if (data.timezone !== undefined) updates.timezone = data.timezone;
    if (data.theme !== undefined) updates.theme = data.theme;
    if (data.notifyNewOrders !== undefined) updates.notifyNewOrders = data.notifyNewOrders;
    if (data.notifyLowInventory !== undefined) updates.notifyLowInventory = data.notifyLowInventory;
    if (data.notifyFailedPayments !== undefined) updates.notifyFailedPayments = data.notifyFailedPayments;
    if (data.lowStockThreshold !== undefined) updates.lowStockThreshold = data.lowStockThreshold;

    const [settings] = await db
      .update(settingsTable)
      .set(updates)
      .where(eq(settingsTable.id, existing.id))
      .returning();

    res.json(formatSettings(settings ?? existing));
  } catch (err) {
    req.log.error({ err }, "Failed to update settings");
    res.status(400).json({ error: "Invalid data" });
  }
});

export default router;
