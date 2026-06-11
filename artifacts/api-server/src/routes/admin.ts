import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createRequire } from "node:module";

const _require = createRequire(import.meta.url);
// pdf-parse v2 exports a class PDFParse — NOT a plain function
const { PDFParse } = _require("pdf-parse") as {
  PDFParse: new (opts: { data: Buffer }) => { getText: () => Promise<{ text: string }> };
};

import { db, studentsTable, resultsTable, pdfUploadsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAuth";
import { logger } from "../lib/logger";

export const adminRouter = Router();

const workspaceRoot = process.cwd().endsWith(path.join("artifacts", "api-server"))
  ? path.resolve(process.cwd(), "../..")
  : process.cwd();

const uploadsDir = path.resolve(workspaceRoot, "artifacts/api-server/uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e6);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"));
  },
  limits: { fileSize: 30 * 1024 * 1024 },
});

// RGUKT official grading scheme
const GRADE_POINTS: Record<string, number> = {
  EX: 10,
  A: 9,
  B: 8,
  C: 7,
  D: 6,
  E: 5,
  P: 0,      // Pass — audit course with 0 credits, excluded from SGPA
  FAIL: 0,
  "FAIL(R)": 0,
  F: 0,
};

function gradeToPoint(grade: string): number {
  const key = grade.toUpperCase().replace(/\s*/g, "");
  return GRADE_POINTS[key] ?? 0;
}

function normalizeGrade(raw: string): string {
  const u = raw.trim().toUpperCase().replace(/\s*/g, "");
  if (u === "EX") return "EX";
  if (u.startsWith("FAIL")) return "FAIL";
  if (u === "P") return "P";
  if (/^[ABCDE]$/.test(u)) return u;
  return raw.trim();
}

interface ExtractedRecord {
  studentId: string;
  semester: number;
  subjectCode: string;
  subjectName: string;
  credits: number;
  grade: string;
  branch: string;
  batch: string;
}

/**
 * Parse a single line from an RGUKT results PDF (pdf-parse v2 output).
 *
 * Format (single-spaced, tabs may appear before Credits/Grade):
 *   S.No  Id.No  Semester-N  Branch  SubjectCode  Specialization  SubjectName  Credits  Grade  Month, Year  Batch
 *
 * Examples:
 *   1 NM2304TE02 Semester-4 CE 21TE2192 Transportation Engineering Dissertation Part -II 16 Ex November, 2025 2023
 *   1 NM2403CP01 Semester-1 ECE 24CSP1103 Communications and Signal processing Digital Communications \t3 \tA March, 2025 2025
 */
const ROMAN_NUMERALS: Record<string, number> = {
  I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6,
  VII: 7, VIII: 8, IX: 9, X: 10,
};
const MONTH_PATTERN =
  "January|February|March|April|May|June|July|August|September|October|November|December";
const GRADE_TOKENS =
  "\\b(?:Ex|AB|[A-EP]|Fail(?:\\s*\\(R\\))?)\\b";

