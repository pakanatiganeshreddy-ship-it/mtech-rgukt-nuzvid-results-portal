import { Router } from "express";
import { db, studentsTable, resultsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin, requireStudent } from "../middlewares/requireAuth";
import { logger } from "../lib/logger";

function calcSGPA(results: { credits: number; gradePoint: number }[]): number {
  const totalCredits = results.reduce((s, r) => s + r.credits, 0);
  if (totalCredits === 0) return 0;
  return Math.round((results.reduce((s, r) => s + r.credits * r.gradePoint, 0) / totalCredits) * 100) / 100;
}

export const studentsRouter = Router();

studentsRouter.get("/", requireAdmin, async (req, res) => {
  try {
    const { search, branch } = req.query as { search?: string; branch?: string };
    let rows = await db.select().from(studentsTable).orderBy(studentsTable.studentId);
    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter(
        (r) => r.studentId.toLowerCase().includes(s) || r.name.toLowerCase().includes(s)
      );
    }
    if (branch) {
      rows = rows.filter((r) => r.branch.toLowerCase() === branch.toLowerCase());
    }
    return res.json(
      rows.map((r) => ({
        id: r.id,
        studentId: r.studentId,
        name: r.name,
        branch: r.branch,
        batch: r.batch,
        createdAt: r.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    logger.error({ err }, "List students error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

studentsRouter.post("/", requireAdmin, async (req, res) => {
  try {
    const { studentId, name, branch, batch, password } = req.body;
    const [student] = await db
      .insert(studentsTable)
      .values({
        studentId,
        name,
        branch,
        batch: batch ?? "",
        passwordHash: password ?? "123456",
      })
      .returning();
    return res.status(201).json({
      id: student.id,
      studentId: student.studentId,
      name: student.name,
      branch: student.branch,
      batch: student.batch,
      createdAt: student.createdAt.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Create student error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

studentsRouter.post("/:studentId/reset-password", requireAdmin, async (req, res) => {
  try {
    const { studentId } = req.params;
    const [student] = await db
      .update(studentsTable)
      .set({ passwordHash: "123456" })
      .where(eq(studentsTable.studentId, studentId))
      .returning();
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
    return res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Reset student password error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

studentsRouter.get("/:studentId/results", requireStudent, async (req, res) => {
  try {
    const { studentId } = req.params;
    if (req.session.role === "student" && req.session.studentId !== studentId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const [student] = await db.select().from(studentsTable).where(eq(studentsTable.studentId, studentId));
    if (!student) return res.status(404).json({ error: "Student not found" });

    const rawResults = await db
      .select().from(resultsTable).where(eq(resultsTable.studentId, studentId))
      .orderBy(resultsTable.semester, resultsTable.subjectCode);

    const semMap = new Map<number, typeof rawResults>();
    for (const r of rawResults) {
      if (!semMap.has(r.semester)) semMap.set(r.semester, []);
      semMap.get(r.semester)!.push(r);
    }
    const semesters = Array.from(semMap.entries()).sort(([a], [b]) => a - b).map(([semester, results]) => ({
      semester,
      sgpa: calcSGPA(results),
      totalCredits: results.reduce((s, r) => s + r.credits, 0),
      results: results.map((r) => ({
        id: r.id, studentId: r.studentId, semester: r.semester,
        subjectCode: r.subjectCode, subjectName: r.subjectName,
        credits: r.credits, grade: r.grade, gradePoint: r.gradePoint,
        createdAt: r.createdAt.toISOString(),
      })),
    }));

    const allCredits = semesters.reduce((s, sem) => s + sem.totalCredits, 0);
    const cgpa = allCredits > 0
      ? Math.round((semesters.reduce((s, sem) => s + sem.sgpa * sem.totalCredits, 0) / allCredits) * 100) / 100
      : 0;

    return res.json({
      student: { id: student.id, studentId: student.studentId, name: student.name, branch: student.branch, batch: student.batch, createdAt: student.createdAt.toISOString() },
      semesters,
      cgpa,
    });
  } catch (err) {
    logger.error({ err }, "Get student results error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

studentsRouter.get("/:studentId", requireStudent, async (req, res) => {
  try {
    const { studentId } = req.params;
    if (req.session.role === "student" && req.session.studentId !== studentId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const [student] = await db
      .select()
      .from(studentsTable)
      .where(eq(studentsTable.studentId, studentId));
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
    return res.json({
      id: student.id,
      studentId: student.studentId,
      name: student.name,
      branch: student.branch,
      batch: student.batch,
      createdAt: student.createdAt.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Get student error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

studentsRouter.delete("/:studentId", requireAdmin, async (req, res) => {
  try {
    const { studentId } = req.params;
    await db.delete(resultsTable).where(eq(resultsTable.studentId, studentId));
    const [deleted] = await db.delete(studentsTable).where(eq(studentsTable.studentId, studentId)).returning();
    if (!deleted) return res.status(404).json({ error: "Student not found" });
    return res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Delete student error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

studentsRouter.patch("/:studentId", requireAdmin, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { name, branch, batch } = req.body;
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (branch !== undefined) updates.branch = branch;
    if (batch !== undefined) updates.batch = batch;
    const [student] = await db
      .update(studentsTable)
      .set(updates)
      .where(eq(studentsTable.studentId, studentId))
      .returning();
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
    return res.json({
      id: student.id,
      studentId: student.studentId,
      name: student.name,
      branch: student.branch,
      batch: student.batch,
      createdAt: student.createdAt.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Update student error");
    return res.status(500).json({ error: "Internal server error" });
  }
});
