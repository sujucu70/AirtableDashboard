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
  getScoreTrends: vi.fn(),
}));

import { getScoreTrends } from "./db";

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

describe("evaluations.trends", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns trends data without operator filter", async () => {
    const mockTrends = {
      overall: [
        {
          date: "2024-01-15",
          averageScore: 75.5,
          adherenceScore: 80.0,
          sentimentScore: 70.0,
          correctnessScore: 78.0,
          speedScore: 74.0,
          callCount: 5,
        },
        {
          date: "2024-01-16",
          averageScore: 78.2,
          adherenceScore: 82.0,
          sentimentScore: 72.0,
          correctnessScore: 80.0,
          speedScore: 78.0,
          callCount: 8,
        },
      ],
      byOperator: [
        {
          operatorName: "Operator 1",
          data: [
            {
              date: "2024-01-15",
              averageScore: 85.0,
              adherenceScore: 88.0,
              sentimentScore: 82.0,
              correctnessScore: 86.0,
              speedScore: 84.0,
              callCount: 3,
            },
          ],
        },
        {
          operatorName: "Operator 2",
          data: [
            {
              date: "2024-01-15",
              averageScore: 66.0,
              adherenceScore: 72.0,
              sentimentScore: 58.0,
              correctnessScore: 70.0,
              speedScore: 64.0,
              callCount: 2,
            },
          ],
        },
      ],
    };

    vi.mocked(getScoreTrends).mockResolvedValue(mockTrends);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.evaluations.trends();

    expect(result).toEqual(mockTrends);
    expect(getScoreTrends).toHaveBeenCalledWith({
      operatorName: undefined,
      startDate: undefined,
      endDate: undefined,
    });
  });

  it("returns trends data with operator filter", async () => {
    const mockTrends = {
      overall: [
        {
          date: "2024-01-15",
          averageScore: 85.0,
          adherenceScore: 88.0,
          sentimentScore: 82.0,
          correctnessScore: 86.0,
          speedScore: 84.0,
          callCount: 3,
        },
      ],
      byOperator: [
        {
          operatorName: "Operator 1",
          data: [
            {
              date: "2024-01-15",
              averageScore: 85.0,
              adherenceScore: 88.0,
              sentimentScore: 82.0,
              correctnessScore: 86.0,
              speedScore: 84.0,
              callCount: 3,
            },
          ],
        },
      ],
    };

    vi.mocked(getScoreTrends).mockResolvedValue(mockTrends);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.evaluations.trends({ operatorName: "Operator 1" });

    expect(result).toEqual(mockTrends);
    expect(getScoreTrends).toHaveBeenCalledWith({
      operatorName: "Operator 1",
      startDate: undefined,
      endDate: undefined,
    });
  });

  it("returns trends data with date range filter", async () => {
    const mockTrends = {
      overall: [
        {
          date: "2024-01-15",
          averageScore: 75.5,
          adherenceScore: 80.0,
          sentimentScore: 70.0,
          correctnessScore: 78.0,
          speedScore: 74.0,
          callCount: 5,
        },
      ],
      byOperator: [],
    };

    vi.mocked(getScoreTrends).mockResolvedValue(mockTrends);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.evaluations.trends({ 
      startDate: "2024-01-01", 
      endDate: "2024-01-31" 
    });

    expect(result).toEqual(mockTrends);
    expect(getScoreTrends).toHaveBeenCalledWith({
      operatorName: undefined,
      startDate: "2024-01-01",
      endDate: "2024-01-31",
    });
  });

  it("returns empty trends when no data available", async () => {
    const mockTrends = {
      overall: [],
      byOperator: [],
    };

    vi.mocked(getScoreTrends).mockResolvedValue(mockTrends);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.evaluations.trends();

    expect(result.overall).toHaveLength(0);
    expect(result.byOperator).toHaveLength(0);
  });
});
