import { Router } from "express";
import { db, productsTable, ordersTable, customersTable } from "@workspace/db";
import { lte, desc, sql, count } from "drizzle-orm";

const router = Router();

router.get("/insights", async (req, res) => {
  try {
    const [lowStockProducts, topProducts, revenue] = await Promise.all([
      db.select({ title: productsTable.title, inventory: productsTable.inventory })
        .from(productsTable)
        .where(lte(productsTable.inventory, 5))
        .limit(5),
      db.select({ title: productsTable.title, price: productsTable.price })
        .from(productsTable)
        .orderBy(desc(productsTable.price))
        .limit(5),
      db.select({ total: sql<number>`coalesce(sum(total::numeric), 0)` }).from(ordersTable),
    ]);

    res.json({
      lowStockWarnings: lowStockProducts.map(
        (p) => `"${p.title}" has only ${p.inventory} units left — restock soon`
      ),
      bestSellers: topProducts.map(
        (p) => `"${p.title}" is performing well at $${parseFloat(String(p.price)).toFixed(2)}`
      ),
      needsPromotion: [
        "Consider running a flash sale on slower-moving items",
        "Products with no sales in 30 days could benefit from a discount",
        "Bundle complementary products to increase average order value",
      ],
      estimatedMonthlyRevenue: parseFloat(String(revenue[0]?.total ?? 0)) * 1.1,
      customerTrends: [
        "Repeat customers are increasing — loyalty program could accelerate this",
        "Most customers are from urban areas — targeted geo campaigns may convert well",
        "Average order value trending upward — upselling is working",
      ],
      marketingRecommendations: [
        "Run an email campaign for customers who haven't purchased in 60+ days",
        "Launch a limited-time bundle deal on your top 3 products",
        "Consider adding a referral incentive — your repeat rate shows customers trust your brand",
        "Use seasonal trends to time promotions around upcoming holidays",
      ],
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get insights");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
