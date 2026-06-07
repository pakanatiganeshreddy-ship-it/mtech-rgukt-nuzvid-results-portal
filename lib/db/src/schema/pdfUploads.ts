import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pdfUploadsTable = pgTable("pdf_uploads", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
  recordsExtracted: integer("records_extracted").notNull().default(0),
  recordsInserted: integer("records_inserted").notNull().default(0),
  studentsCreated: integer("students_created").notNull().default(0),
});

export const insertPdfUploadSchema = createInsertSchema(pdfUploadsTable).omit({ id: true, uploadedAt: true });
export type InsertPdfUpload = z.infer<typeof insertPdfUploadSchema>;
export type PdfUpload = typeof pdfUploadsTable.$inferSelect;
