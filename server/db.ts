import { eq, like, or, and, gte, lte, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users, callEvaluations, InsertCallEvaluation, CallEvaluation } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: any = null;
let _pool: mysql.Pool | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Parse the DATABASE_URL
      const dbUrl = new URL(process.env.DATABASE_URL);
      
      // Create connection pool with SSL enabled for TiDB Cloud
      _pool = mysql.createPool({
        host: dbUrl.hostname,
        port: parseInt(dbUrl.port) || 4000,
        user: dbUrl.username,
        password: dbUrl.password,
        database: dbUrl.pathname.slice(1), // Remove leading /
        ssl: {
          minVersion: 'TLSv1.2',
          rejectUnauthorized: true
        },
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
      
      _db = drizzle(_pool);
      console.log("[Database] Connected successfully with SSL");
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
      _pool = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Call Evaluations functions

export async function upsertCallEvaluation(evaluation: InsertCallEvaluation): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.insert(callEvaluations).values(evaluation).onDuplicateKeyUpdate({
    set: {
      operatorId: evaluation.operatorId,
      operatorName: evaluation.operatorName,
      scenarioId: evaluation.scenarioId,
      scenarioName: evaluation.scenarioName,
      proceso: evaluation.proceso,
      priority: evaluation.priority,
      adherenceScore: evaluation.adherenceScore,
      sentimentScore: evaluation.sentimentScore,
      correctnessScore: evaluation.correctnessScore,
      speedScore: evaluation.speedScore,
      averageScore: evaluation.averageScore,
      status: evaluation.status,
      feedback: evaluation.feedback,
      areasMejora: evaluation.areasMejora,
      fortalezas: evaluation.fortalezas,
      criticalIssues: evaluation.criticalIssues,
      durationSeconds: evaluation.durationSeconds,
      evaluatedAt: evaluation.evaluatedAt,
      rawClaudeResponse: evaluation.rawClaudeResponse,
      expectedWrapup: evaluation.expectedWrapup,
      expectedSteps: evaluation.expectedSteps,
      airtableRecordId: evaluation.airtableRecordId,
      updatedAt: new Date(),
    },
  });
}

export async function bulkUpsertCallEvaluations(evaluations: InsertCallEvaluation[]): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  for (const evaluation of evaluations) {
    await upsertCallEvaluation(evaluation);
  }
}

export async function getAllCallEvaluations(): Promise<CallEvaluation[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db.select().from(callEvaluations).orderBy(desc(callEvaluations.createdAt));
}