function parseRGUKTLine(rawLine: string): ExtractedRecord | null {
  const ROMAN: { [k: string]: number } = {
    I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10,
  };
  const MONTHS =
    "January|February|March|April|May|June|July|August|September|October|November|December";
  const GRADE = "\\b(?:Ex|AB|[A-EP]|Fail(?:\\s*\\(R\\))?)\\b";

  const l = rawLine.replace(/[\t ]+/g, " ").trim();
  if (!l || !/^\d+\s/.test(l)) return null;
  if (!/\bNM\d{4}[A-Z]{2}\d{2}\b/.test(l)) return null;

  const sidM = l.match(/\b(NM\d{4}[A-Z]{2}\d{2})\b/);
  if (!sidM) return null;

  const semM = l.match(/\bSemester-([IVX]+|\d+)\b/i);
  if (!semM) return null;
  const semStr = semM[1].toUpperCase();
  const semester = /^\d+$/.test(semStr)
    ? parseInt(semStr, 10)
    : ROMAN[semStr] ?? 0;
  if (!semester) return null;

  const brM = l.match(/\bSemester-(?:\d+|[IVX]+)\s+([A-Z]{2,4})\b/i);
  if (!brM) return null;

  const scM = l.match(/\b(\d{2}[A-Z]{2,6}\d{3,6}[A-Z]?)\b/);
  if (!scM) return null;

  const monthM = l.match(new RegExp("(?:" + MONTHS + "),?\\s*\\d{4}", "i"));
  if (!monthM) return null;

  const batchM = l.match(/\b(\d{4})\b(?!.*\b\d{4}\b)/);
  if (!batchM) return null;
  const batch = batchM[1];

  const scEnd = l.indexOf(scM[1]) + scM[1].length;
  const monthStart = l.search(
    new RegExp("(?:" + MONTHS + "),?\\s*\\d{4}", "i"),
  );
  if (monthStart <= scEnd) return null;
  const mid = l.substring(scEnd, monthStart).trim();

  const allNums = [...mid.matchAll(/(?<!\d)(\d+(?:\.\d+)?)(?!\d)/g)];
  if (!allNums.length) return null;

  const lastNum = allNums[allNums.length - 1];
  const afterLastNum = mid.substring(lastNum.index! + lastNum[0].length).trim();
  const gradeRx = new RegExp(GRADE, "gi");

  const grAfterM = afterLastNum.match(new RegExp(GRADE, "i"));

  let grade: string;
  let credits: number;

  if (grAfterM) {
    credits = parseFloat(lastNum[1]);
    grade = grAfterM[0];
  } else {
    credits = parseFloat(lastNum[1]);
    const beforeLastNum = mid.substring(0, lastNum.index!).trim();
    const allGrades = [...beforeLastNum.matchAll(gradeRx)];
    if (!allGrades.length) return null;
    grade = allGrades[allGrades.length - 1][0];
  }

  if (/^ex$/i.test(grade)) grade = "Ex";
  else grade = grade.toUpperCase();

  const subjectName = mid
    .substring(0, lastNum.index!)
    .replace(new RegExp(GRADE, "gi"), "")
    .replace(/\s+/g, " ")
    .trim();

  return {
    studentId: sidM[1],
    semester,
    branch: brM[1],
    subjectCode: scM[1],
    subjectName,
    credits,
    grade,
    batch,
  };
}

