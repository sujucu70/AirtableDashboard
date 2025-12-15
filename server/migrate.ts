import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

/**
 * Creates database tables if they don't exist
 * This is called on server startup to ensure tables are ready
 */
export async function ensureTablesExist(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.log("[Migration] No DATABASE_URL configured, skipping table creation");
    return;
  }

  try {
    const db = drizzle(process.env.DATABASE_URL);
    
    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        openId VARCHAR(64) NOT NULL UNIQUE,
        name TEXT,
        email VARCHAR(320),
        loginMethod VARCHAR(64),
        role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        lastSignedIn TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("[Migration] Users table ready");

    // Create call_evaluations table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS call_evaluations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        callId VARCHAR(128) NOT NULL UNIQUE,
        operatorId VARCHAR(64),
        operatorName VARCHAR(128),
        scenarioId VARCHAR(64),
        scenarioName VARCHAR(256),
        proceso ENUM('COBROS', 'ATENCION', 'RECLAMACIONES', 'GESTION SINGULAR', 'FACTURACION', 'CONTRATACION', 'DESCONOCIDO') DEFAULT 'DESCONOCIDO',
        priority ENUM('P0', 'P1') DEFAULT 'P0',
        adherenceScore DECIMAL(5, 2),
        sentimentScore DECIMAL(5, 2),
        correctnessScore DECIMAL(5, 2),
        speedScore DECIMAL(5, 2),
        averageScore DECIMAL(5, 2),
        status VARCHAR(64),
        feedback TEXT,
        areasMejora TEXT,
        fortalezas TEXT,
        criticalIssues TEXT,
        durationSeconds INT,
        evaluatedAt TIMESTAMP NULL,
        rawClaudeResponse TEXT,
        expectedWrapup TEXT,
        expectedSteps TEXT,
        airtableRecordId VARCHAR(64),
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("[Migration] Call evaluations table ready");

    console.log("[Migration] All tables created successfully");
  } catch (error) {
    console.error("[Migration] Failed to create tables:", error);
    // Don't throw - let the app continue and show errors when DB is accessed
  }
}
