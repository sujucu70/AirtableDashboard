import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database functions
vi.mock("./db", () => ({
  getFilteredCallEvaluations: vi.fn(),
  getCallEvaluationStats: vi.fn(),
  getCallEvaluationById: vi.fn(),
  bulkUpsertCallEvaluations: vi.fn(),
  deleteAllCallEvaluations: vi.fn(),
}));

import {
  getFilteredCallEvaluations,
  getCallEvaluationStats,
  getCallEvaluationById,
} from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("evaluations.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns evaluations list without filters", async () => {
    const mockEvaluations = [
      {
        id: 1,
        callId: "call-001",
        operatorName: "Operator 1",
        proceso: "COBROS",
        priority: "P0",
        averageScore: "85.5",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        callId: "call-002",
        operatorName: "Operator 2",
        proceso: "ATENCION",
        priority: "P1",
        averageScore: "72.0",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(getFilteredCallEvaluations).mockResolvedValue(mockEvaluations as any);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.evaluations.list();

    expect(result).toEqual(mockEvaluations);
    expect(getFilteredCallEvaluations).toHaveBeenCalledWith({
      search: undefined,
      operatorName: undefined,
      proceso: undefined,
      priority: undefined,
      scenarioId: undefined,
      minScore: undefined,
      maxScore: undefined,
      startDate: undefined,
      endDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
    });
  });

  it("returns filtered evaluations with search term", async () => {
    const mockEvaluations = [
      {
        id: 1,
        callId: "call-001",
        operatorName: "John",
        proceso: "COBROS",
        averageScore: "85.5",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(getFilteredCallEvaluations).mockResolvedValue(mockEvaluations as any);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.evaluations.list({ search: "John" });

    expect(result).toEqual(mockEvaluations);
    expect(getFilteredCallEvaluations).toHaveBeenCalledWith(
      expect.objectContaining({ search: "John" })
    );
  });

  it("returns filtered evaluations by proceso", async () => {
    const mockEvaluations = [
      {
        id: 1,
        callId: "call-001",
        proceso: "COBROS",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(getFilteredCallEvaluations).mockResolvedValue(mockEvaluations as any);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.evaluations.list({ proceso: "COBROS" });

    expect(result).toEqual(mockEvaluations);
    expect(getFilteredCallEvaluations).toHaveBeenCalledWith(
      expect.objectContaining({ proceso: "COBROS" })
    );
  });
});

describe("evaluations.stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns evaluation statistics", async () => {
    const mockStats = {
      totalCalls: 34,
      overallAverageScore: 75.5,
      procesoDistribution: {
        COBROS: 5,
        ATENCION: 10,
        RECLAMACIONES: 8,
        FACTURACION: 6,
        CONTRATACION: 3,
        "GESTION SINGULAR": 2,
      },
      priorityDistribution: {
        P0: 20,
        P1: 14,
      },
      topOperators: [
        { name: "Operator 1", averageScore: 92.5, callCount: 5 },
        { name: "Operator 2", averageScore: 88.0, callCount: 8 },
      ],
      uniqueOperators: ["Operator 1", "Operator 2", "Operator 3"],
      uniqueScenarios: ["ATE_001", "COB_001", "REC_001"],
    };

    vi.mocked(getCallEvaluationStats).mockResolvedValue(mockStats);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.evaluations.stats();

    expect(result).toEqual(mockStats);
    expect(getCallEvaluationStats).toHaveBeenCalled();
  });

  it("returns null when no stats available", async () => {
    vi.mocked(getCallEvaluationStats).mockResolvedValue(null);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.evaluations.stats();

    expect(result).toBeNull();
  });
});

describe("evaluations.byId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns evaluation by id", async () => {
    const mockEvaluation = {
      id: 1,
      callId: "call-001",
      operatorName: "Operator 1",
      proceso: "COBROS",
      priority: "P0",
      adherenceScore: "85.0",
      sentimentScore: "90.0",
      correctnessScore: "88.0",
      speedScore: "75.0",
      averageScore: "84.5",
      feedback: "Good performance",
      areasMejora: "Speed improvement needed",
      fortalezas: "Excellent communication",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(getCallEvaluationById).mockResolvedValue(mockEvaluation as any);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.evaluations.byId({ id: 1 });

    expect(result).toEqual(mockEvaluation);
    expect(getCallEvaluationById).toHaveBeenCalledWith(1);
  });

  it("returns undefined for non-existent evaluation", async () => {
    vi.mocked(getCallEvaluationById).mockResolvedValue(undefined);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.evaluations.byId({ id: 999 });

    expect(result).toBeUndefined();
  });
});

describe("evaluations.syncFromAirtable", () => {
  it("requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.evaluations.syncFromAirtable({ apiKey: "test-key" })
    ).rejects.toThrow();
  });
});

describe("evaluations.clearAll", () => {
  it("requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.evaluations.clearAll()).rejects.toThrow();
  });
});
