import { pgTable, text, serial, timestamp, integer, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const systemTypeEnum = pgEnum("system_type", [
  "invoice", "employee", "crm", "booking", "delivery", "stock", "expense", "payroll", "custom"
]);

export const systemStatusEnum = pgEnum("system_status", ["draft", "active", "archived"]);

export const moduleTypeEnum = pgEnum("module_type", [
  "table", "form", "dashboard", "report", "chart", "permissions"
]);

export const bfSystemsTable = pgTable("bf_systems", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: systemTypeEnum("type").notNull(),
  description: text("description"),
  status: systemStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const bfModulesTable = pgTable("bf_modules", {
  id: serial("id").primaryKey(),
  systemId: integer("system_id").notNull().references(() => bfSystemsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: moduleTypeEnum("type").notNull(),
  config: jsonb("config").notNull().default({}),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBFSystemSchema = createInsertSchema(bfSystemsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBFModuleSchema = createInsertSchema(bfModulesTable).omit({ id: true, createdAt: true });
export type InsertBFSystem = z.infer<typeof insertBFSystemSchema>;
export type InsertBFModule = z.infer<typeof insertBFModuleSchema>;
export type BFSystem = typeof bfSystemsTable.$inferSelect;
export type BFModule = typeof bfModulesTable.$inferSelect;
