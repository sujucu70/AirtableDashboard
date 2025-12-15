import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Call evaluations table - stores evaluation data from Airtable
 */
export const callEvaluations = mysqlTable("call_evaluations", {
  id: int("id").autoincrement().primaryKey(),
  callId: varchar("callId", { length: 128 }).notNull().unique(),
  operatorId: varchar("operatorId", { length: 64 }),
  operatorName: varchar("operatorName", { length: 128 }),
  scenarioId: varchar("scenarioId", { length: 64 }),
  scenarioName: varchar("scenarioName", { length: 256 }),
  proceso: mysqlEnum("proceso", [
    "COBROS",
    "ATENCION",
    "RECLAMACIONES",
    "GESTION SINGULAR",
    "FACTURACION",
    "CONTRATACION",
    "DESCONOCIDO"
  ]).default("DESCONOCIDO"),
  priority: mysqlEnum("priority", ["P0", "P1"]).default("P0"),
  adherenceScore: decimal("adherenceScore", { precision: 5, scale: 2 }),
  sentimentScore: decimal("sentimentScore", { precision: 5, scale: 2 }),
  correctnessScore: decimal("correctnessScore", { precision: 5, scale: 2 }),
  speedScore: decimal("speedScore", { precision: 5, scale: 2 }),
  averageScore: decimal("averageScore", { precision: 5, scale: 2 }),
  status: varchar("status", { length: 64 }),
  feedback: text("feedback"),
  areasMejora: text("areasMejora"),
  fortalezas: text("fortalezas"),
  criticalIssues: text("criticalIssues"),
  durationSeconds: int("durationSeconds"),
  evaluatedAt: timestamp("evaluatedAt"),
  rawClaudeResponse: text("rawClaudeResponse"),
  expectedWrapup: text("expectedWrapup"),
  expectedSteps: text("expectedSteps"),
  airtableRecordId: varchar("airtableRecordId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CallEvaluation = typeof callEvaluations.$inferSelect;
export type InsertCallEvaluation = typeof callEvaluations.$inferInsert;