function extractRecordsFromText(text: string): ExtractedRecord[] {
  const records: ExtractedRecord[] = [];

  const rawLines = text.split("\n");
  const joined: string[] = [];

  for (const raw of rawLines) {
    const stripped = raw.replace(/\t/g, " ").trimStart();
    const isNew =
      /^\d+\s/.test(stripped) && /\bNM\d{4}[A-Z]{2}\d{2}\b/.test(stripped);
    if (isNew) {
      joined.push(stripped);
    } else if (joined.length > 0 && stripped.trim().length > 0) {
      joined[joined.length - 1] += " " + stripped.trim();
    }
  }

  for (const line of joined) {
    const record = parseRGUKTLine(line);
    if (record) {
      records.push(record);
      logger.debug({ record }, "Parsed record");
    }
  }

  logger.info({ total: records.length }, "Total records extracted from PDF");
  return records;
}
adminRouter.post("/upload-pdf", requireAdmin, upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No PDF file uploaded" });
  }

  try {
    const fileBuffer = fs.readFileSync(req.file.path);

    // pdf-parse v2: instantiate PDFParse and call getText()
    const parser = new PDFParse({ data: fileBuffer });
    const pdfData = await parser.getText();
    const text = pdfData.text;

    logger.info({ chars: text.length }, "PDF text extracted");

    const records = extractRecordsFromText(text);

    if (records.length === 0) {
      logger.warn({ sample: text.slice(0, 500) }, "No records found in PDF");
      return res.status(400).json({
        error:
          "No results could be extracted from this PDF. Please ensure it uses the standard RGUKT results table format.",
      });
    }

    let inserted = 0;
    let updated = 0;
    let errors = 0;
    let studentsAutoCreated = 0;

    for (const record of records) {
      try {
        // Auto-create student if not exists
        const [existingStudent] = await db
          .select()
          .from(studentsTable)
          .where(eq(studentsTable.studentId, record.studentId));

        if (!existingStudent) {
          await db.insert(studentsTable).values({
            studentId: record.studentId,
            name: record.studentId, // admin can rename later
            branch: record.branch,
            batch: record.batch,
            passwordHash: "123456",
          });
          studentsAutoCreated++;
        }

        const gradePoint = gradeToPoint(record.grade);

        // Check if result already exists (student + semester + subject code)
        const existingResult = await db
          .select()
          .from(resultsTable)
          .where(eq(resultsTable.studentId, record.studentId))
          .then((rows) =>
            rows.find(
              (r) =>
                r.semester === record.semester &&
                r.subjectCode === record.subjectCode
            )
          );

        if (existingResult) {
          await db
            .update(resultsTable)
            .set({
              subjectName: record.subjectName,
              credits: record.credits,
              grade: record.grade,
              gradePoint,
            })
            .where(eq(resultsTable.id, existingResult.id));
          updated++;
        } else {
          await db.insert(resultsTable).values({
            studentId: record.studentId,
            semester: record.semester,
            subjectCode: record.subjectCode,
            subjectName: record.subjectName,
            credits: record.credits,
            grade: record.grade,
            gradePoint,
          });
          inserted++;
        }
      } catch (err) {
        logger.error({ err, record }, "Error inserting record");
        errors++;
      }
    }

    const [uploadRecord] = await db
      .insert(pdfUploadsTable)
      .values({
        filename: req.file.originalname,
        recordsExtracted: records.length,
        recordsInserted: inserted,
        studentsCreated: studentsAutoCreated,
      })
      .returning();

    return res.json({
      message: `Processed ${records.length} records: ${inserted} inserted, ${updated} updated, ${studentsAutoCreated} students auto-created`,
      extracted: records.length,
      inserted,
      updated,
      studentsAutoCreated,
      errors,
      uploadId: uploadRecord.id,
    });
  } catch (err) {
    logger.error({ err }, "PDF upload error");
    return res.status(500).json({
      error: "Failed to process PDF: " + (err as Error).message,
    });
  }
});

adminRouter.delete("/uploads/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    const [deleted] = await db.delete(pdfUploadsTable).where(eq(pdfUploadsTable.id, id)).returning();
    if (!deleted) return res.status(404).json({ error: "Upload not found" });
    return res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Delete upload error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

adminRouter.get("/uploads", requireAdmin, async (_req, res) => {
  try {
    const uploads = await db
      .select()
      .from(pdfUploadsTable)
      .orderBy(sql`${pdfUploadsTable.uploadedAt} DESC`);
    return res.json(
      uploads.map((u) => ({
        id: u.id,
        filename: u.filename,
        uploadedAt: u.uploadedAt.toISOString(),
        recordsExtracted: u.recordsExtracted,
        recordsInserted: u.recordsInserted,
        studentsCreated: u.studentsCreated,
      }))
    );
  } catch (err) {
    logger.error({ err }, "List uploads error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

adminRouter.get("/stats", requireAdmin, async (_req, res) => {
  try {
    const [studentCountResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(studentsTable);
    const [resultCountResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(resultsTable);
    const [uploadCountResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(pdfUploadsTable);

    const branchRows = await db
      .selectDistinct({ branch: studentsTable.branch })
      .from(studentsTable);

    const recentUploads = await db
      .select()
      .from(pdfUploadsTable)
      .orderBy(sql`${pdfUploadsTable.uploadedAt} DESC`)
      .limit(5);

    return res.json({
      totalStudents: studentCountResult.count,
      totalResults: resultCountResult.count,
      totalUploads: uploadCountResult.count,
      branches: branchRows.map((r) => r.branch).filter(Boolean),
      recentUploads: recentUploads.map((u) => ({
        id: u.id,
        filename: u.filename,
        uploadedAt: u.uploadedAt.toISOString(),
        recordsExtracted: u.recordsExtracted,
        recordsInserted: u.recordsInserted,
        studentsCreated: u.studentsCreated,
      })),
    });
  } catch (err) {
    logger.error({ err }, "Admin stats error");
    return res.status(500).json({ error: "Internal server error" });
  }
});
