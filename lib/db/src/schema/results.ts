import { pgTable, text, serial, timestamp, integer, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const resultsTable = pgTable("results", {
  id: serial("id").primaryKey(),
  studentId: text("student_id").notNull(),
  semester: integer("semester").notNull(),
  subjectCode: text("subject_code").notNull(),
  subjectName: text("subject_name").notNull(),
  credits: doublePrecision("credits").notNull(),
  grade: text("grade").notNull(),
  gradePoint: doublePrecision("grade_point").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertResultSchema = createInsertSchema(resultsTable).omit({ id: true, createdAt: true });
export type InsertResult = z.infer<typeof insertResultSchema>;
export type Result = typeof resultsTable.$inferSelect;
