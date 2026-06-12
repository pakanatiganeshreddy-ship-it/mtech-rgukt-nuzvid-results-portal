import { Router } from "express";
import { db, resultsTable, studentsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAdmin, requireStudent } from "../middlewares/requireAuth";
import { logger } from "../lib/logger";

export const resultsRouter = Router();

const GRADE_POINTS: Record<string, number> = {
  EX: 10,
  A: 9,
  B: 8,
  C: 7,
  D: 6,
  E: 5,
  FAIL: 0,
  F: 0,
};

function gradeToPoint(grade: string): number {
  return GRADE_POINTS[grade.toUpperCase()] ?? 0;
}

function calcSGPA(results: { credits: number; gradePoint: number }[]): number {
  const totalCredits = results.reduce((s, r) => s + r.credits, 0);
  if (totalCredits === 0) return 0;
  const weightedSum = results.reduce((s, r) => s + r.credits * r.gradePoint, 0);
  return Math.round((weightedSum / totalCredits) * 100) / 100;
}

resultsRouter.get("/student/:studentId", requireStudent, async (req, res) => {
  try {
    const { studentId } = req.params;
    if (
      req.session.role === "student" &&
      req.session.studentId !== studentId
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const [student] = await db
      .select()
      .from(studentsTable)
      .where(eq(studentsTable.studentId, studentId));
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
    const rawResults = await db
      .select()
      .from(resultsTable)
      .where(eq(resultsTable.studentId, studentId))
      .orderBy(resultsTable.semester, resultsTable.subjectCode);

    const semMap = new Map<number, typeof rawResults>();
    for (const r of rawResults) {
      if (!semMap.has(r.semester)) semMap.set(r.semester, []);
      semMap.get(r.semester)!.push(r);
    }
    const semesters = Array.from(semMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([semester, results]) => {
        const sgpa = calcSGPA(results);
        const totalCredits = results.reduce((s, r) => s + r.credits, 0);
        return {
          semester,
          sgpa,
          totalCredits,
          results: results.map((r) => ({
            id: r.id,
            studentId: r.studentId,
            semester: r.semester,
            subjectCode: r.subjectCode,
            subjectName: r.subjectName,
            credits: r.credits,
            grade: r.grade,
            gradePoint: r.gradePoint,
            createdAt: r.createdAt.toISOString(),
          })),
        };
      });

    let cgpa = 0;
    if (semesters.length > 0) {
      const allCredits = semesters.reduce((s, sem) => s + sem.totalCredits, 0);
      const weightedSum = semesters.reduce(
        (s, sem) => s + sem.sgpa * sem.totalCredits,
        0
      );
      cgpa = allCredits > 0 ? Math.round((weightedSum / allCredits) * 100) / 100 : 0;
    }

    return res.json({
      student: {
        id: student.id,
        studentId: student.studentId,
        name: student.name,
        branch: student.branch,
        batch: student.batch,
        createdAt: student.createdAt.toISOString(),
      },
      semesters,
      cgpa,
    });
  } catch (err) {
    logger.error({ err }, "Get student results error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

resultsRouter.get("/", requireAdmin, async (req, res) => {
  try {
    const { studentId, semester } = req.query as {
      studentId?: string;
      semester?: string;
    };
    let rows = await db
      .select()
      .from(resultsTable)
      .orderBy(resultsTable.studentId, resultsTable.semester, resultsTable.subjectCode);
    if (studentId) {
      rows = rows.filter((r) => r.studentId === studentId);
    }
    if (semester) {
      const sem = parseInt(semester, 10);
      if (!isNaN(sem)) {
        rows = rows.filter((r) => r.semester === sem);
      }
    }
    return res.json(
      rows.map((r) => ({
        id: r.id,
        studentId: r.studentId,
        semester: r.semester,
        subjectCode: r.subjectCode,
        subjectName: r.subjectName,
        credits: r.credits,
        grade: r.grade,
        gradePoint: r.gradePoint,
        createdAt: r.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    logger.error({ err }, "List results error");
    return res.status(500).json({ error: "Internal server error" });
  }
});
// Delete a single result by ID
resultsRouter.delete("/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
  try {
    const [deleted] = await db
      .delete(resultsTable)
      .where(eq(resultsTable.id, id))
      .returning();
    if (!deleted) return res.status(404).json({ error: "Result not found" });
    return res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Delete result error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Delete ALL results
resultsRouter.delete("/", requireAdmin, async (req, res) => {
  try {
    await db.delete(resultsTable);
    return res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Delete all results error");
    return res.status(500).json({ error: "Internal server error" });
  }
});
