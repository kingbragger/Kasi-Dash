import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, requireAuth } from "../middleware/auth";
import { z } from "zod";

const router = Router();

const ADMIN_EMAIL = "ndlovuhenry73@gmail.com";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const profileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
});

function setAuthCookie(res: Parameters<typeof Router>[0] extends never ? never : any, token: string) {
  const isProd = process.env.NODE_ENV === "production";
  (res as any).cookie("auth_token", token, {
    httpOnly: true,
    secure: isProd,
    // cross-origin (Netlify → Render) requires SameSite=None + Secure
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

async function ensureAdminExists() {
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, ADMIN_EMAIL)).limit(1);
  if (existing.length === 0) {
    const hash = await bcrypt.hash("KasiAdmin2024!", 12);
    await db.insert(usersTable).values({
      email: ADMIN_EMAIL,
      passwordHash: hash,
      name: "Henry Ndlovu",
      role: "admin",
      isVerified: true,
    });
  }
}

ensureAdminExists().catch(console.error);

router.post("/auth/register", async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, data.email)).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const role = data.email === ADMIN_EMAIL ? "admin" : "customer";

    const [user] = await db.insert(usersTable).values({
      email: data.email,
      passwordHash,
      name: data.name,
      phone: data.phone,
      role,
      isVerified: false,
    }).returning();

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    setAuthCookie(res, token);

    res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      token,
    });
  } catch (err) {
    req.log.error({ err }, "Registration failed");
    res.status(400).json({ error: "Invalid data" });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, data.email)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    setAuthCookie(res, token);

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      token,
    });
  } catch (err) {
    req.log.error({ err }, "Login failed");
    res.status(400).json({ error: "Invalid data" });
  }
});

router.post("/auth/logout", (_req, res) => {
  res.clearCookie("auth_token", { path: "/" });
  res.json({ message: "Logged out" });
});

router.get("/auth/me", requireAuth, async (req, res) => {
  try {
    const [user] = await db.select({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      phone: usersTable.phone,
      address: usersTable.address,
      city: usersTable.city,
      province: usersTable.province,
      postalCode: usersTable.postalCode,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
    }).from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ ...user, createdAt: user.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to get user");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/forgot-password", async (req, res) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    // Validate email exists — but always return success to prevent user enumeration
    await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email)).limit(1);
    res.json({ message: "If an account with that email exists, reset instructions have been sent." });
  } catch {
    res.json({ message: "If an account with that email exists, reset instructions have been sent." });
  }
});

router.patch("/auth/profile", requireAuth, async (req, res) => {
  try {
    const data = profileSchema.parse(req.body);
    const updates: Record<string, unknown> = {};
    if (data.name) updates.name = data.name;
    if (data.phone !== undefined) updates.phone = data.phone;
    if (data.address !== undefined) updates.address = data.address;
    if (data.city !== undefined) updates.city = data.city;
    if (data.province !== undefined) updates.province = data.province;
    if (data.postalCode !== undefined) updates.postalCode = data.postalCode;

    const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, req.user!.userId)).returning({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      phone: usersTable.phone,
      address: usersTable.address,
      city: usersTable.city,
      province: usersTable.province,
      postalCode: usersTable.postalCode,
      role: usersTable.role,
    });

    res.json(user);
  } catch (err) {
    req.log.error({ err }, "Failed to update profile");
    res.status(400).json({ error: "Invalid data" });
  }
});

export default router;
