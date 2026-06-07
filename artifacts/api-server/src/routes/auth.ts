import { Router } from "express";
import { db, studentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

declare module "express-session" {
  interface SessionData {
    role?: "student" | "admin";
    studentId?: string;
    name?: string;
    username?: string;
  }
}

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

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

authRouter.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid admin credentials" });
  }
  req.session.role = "admin";
  req.session.username = username;
  req.session.name = "Administrator";
  return res.json({ username, role: "admin" });
});

authRouter.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
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
