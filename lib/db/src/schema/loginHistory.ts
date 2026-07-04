import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const loginHistoryTable = pgTable("login_history", {
  id: serial("id").primaryKey(),
  studentId: text("student_id").notNull(),
  studentName: text("student_name").notNull().default(""),
  branch: text("branch"),
  batch: text("batch"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  deviceType: text("device_type").notNull().default("Desktop"),
  loginAt: timestamp("login_at", { withTimezone: true }).notNull().defaultNow(),
});
