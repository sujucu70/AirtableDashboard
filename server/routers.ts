import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getAllCallEvaluations,
  getFilteredCallEvaluations,
  getCallEvaluationStats,
  getCallEvaluationById,
  bulkUpsertCallEvaluations,
  deleteAllCallEvaluations,
  getScoreTrends,
  CallEvaluationFilters,
} from "./db";
import { InsertCallEvaluation } from "../drizzle/schema";

// Airtable configuration
const AIRTABLE_BASE_ID = "appM5kUClvEWfr7N2";
const AIRTABLE_TABLE_ID = "tblQQclGfKeDvLM2U";

interface AirtableRecord {
  id: string;
  fields: {
    call_id?: string;
    operator_id?: string;
    operator_name?: string;
    scenario_id?: string;
    scenario_name?: string;
    proceso?: string;
    priority?: string;
    adherence_score?: number;
    sentiment_score?: number;
    correctness_score?: number;
    speed_score?: number;
    average_score?: number;
    status?: string;
    feedback?: string;
    areas_mejora?: string;
    fortalezas?: string;
    critical_issues?: string;
    duration_seconds?: number;
    evaluated_at?: string;
    raw_claude_response?: string;
    expected_wrapup?: string;
    expected_steps?: string;
  };
}

function mapAirtableToEvaluation(record: AirtableRecord): InsertCallEvaluation {
  const fields = record.fields;
  
  // Normalize proceso value
  let proceso: InsertCallEvaluation['proceso'] = 'DESCONOCIDO';
  if (fields.proceso) {
    const procesoUpper = fields.proceso.toUpperCase();
    if (['COBROS', 'ATENCION', 'RECLAMACIONES', 'GESTION SINGULAR', 'FACTURACION', 'CONTRATACION'].includes(procesoUpper)) {
      proceso = procesoUpper as InsertCallEvaluation['proceso'];
    }
  }

  // Normalize priority value
  let priority: InsertCallEvaluation['priority'] = 'P0';
  if (fields.priority === 'P1') {
    priority = 'P1';
  }

  return {
    callId: fields.call_id || record.id,
    operatorId: fields.operator_id || null,
    operatorName: fields.operator_name || null,
    scenarioId: fields.scenario_id || null,
    scenarioName: fields.scenario_name || null,
    proceso,
    priority,
    adherenceScore: fields.adherence_score?.toString() || null,
    sentimentScore: fields.sentiment_score?.toString() || null,
    correctnessScore: fields.correctness_score?.toString() || null,
    speedScore: fields.speed_score?.toString() || null,
    averageScore: fields.average_score?.toString() || null,
    status: fields.status || null,
    feedback: fields.feedback || null,
    areasMejora: fields.areas_mejora || null,
    fortalezas: fields.fortalezas || null,
    criticalIssues: fields.critical_issues || null,
    durationSeconds: fields.duration_seconds || null,
    evaluatedAt: fields.evaluated_at ? new Date(fields.evaluated_at) : null,
    rawClaudeResponse: fields.raw_claude_response || null,
    expectedWrapup: fields.expected_wrapup || null,
    expectedSteps: fields.expected_steps || null,
    airtableRecordId: record.id,
  };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  evaluations: router({
    // Get all evaluations with optional filters
    list: publicProcedure
      .input(
        z.object({
          search: z.string().optional(),
          operatorName: z.string().optional(),
          proceso: z.string().optional(),
          priority: z.string().optional(),
          scenarioId: z.string().optional(),
          minScore: z.number().optional(),
          maxScore: z.number().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          sortBy: z.string().optional(),
          sortOrder: z.enum(['asc', 'desc']).optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        const filters: CallEvaluationFilters = {
          search: input?.search,
          operatorName: input?.operatorName,
          proceso: input?.proceso,
          priority: input?.priority,
          scenarioId: input?.scenarioId,
          minScore: input?.minScore,
          maxScore: input?.maxScore,
          startDate: input?.startDate ? new Date(input.startDate) : undefined,
          endDate: input?.endDate ? new Date(input.endDate) : undefined,
          sortBy: input?.sortBy,
          sortOrder: input?.sortOrder,
        };

        return await getFilteredCallEvaluations(filters);
      }),

    // Get statistics
    stats: publicProcedure.query(async () => {
      return await getCallEvaluationStats();
    }),

    // Get single evaluation by ID
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getCallEvaluationById(input.id);
      }),

    // Sync from Airtable (public - no auth required for standalone deployment)
    syncFromAirtable: publicProcedure
      .input(z.object({ apiKey: z.string() }))
      .mutation(async ({ input }) => {
        const { apiKey } = input;
        
        try {
          // Fetch all records from Airtable
          let allRecords: AirtableRecord[] = [];
          let offset: string | undefined;

          do {
            const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`);
            if (offset) {
              url.searchParams.set('offset', offset);
            }

            const response = await fetch(url.toString(), {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
            });

            if (!response.ok) {
              const errorText = await response.text();
              // Parse Airtable error for cleaner message
              try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.error?.message) {
                  throw new Error(`Airtable: ${errorJson.error.message}`);
                }
              } catch (parseErr) {
                // If not JSON, use status code
              }
              throw new Error(`Airtable API error (${response.status}): Verifica tu API Key y permisos`);
            }

            const data = await response.json() as { records: AirtableRecord[]; offset?: string };
            allRecords = allRecords.concat(data.records);
            offset = data.offset;
          } while (offset);

          if (allRecords.length === 0) {
            throw new Error('No se encontraron registros en Airtable. Verifica que la tabla tenga datos.');
          }

          // Map and upsert all records
          const evaluations = allRecords.map(mapAirtableToEvaluation);
          
          try {
            await bulkUpsertCallEvaluations(evaluations);
          } catch (dbError) {
            console.error('Database error during sync:', dbError);
            throw new Error('Error al guardar en la base de datos. Verifica la conexión DATABASE_URL.');
          }

          return {
            success: true,
            recordsImported: evaluations.length,
          };
        } catch (error) {
          console.error('[Airtable Sync Error]', error);
          // Return clean error message
          const message = error instanceof Error ? error.message : 'Error desconocido';
          // Truncate if too long
          const cleanMessage = message.length > 200 ? message.substring(0, 200) + '...' : message;
          throw new Error(cleanMessage);
        }
      }),

    // Clear all evaluations (public - no auth required for standalone deployment)
    clearAll: publicProcedure.mutation(async () => {
      await deleteAllCallEvaluations();
      return { success: true };
    }),

    // Get score trends over time
    trends: publicProcedure
      .input(
        z.object({
          operatorName: z.string().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return await getScoreTrends({
          operatorName: input?.operatorName,
          startDate: input?.startDate,
          endDate: input?.endDate,
        });
      }),
  }),
});

export type AppRouter = typeof appRouter;
