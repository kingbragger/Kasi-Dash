import { Router } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, desc, count } from "drizzle-orm";
import { MarkNotificationReadParams } from "@workspace/api-zod";

const router = Router();

const formatNotification = (n: typeof notificationsTable.$inferSelect) => ({
  ...n,
  createdAt: n.createdAt.toISOString(),
});

router.get("/notifications", async (req, res) => {
  try {
    const notifications = await db
      .select()
      .from(notificationsTable)
      .orderBy(desc(notificationsTable.createdAt))
      .limit(50);

    res.json(notifications.map(formatNotification));
  } catch (err) {
    req.log.error({ err }, "Failed to list notifications");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/notifications/:id/read", async (req, res) => {
  try {
    const { id } = MarkNotificationReadParams.parse({ id: Number(req.params.id) });
    const [notif] = await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(eq(notificationsTable.id, id))
      .returning();

    if (!notif) { res.status(404).json({ error: "Not found" }); return; }
    res.json(formatNotification(notif));
  } catch (err) {
    req.log.error({ err }, "Failed to mark notification read");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/notifications/read-all", async (req, res) => {
  try {
    const result = await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(eq(notificationsTable.isRead, false))
      .returning({ id: notificationsTable.id });

    res.json({ updated: result.length });
  } catch (err) {
    req.log.error({ err }, "Failed to mark all notifications read");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