export interface CallEvaluationFilters {
  search?: string;
  operatorName?: string;
  proceso?: string;
  priority?: string;
  scenarioId?: string;
  minScore?: number;
  maxScore?: number;
  startDate?: Date;
  endDate?: Date;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function getFilteredCallEvaluations(filters: CallEvaluationFilters): Promise<CallEvaluation[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  const conditions = [];

  if (filters.search) {
    const searchTerm = `%${filters.search}%`;
    conditions.push(
      or(
        like(callEvaluations.callId, searchTerm),
        like(callEvaluations.operatorName, searchTerm),
        like(callEvaluations.scenarioName, searchTerm),
        like(callEvaluations.feedback, searchTerm)
      )
    );
  }

  if (filters.operatorName) {
    conditions.push(eq(callEvaluations.operatorName, filters.operatorName));
  }

  if (filters.proceso) {
    conditions.push(eq(callEvaluations.proceso, filters.proceso as any));
  }

  if (filters.priority) {
    conditions.push(eq(callEvaluations.priority, filters.priority as any));
  }

  if (filters.scenarioId) {
    conditions.push(eq(callEvaluations.scenarioId, filters.scenarioId));
  }

  if (filters.minScore !== undefined) {
    conditions.push(gte(callEvaluations.averageScore, filters.minScore.toString()));
  }

  if (filters.maxScore !== undefined) {
    conditions.push(lte(callEvaluations.averageScore, filters.maxScore.toString()));
  }

  if (filters.startDate) {
    conditions.push(gte(callEvaluations.evaluatedAt, filters.startDate));
  }

  if (filters.endDate) {
    conditions.push(lte(callEvaluations.evaluatedAt, filters.endDate));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Determine sort column and order
  const sortOrder = filters.sortOrder === 'asc' ? asc : desc;
  let orderByClause;

  switch (filters.sortBy) {
    case 'operatorName':
      orderByClause = sortOrder(callEvaluations.operatorName);
      break;
    case 'proceso':
      orderByClause = sortOrder(callEvaluations.proceso);
      break;
    case 'priority':
      orderByClause = sortOrder(callEvaluations.priority);
      break;
    case 'averageScore':
      orderByClause = sortOrder(callEvaluations.averageScore);
      break;
    case 'adherenceScore':
      orderByClause = sortOrder(callEvaluations.adherenceScore);
      break;
    case 'sentimentScore':
      orderByClause = sortOrder(callEvaluations.sentimentScore);
      break;
    case 'correctnessScore':
      orderByClause = sortOrder(callEvaluations.correctnessScore);
      break;
    case 'speedScore':
      orderByClause = sortOrder(callEvaluations.speedScore);
      break;
    case 'durationSeconds':
      orderByClause = sortOrder(callEvaluations.durationSeconds);
      break;
    case 'evaluatedAt':
      orderByClause = sortOrder(callEvaluations.evaluatedAt);
      break;
    default:
      orderByClause = desc(callEvaluations.createdAt);
  }

  if (whereClause) {
    return await db.select().from(callEvaluations).where(whereClause).orderBy(orderByClause);
  }

  return await db.select().from(callEvaluations).orderBy(orderByClause);
}

export async function getCallEvaluationStats() {
  const db = await getDb();
  if (!db) {
    return null;
  }

  const allEvaluations = await db.select().from(callEvaluations);
  
  const totalCalls = allEvaluations.length;
  
  // Calculate average score
  const scoresWithValues = allEvaluations.filter((e: CallEvaluation) => e.averageScore !== null);
  const overallAverageScore = scoresWithValues.length > 0
    ? scoresWithValues.reduce((sum: number, e: CallEvaluation) => sum + parseFloat(e.averageScore || '0'), 0) / scoresWithValues.length
    : 0;

  // Distribution by proceso
  const procesoDistribution: Record<string, number> = {};
  allEvaluations.forEach((e: CallEvaluation) => {
    const proceso = e.proceso || 'DESCONOCIDO';
    procesoDistribution[proceso] = (procesoDistribution[proceso] || 0) + 1;
  });

  // Distribution by priority
  const priorityDistribution: Record<string, number> = {};
  allEvaluations.forEach((e: CallEvaluation) => {
    const priority = e.priority || 'P0';
    priorityDistribution[priority] = (priorityDistribution[priority] || 0) + 1;
  });

  // Top performing operators
  const operatorScores: Record<string, { total: number; count: number; name: string }> = {};
  allEvaluations.forEach((e: CallEvaluation) => {
    if (e.operatorName && e.averageScore) {
      const name = e.operatorName;
      if (!operatorScores[name]) {
        operatorScores[name] = { total: 0, count: 0, name };
      }
      operatorScores[name].total += parseFloat(e.averageScore);
      operatorScores[name].count += 1;
    }
  });

  const topOperators = Object.values(operatorScores)
    .map(o => ({ name: o.name, averageScore: o.total / o.count, callCount: o.count }))
    .sort((a, b) => b.averageScore - a.averageScore)
    .slice(0, 5);

  // Get unique operators and scenarios for filters
  const uniqueOperators: string[] = Array.from(new Set(allEvaluations.map((e: CallEvaluation) => e.operatorName).filter((n: string | null): n is string => n !== null)));
  const uniqueScenarios: string[] = Array.from(new Set(allEvaluations.map((e: CallEvaluation) => e.scenarioId).filter((n: string | null): n is string => n !== null)));

  return {
    totalCalls,
    overallAverageScore: Math.round(overallAverageScore * 100) / 100,
    procesoDistribution,
    priorityDistribution,
    topOperators,
    uniqueOperators,
    uniqueScenarios,
  };
}

export async function getCallEvaluationById(id: number): Promise<CallEvaluation | undefined> {
  const db = await getDb();
  if (!db) {
    return undefined;
  }

  const result = await db.select().from(callEvaluations).where(eq(callEvaluations.id, id)).limit(1);
  return result[0];
}

export async function deleteAllCallEvaluations(): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.delete(callEvaluations);
}


// Trends data for charts
export interface TrendDataPoint {
  date: string;
  averageScore: number;
  adherenceScore: number;
  sentimentScore: number;
  correctnessScore: number;
  speedScore: number;
  callCount: number;
}

export interface OperatorTrend {
  operatorName: string;
  data: TrendDataPoint[];
}

export interface TrendsFilter {
  operatorName?: string;
  startDate?: string;
  endDate?: string;
}

export async function getScoreTrends(filter?: TrendsFilter): Promise<{
  overall: TrendDataPoint[];
  byOperator: OperatorTrend[];
}> {
  const db = await getDb();
  if (!db) {
    return { overall: [], byOperator: [] };
  }

  const allEvaluations = await db.select().from(callEvaluations);
  
  // Parse date filters
  const startDate = filter?.startDate ? new Date(filter.startDate) : null;
  const endDate = filter?.endDate ? new Date(filter.endDate + 'T23:59:59') : null;
  const operatorName = filter?.operatorName;
  
  // Group evaluations by date
  const byDate: Record<string, {
    scores: { avg: number; adh: number; sent: number; corr: number; speed: number }[];
    count: number;
  }> = {};

  const byOperatorAndDate: Record<string, Record<string, {
    scores: { avg: number; adh: number; sent: number; corr: number; speed: number }[];
    count: number;
  }>> = {};

  allEvaluations.forEach((e: CallEvaluation) => {
    // Use evaluatedAt or createdAt for date grouping
    const dateObj = e.evaluatedAt || e.createdAt;
    if (!dateObj) return;
    
    // Apply date filters
    const evalDate = new Date(dateObj);
    if (startDate && evalDate < startDate) return;
    if (endDate && evalDate > endDate) return;
    
    const date = evalDate.toISOString().split('T')[0];
    
    const scores = {
      avg: e.averageScore ? parseFloat(e.averageScore) : 0,
      adh: e.adherenceScore ? parseFloat(e.adherenceScore) : 0,
      sent: e.sentimentScore ? parseFloat(e.sentimentScore) : 0,
      corr: e.correctnessScore ? parseFloat(e.correctnessScore) : 0,
      speed: e.speedScore ? parseFloat(e.speedScore) : 0,
    };

    // Overall trends
    if (!byDate[date]) {
      byDate[date] = { scores: [], count: 0 };
    }
    byDate[date].scores.push(scores);
    byDate[date].count++;

    // By operator trends
    const opName = e.operatorName || 'Unknown';
    if (!byOperatorAndDate[opName]) {
      byOperatorAndDate[opName] = {};
    }
    if (!byOperatorAndDate[opName][date]) {
      byOperatorAndDate[opName][date] = { scores: [], count: 0 };
    }
    byOperatorAndDate[opName][date].scores.push(scores);
    byOperatorAndDate[opName][date].count++;
  });

  // Calculate overall trends
  const overall: TrendDataPoint[] = Object.entries(byDate)
    .map(([date, data]) => {
      const avgScores = {
        averageScore: data.scores.reduce((sum, s) => sum + s.avg, 0) / data.scores.length,
        adherenceScore: data.scores.reduce((sum, s) => sum + s.adh, 0) / data.scores.length,
        sentimentScore: data.scores.reduce((sum, s) => sum + s.sent, 0) / data.scores.length,
        correctnessScore: data.scores.reduce((sum, s) => sum + s.corr, 0) / data.scores.length,
        speedScore: data.scores.reduce((sum, s) => sum + s.speed, 0) / data.scores.length,
      };
      return {
        date,
        ...avgScores,
        callCount: data.count,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  // Calculate by operator trends
  const byOperator: OperatorTrend[] = Object.entries(byOperatorAndDate)
    .filter(([name]) => !operatorName || name === operatorName)
    .map(([operatorName, dates]) => ({
      operatorName,
      data: Object.entries(dates)
        .map(([date, data]) => ({
          date,
          averageScore: data.scores.reduce((sum, s) => sum + s.avg, 0) / data.scores.length,
          adherenceScore: data.scores.reduce((sum, s) => sum + s.adh, 0) / data.scores.length,
          sentimentScore: data.scores.reduce((sum, s) => sum + s.sent, 0) / data.scores.length,
          correctnessScore: data.scores.reduce((sum, s) => sum + s.corr, 0) / data.scores.length,
          speedScore: data.scores.reduce((sum, s) => sum + s.speed, 0) / data.scores.length,
          callCount: data.count,
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    }))
    .filter(op => op.data.length > 0);

  return { overall, byOperator };
}
