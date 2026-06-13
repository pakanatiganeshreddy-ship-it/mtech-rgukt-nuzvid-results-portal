import { Router } from "express";
import { db, studentsTable, adminSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireStudent, requireAdmin } from "../middlewares/requireAuth";
import crypto from "node:crypto";
import nodemailer from "nodemailer";

declare module "express-session" {
  interface SessionData {
    role?: "student" | "admin";
    studentId?: string;
    name?: string;
    username?: string;
  }
}

const ADMIN_USERNAME = "admin";
const DEFAULT_ADMIN_PASSWORD = "admin123";

export const authRouter = Router();

authRouter.post("/student/login", async (req, res) => {
  const { studentId, password } = req.body;
  if (!studentId || !password) {
    return res.status(400).json({ error: "Student ID and password are required" });
  }
  try {
    const [student] = await db
      .select()
      .from(studentsTable)
      .where(eq(studentsTable.studentId, studentId));
    if (!student) {
      return res.status(401).json({ error: "Invalid student ID or password" });
    }
    if (student.passwordHash !== password) {
      return res.status(401).json({ error: "Invalid student ID or password" });
    }
    req.session.role = "student";
    req.session.studentId = student.studentId;
    req.session.name = student.name;
    return res.json({ studentId: student.studentId, name: student.name, role: "student" });
  } catch (err) {
    logger.error({ err }, "Student login error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

authRouter.post("/student/change-password", requireStudent, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current password and new password are required" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "New password must be at least 6 characters" });
  }
  try {
    const studentId = req.session.studentId!;
    const [student] = await db
      .select()
      .from(studentsTable)
      .where(eq(studentsTable.studentId, studentId));
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
    if (student.passwordHash !== currentPassword) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }
    await db
      .update(studentsTable)
      .set({ passwordHash: newPassword })
      .where(eq(studentsTable.studentId, studentId));
    return res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Change password error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

authRouter.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;
  if (username !== ADMIN_USERNAME) {
    return res.status(401).json({ error: "Invalid admin credentials" });
  }
  try {
    const [stored] = await db
      .select()
      .from(adminSettingsTable)
      .where(eq(adminSettingsTable.key, "admin_password"));
    const expectedPassword = stored ? stored.value : DEFAULT_ADMIN_PASSWORD;
    if (password !== expectedPassword) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }
    req.session.role = "admin";
    req.session.username = username;
    req.session.name = "Administrator";
    return res.json({ username, role: "admin" });
  } catch (err) {
    logger.error({ err }, "Admin login error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

authRouter.post("/admin/change-password", requireAdmin, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current password and new password are required" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "New password must be at least 6 characters" });
  }
  try {
    const [stored] = await db
      .select()
      .from(adminSettingsTable)
      .where(eq(adminSettingsTable.key, "admin_password"));
    const expectedPassword = stored ? stored.value : DEFAULT_ADMIN_PASSWORD;
    if (currentPassword !== expectedPassword) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }
    await db
      .insert(adminSettingsTable)
      .values({ key: "admin_password", value: newPassword })
      .onConflictDoUpdate({
        target: adminSettingsTable.key,
        set: { value: newPassword, updatedAt: new Date() },
      });
    return res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Admin change password error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

authRouter.post("/logout", (req, res) => {
  req.session = null;
  res.json({ success: true });
});

authRouter.get("/me", (req, res) => {
  if (!req.session.role) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  return res.json({
    role: req.session.role,
    id: req.session.role === "student" ? req.session.studentId : req.session.username,
    name: req.session.name ?? "",
  });
});

authRouter.post("/admin/forgot-password", async (req, res) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      return res.status(500).json({ error: "Admin email not configured on the server." });
    }
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return res.status(500).json({ error: "Email service not configured on the server." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    await db
      .insert(adminSettingsTable)
      .values({ key: "admin_reset_token", value: token })
      .onConflictDoUpdate({
        target: adminSettingsTable.key,
        set: { value: token, updatedAt: new Date() },
      });
    await db
      .insert(adminSettingsTable)
      .values({ key: "admin_reset_token_expiry", value: expiry })
      .onConflictDoUpdate({
        target: adminSettingsTable.key,
        set: { value: expiry, updatedAt: new Date() },
      });

    const proto = req.headers["x-forwarded-proto"] || req.protocol;
    const host = req.headers["x-forwarded-host"] || req.get("host");
    const siteUrl = process.env.SITE_URL || `${proto}://${host}`;
    const resetUrl = `${siteUrl}/admin/reset-password?token=${token}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"RGUKT Portal" <${process.env.GMAIL_USER}>`,
      to: adminEmail,
      subject: "RGUKT Portal — Admin Password Reset",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#1e3a8a">Admin Password Reset</h2>
          <p>You requested a password reset for the <strong>RGUKT M.Tech Results Portal</strong> admin account.</p>
          <p>Click the button below to reset your password. This link expires in <strong>30 minutes</strong>.</p>
          <a href="${resetUrl}"
             style="display:inline-block;background:#1e3a8a;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0">
            Reset Password
          </a>
          <p style="color:#666;font-size:13px">Or copy this link into your browser:<br/>${resetUrl}</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
          <p style="color:#999;font-size:12px">If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    return res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Forgot password error");
    return res.status(500).json({ error: "Failed to send reset email. Check server email configuration." });
  }
});

authRouter.post("/admin/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: "Token and new password are required" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }
  try {
    const [tokenRow] = await db
      .select()
      .from(adminSettingsTable)
      .where(eq(adminSettingsTable.key, "admin_reset_token"));
    const [expiryRow] = await db
      .select()
      .from(adminSettingsTable)
      .where(eq(adminSettingsTable.key, "admin_reset_token_expiry"));

    if (!tokenRow || tokenRow.value !== token) {
      return res.status(400).json({ error: "Invalid reset token. Please request a new one." });
    }
    if (!expiryRow || new Date(expiryRow.value) < new Date()) {
      return res.status(400).json({ error: "Reset token has expired. Please request a new one." });
    }

    await db
      .insert(adminSettingsTable)
      .values({ key: "admin_password", value: newPassword })
      .onConflictDoUpdate({
        target: adminSettingsTable.key,
        set: { value: newPassword, updatedAt: new Date() },
      });

    await db.delete(adminSettingsTable).where(eq(adminSettingsTable.key, "admin_reset_token"));
    await db.delete(adminSettingsTable).where(eq(adminSettingsTable.key, "admin_reset_token_expiry"));

    return res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Reset password error");
    return res.status(500).json({ error: "Internal server error" });
  }
});
