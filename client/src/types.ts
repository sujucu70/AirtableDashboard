export interface CallEvaluation {
  id: number;
  callId: string;
  operatorId: string | null;
  operatorName: string | null;
  scenarioId: string | null;
  scenarioName: string | null;
  proceso: "COBROS" | "ATENCION" | "RECLAMACIONES" | "GESTION SINGULAR" | "FACTURACION" | "CONTRATACION" | "DESCONOCIDO" | null;
  priority: "P0" | "P1" | null;
  adherenceScore: string | null;
  sentimentScore: string | null;
  correctnessScore: string | null;
  speedScore: string | null;
  averageScore: string | null;
  status: string | null;
  feedback: string | null;
  areasMejora: string | null;
  fortalezas: string | null;
  criticalIssues: string | null;
  durationSeconds: number | null;
  evaluatedAt: Date | string | null;
  rawClaudeResponse: string | null;
  expectedWrapup: string | null;
  expectedSteps: string | null;
  airtableRecordId: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface EvaluationStats {
  totalCalls: number;
  overallAverageScore: number;
  procesoDistribution: Record<string, number>;
  priorityDistribution: Record<string, number>;
  topOperators: Array<{
    name: string;
    averageScore: number;
    callCount: number;
  }>;
  uniqueOperators: string[];
  uniqueScenarios: string[];
}

export interface FilterState {
  search: string;
  operatorName: string;
  proceso: string;
  priority: string;
  scenarioId: string;
  minScore: number | undefined;
  maxScore: number | undefined;
  startDate: string;
  endDate: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}
