import { Router } from "express";
import { db, bfSystemsTable, bfModulesTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import {
  GetSystemParams,
  UpdateSystemParams,
  DeleteSystemParams,
  AddModuleParams,
  UpdateModuleParams,
  DeleteModuleParams,
  CreateSystemBody,
  UpdateSystemBody,
  AddModuleBody,
  UpdateModuleBody,
} from "@workspace/api-zod";

const router = Router();

const TEMPLATES = [
  {
    id: "invoice",
    name: "Invoice System",
    type: "invoice",
    description: "Generate and manage professional invoices for your clients",
    modules: [
      { name: "Invoices", type: "table" },
      { name: "New Invoice", type: "form" },
      { name: "Revenue Report", type: "chart" },
    ],
  },
  {
    id: "crm",
    name: "CRM System",
    type: "crm",
    description: "Track leads, contacts, and deals through your sales pipeline",
    modules: [
      { name: "Contacts", type: "table" },
      { name: "Pipeline", type: "dashboard" },
      { name: "Add Contact", type: "form" },
      { name: "Sales Report", type: "report" },
    ],
  },
  {
    id: "employee",
    name: "Employee Management",
    type: "employee",
    description: "Manage your team — attendance, roles, and payroll",
    modules: [
      { name: "Employees", type: "table" },
      { name: "Roles & Permissions", type: "permissions" },
      { name: "Add Employee", type: "form" },
      { name: "Payroll Report", type: "report" },
    ],
  },
  {
    id: "booking",
    name: "Booking System",
    type: "booking",
    description: "Accept and manage customer appointments and reservations",
    modules: [
      { name: "Bookings", type: "table" },
      { name: "New Booking", type: "form" },
      { name: "Calendar View", type: "dashboard" },
    ],
  },
  {
    id: "expense",
    name: "Expense Tracker",
    type: "expense",
    description: "Track business expenses, receipts, and budgets",
    modules: [
      { name: "Expenses", type: "table" },
      { name: "Add Expense", type: "form" },
      { name: "Spending Chart", type: "chart" },
      { name: "Monthly Report", type: "report" },
    ],
  },
  {
    id: "stock",
    name: "Stock Management",
    type: "stock",
    description: "Track stock levels, suppliers, and purchase orders",
    modules: [
      { name: "Stock Items", type: "table" },
      { name: "Add Item", type: "form" },
      { name: "Stock Levels", type: "chart" },
    ],
  },
];

const formatSystem = (s: typeof bfSystemsTable.$inferSelect, moduleCount = 0) => ({
  id: s.id,
  name: s.name,
  type: s.type,
  description: s.description ?? null,
  status: s.status,
  moduleCount,
  createdAt: s.createdAt.toISOString(),
  updatedAt: s.updatedAt.toISOString(),
});

const formatModule = (m: typeof bfModulesTable.$inferSelect) => ({
  ...m,
  createdAt: m.createdAt.toISOString(),
});

router.get("/buildforge/templates", async (_req, res) => {
  res.json(TEMPLATES);
});

router.get("/buildforge/systems", async (req, res) => {
  try {
    const systems = await db.select().from(bfSystemsTable);
    const withCounts = await Promise.all(
      systems.map(async (s) => {
        const [{ count: moduleCount }] = await db
          .select({ count: count() })
          .from(bfModulesTable)
          .where(eq(bfModulesTable.systemId, s.id));
        return formatSystem(s, Number(moduleCount));
      })
    );
    res.json(withCounts);
  } catch (err) {
    req.log.error({ err }, "Failed to list systems");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/buildforge/systems", async (req, res) => {
  try {
    const data = CreateSystemBody.parse(req.body);
    const [system] = await db.insert(bfSystemsTable).values({
      name: data.name,
      type: data.type as typeof bfSystemsTable.$inferInsert["type"],
      description: data.description,
    }).returning();

    res.status(201).json(formatSystem(system, 0));
  } catch (err) {
    req.log.error({ err }, "Failed to create system");
    res.status(400).json({ error: "Invalid data" });
  }
});

router.get("/buildforge/systems/:id", async (req, res) => {
  try {
    const { id } = GetSystemParams.parse({ id: Number(req.params.id) });
    const [system] = await db.select().from(bfSystemsTable).where(eq(bfSystemsTable.id, id));
    if (!system) { res.status(404).json({ error: "Not found" }); return; }

    const modules = await db
      .select()
      .from(bfModulesTable)
      .where(eq(bfModulesTable.systemId, id));

    res.json({
      system: formatSystem(system, modules.length),
      modules: modules.map(formatModule),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get system");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/buildforge/systems/:id", async (req, res) => {
  try {
    const { id } = UpdateSystemParams.parse({ id: Number(req.params.id) });
    const data = UpdateSystemBody.parse(req.body);

    const updates: Record<string, unknown> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.status !== undefined) updates.status = data.status;

    const [system] = await db
      .update(bfSystemsTable)
      .set(updates)
      .where(eq(bfSystemsTable.id, id))
      .returning();

    if (!system) { res.status(404).json({ error: "Not found" }); return; }

    const [{ count: moduleCount }] = await db
      .select({ count: count() })
      .from(bfModulesTable)
      .where(eq(bfModulesTable.systemId, id));

    res.json(formatSystem(system, Number(moduleCount)));
  } catch (err) {
    req.log.error({ err }, "Failed to update system");
    res.status(400).json({ error: "Invalid data" });
  }
});

router.delete("/buildforge/systems/:id", async (req, res) => {
  try {
    const { id } = DeleteSystemParams.parse({ id: Number(req.params.id) });
    await db.delete(bfSystemsTable).where(eq(bfSystemsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete system");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/buildforge/systems/:id/modules", async (req, res) => {
  try {
    const { id } = AddModuleParams.parse({ id: Number(req.params.id) });
    const data = AddModuleBody.parse(req.body);

    const [module] = await db.insert(bfModulesTable).values({
      systemId: id,
      name: data.name,
      type: data.type as typeof bfModulesTable.$inferInsert["type"],
      config: data.config ?? {},
      sortOrder: data.sortOrder ?? 0,
    }).returning();

    res.status(201).json(formatModule(module));
  } catch (err) {
    req.log.error({ err }, "Failed to add module");
    res.status(400).json({ error: "Invalid data" });
  }
});

router.patch("/buildforge/modules/:id", async (req, res) => {
  try {
    const { id } = UpdateModuleParams.parse({ id: Number(req.params.id) });
    const data = UpdateModuleBody.parse(req.body);

    const updates: Record<string, unknown> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.config !== undefined) updates.config = data.config;
    if (data.sortOrder !== undefined) updates.sortOrder = data.sortOrder;

    const [module] = await db
      .update(bfModulesTable)
      .set(updates)
      .where(eq(bfModulesTable.id, id))
      .returning();

    if (!module) { res.status(404).json({ error: "Not found" }); return; }
    res.json(formatModule(module));
  } catch (err) {
    req.log.error({ err }, "Failed to update module");
    res.status(400).json({ error: "Invalid data" });
  }
});

router.delete("/buildforge/modules/:id", async (req, res) => {
  try {
    const { id } = DeleteModuleParams.parse({ id: Number(req.params.id) });
    await db.delete(bfModulesTable).where(eq(bfModulesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete module");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
