import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CallEvaluation } from "../types";
import { GraduationCap, AlertTriangle, Target, Users } from "lucide-react";

interface TrainingInsightsProps {
  evaluations: CallEvaluation[];
  isLoading: boolean;
}

// Colors for processes
const PROCESO_COLORS: Record<string, string> = {
  COBROS: "#2563eb",
  ATENCION: "#16a34a",
  RECLAMACIONES: "#d97706",
  "GESTION SINGULAR": "#9333ea",
  FACTURACION: "#db2777",
  CONTRATACION: "#4f46e5",
  DESCONOCIDO: "#6b7280",
};

// Score dimension labels
const DIMENSION_LABELS: Record<string, string> = {
  adherenceScore: "Adherencia",
  sentimentScore: "Sentimiento",
  correctnessScore: "Corrección",
  speedScore: "Velocidad",
};

const DIMENSION_COLORS = {
  adherenceScore: "#16a34a",
  sentimentScore: "#d97706",
  correctnessScore: "#9333ea",
  speedScore: "#db2777",
};

// Get score color based on value
function getScoreColor(score: number): string {
  if (score >= 70) return "#16a34a"; // Green
  if (score >= 50) return "#d97706"; // Orange
  return "#dc2626"; // Red
}

// Get urgency level
function getUrgencyLevel(score: number): { label: string; color: string; bgColor: string } {
  if (score >= 70) return { label: "Bajo", color: "text-green-700", bgColor: "bg-green-100" };
  if (score >= 50) return { label: "Medio", color: "text-yellow-700", bgColor: "bg-yellow-100" };
  if (score >= 30) return { label: "Alto", color: "text-orange-700", bgColor: "bg-orange-100" };
  return { label: "Crítico", color: "text-red-700", bgColor: "bg-red-100" };
}

function CustomBarTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">{entry.value?.toFixed(1) || "N/A"}</span>
        </div>
      ))}
    </div>
  );
}

export function TrainingInsights({ evaluations, isLoading }: TrainingInsightsProps) {
  // Calculate scores by process
  const scoresByProcess = useMemo(() => {
    const processData: Record<string, {
      count: number;
      totalAvg: number;
      totalAdh: number;
      totalSent: number;
      totalCorr: number;
      totalSpeed: number;
    }> = {};

    evaluations.forEach((e) => {
      const proceso = e.proceso || "DESCONOCIDO";
      if (!processData[proceso]) {
        processData[proceso] = { count: 0, totalAvg: 0, totalAdh: 0, totalSent: 0, totalCorr: 0, totalSpeed: 0 };
      }
      processData[proceso].count++;
      processData[proceso].totalAvg += parseFloat(e.averageScore || "0");
      processData[proceso].totalAdh += parseFloat(e.adherenceScore || "0");
      processData[proceso].totalSent += parseFloat(e.sentimentScore || "0");
      processData[proceso].totalCorr += parseFloat(e.correctnessScore || "0");
      processData[proceso].totalSpeed += parseFloat(e.speedScore || "0");
    });

    return Object.entries(processData)
      .map(([proceso, data]) => ({
        proceso,
        avgScore: data.count > 0 ? data.totalAvg / data.count : 0,
        adherenceScore: data.count > 0 ? data.totalAdh / data.count : 0,
        sentimentScore: data.count > 0 ? data.totalSent / data.count : 0,
        correctnessScore: data.count > 0 ? data.totalCorr / data.count : 0,
        speedScore: data.count > 0 ? data.totalSpeed / data.count : 0,
        callCount: data.count,
      }))
      .sort((a, b) => a.avgScore - b.avgScore); // Sort by lowest score first (priority for training)
  }, [evaluations]);

  // Calculate operator × process matrix
  const operatorProcessMatrix = useMemo(() => {
    const matrix: Record<string, Record<string, { total: number; count: number }>> = {};
    const allOperators = new Set<string>();
    const allProcesses = new Set<string>();

    evaluations.forEach((e) => {
      const operator = e.operatorName || "Sin nombre";
      const proceso = e.proceso || "DESCONOCIDO";
      const score = parseFloat(e.averageScore || "0");

      allOperators.add(operator);
      allProcesses.add(proceso);

      if (!matrix[operator]) matrix[operator] = {};
      if (!matrix[operator][proceso]) matrix[operator][proceso] = { total: 0, count: 0 };

      matrix[operator][proceso].total += score;
      matrix[operator][proceso].count++;
    });

    return {
      matrix,
      operators: Array.from(allOperators),
      processes: Array.from(allProcesses).sort(),
    };
  }, [evaluations]);

  // Calculate worst scenarios
  const worstScenarios = useMemo(() => {
    const scenarioData: Record<string, {
      scenarioName: string;
      proceso: string;
      count: number;
      totalScore: number;
      adherence: number;
      sentiment: number;
      correctness: number;
      speed: number;
    }> = {};

    evaluations.forEach((e) => {
      const scenarioId = e.scenarioId || "unknown";
      if (!scenarioData[scenarioId]) {
        scenarioData[scenarioId] = {
          scenarioName: e.scenarioName || "Sin nombre",
          proceso: e.proceso || "DESCONOCIDO",
          count: 0,
          totalScore: 0,
          adherence: 0,
          sentiment: 0,
          correctness: 0,
          speed: 0,
        };
      }
      scenarioData[scenarioId].count++;
      scenarioData[scenarioId].totalScore += parseFloat(e.averageScore || "0");
      scenarioData[scenarioId].adherence += parseFloat(e.adherenceScore || "0");
      scenarioData[scenarioId].sentiment += parseFloat(e.sentimentScore || "0");
      scenarioData[scenarioId].correctness += parseFloat(e.correctnessScore || "0");
      scenarioData[scenarioId].speed += parseFloat(e.speedScore || "0");
    });

    return Object.entries(scenarioData)
      .map(([id, data]) => ({
        scenarioId: id,
        scenarioName: data.scenarioName,
        proceso: data.proceso,
        avgScore: data.count > 0 ? data.totalScore / data.count : 0,
        adherence: data.count > 0 ? data.adherence / data.count : 0,
        sentiment: data.count > 0 ? data.sentiment / data.count : 0,
        correctness: data.count > 0 ? data.correctness / data.count : 0,
        speed: data.count > 0 ? data.speed / data.count : 0,
        callCount: data.count,
        // Identify weakest dimension
        weakestDimension: (() => {
          const dims = {
            adherence: data.count > 0 ? data.adherence / data.count : 0,
            sentiment: data.count > 0 ? data.sentiment / data.count : 0,
            correctness: data.count > 0 ? data.correctness / data.count : 0,
            speed: data.count > 0 ? data.speed / data.count : 0,
          };
          const weakest = Object.entries(dims).reduce((min, [key, val]) =>
            val < min.val ? { key, val } : min,
            { key: "adherence", val: Infinity }
          );
          return weakest.key;
        })(),
      }))
      .filter(s => s.scenarioId !== "unknown" && s.callCount >= 1)
      .sort((a, b) => a.avgScore - b.avgScore)
      .slice(0, 5);
  }, [evaluations]);

  // Prepare radar chart data for process dimensions
  const radarData = useMemo(() => {
    return scoresByProcess.slice(0, 5).map(p => ({
      proceso: p.proceso.length > 10 ? p.proceso.substring(0, 10) + "..." : p.proceso,
      fullName: p.proceso,
      Adherencia: p.adherenceScore,
      Sentimiento: p.sentimentScore,
      Corrección: p.correctnessScore,
      Velocidad: p.speedScore,
    }));
  }, [scoresByProcess]);

  if (isLoading) {
    return (
      <Card className="bg-white">
        <CardContent className="pt-6">
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (evaluations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <GraduationCap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Análisis de Necesidades de Formación</h2>
          <p className="text-sm text-muted-foreground">Identifica áreas y procesos que requieren capacitación</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Score by Process - Bar Chart */}
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-primary" />
              Puntuación Promedio por Proceso
            </CardTitle>
            <p className="text-xs text-muted-foreground">Procesos ordenados por prioridad de formación</p>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoresByProcess} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E3E3" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="proceso"
                    width={100}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => value.length > 12 ? value.substring(0, 12) + "..." : value}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="avgScore" name="Promedio" radius={[0, 4, 4, 0]}>
                    {scoresByProcess.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getScoreColor(entry.avgScore)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center justify-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-500" />
                <span>&lt;50 Crítico</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-orange-500" />
                <span>50-70 Medio</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span>&gt;70 OK</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Dimensions by Process - Grouped Bar Chart */}
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Dimensiones por Proceso
            </CardTitle>
            <p className="text-xs text-muted-foreground">¿Qué competencias fallan en cada proceso?</p>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoresByProcess.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E3E3" />
                  <XAxis
                    dataKey="proceso"
                    tick={{ fontSize: 9 }}
                    tickFormatter={(value) => value.length > 8 ? value.substring(0, 8) + ".." : value}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="adherenceScore" name="Adherencia" fill={DIMENSION_COLORS.adherenceScore} />
                  <Bar dataKey="sentimentScore" name="Sentimiento" fill={DIMENSION_COLORS.sentimentScore} />
                  <Bar dataKey="correctnessScore" name="Corrección" fill={DIMENSION_COLORS.correctnessScore} />
                  <Bar dataKey="speedScore" name="Velocidad" fill={DIMENSION_COLORS.speedScore} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 3. Operator × Process Heatmap */}
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" />
              Matriz Operador × Proceso
            </CardTitle>
            <p className="text-xs text-muted-foreground">¿Quién necesita formación en qué área?</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left p-2 font-medium text-muted-foreground">Operador</th>
                    {operatorProcessMatrix.processes.map(proc => (
                      <th key={proc} className="p-2 font-medium text-muted-foreground text-center">
                        {proc.length > 8 ? proc.substring(0, 8) + ".." : proc}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {operatorProcessMatrix.operators.map(operator => (
                    <tr key={operator} className="border-t">
                      <td className="p-2 font-medium truncate max-w-[100px]" title={operator}>
                        {operator.length > 12 ? operator.substring(0, 12) + ".." : operator}
                      </td>
                      {operatorProcessMatrix.processes.map(proc => {
                        const data = operatorProcessMatrix.matrix[operator]?.[proc];
                        const score = data ? data.total / data.count : null;
                        return (
                          <td key={proc} className="p-1 text-center">
                            {score !== null ? (
                              <div
                                className="rounded px-2 py-1 font-medium"
                                style={{
                                  backgroundColor: score < 50 ? "#fee2e2" : score < 70 ? "#fef3c7" : "#dcfce7",
                                  color: score < 50 ? "#991b1b" : score < 70 ? "#92400e" : "#166534",
                                }}
                              >
                                {score.toFixed(0)}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 4. Top 5 Worst Scenarios */}
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Top 5 Escenarios Críticos
            </CardTitle>
            <p className="text-xs text-muted-foreground">Escenarios con menor puntuación - prioridad de training</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {worstScenarios.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No hay datos suficientes</p>
              ) : (
                worstScenarios.map((scenario, index) => {
                  const urgency = getUrgencyLevel(scenario.avgScore);
                  const weakDimLabel = {
                    adherence: "Adherencia",
                    sentiment: "Sentimiento",
                    correctness: "Corrección",
                    speed: "Velocidad",
                  }[scenario.weakestDimension] || scenario.weakestDimension;

                  return (
                    <div key={scenario.scenarioId} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? "bg-red-100 text-red-700" :
                        index === 1 ? "bg-orange-100 text-orange-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" title={scenario.scenarioName}>
                          {scenario.scenarioName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px]" style={{
                            borderColor: PROCESO_COLORS[scenario.proceso] || "#6b7280",
                            color: PROCESO_COLORS[scenario.proceso] || "#6b7280"
                          }}>
                            {scenario.proceso}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {scenario.callCount} llamadas
                          </span>
                          <span className="text-[10px] text-red-600 font-medium">
                            Débil: {weakDimLabel}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold" style={{ color: getScoreColor(scenario.avgScore) }}>
                          {scenario.avgScore.toFixed(1)}
                        </p>
                        <Badge className={`text-[10px] ${urgency.bgColor} ${urgency.color} border-0`}>
                          {urgency.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Training Recommendations Summary */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recomendaciones de Formación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Priority Process */}
            {scoresByProcess.length > 0 && scoresByProcess[0].avgScore < 70 && (
              <div className="bg-white rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Proceso Prioritario</p>
                <p className="font-semibold text-red-600">{scoresByProcess[0].proceso}</p>
                <p className="text-xs mt-1">Score: {scoresByProcess[0].avgScore.toFixed(1)}</p>
              </div>
            )}

            {/* Weakest Dimension Overall */}
            {scoresByProcess.length > 0 && (
              <div className="bg-white rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Competencia más débil (general)</p>
                {(() => {
                  const totals = { adherence: 0, sentiment: 0, correctness: 0, speed: 0, count: 0 };
                  scoresByProcess.forEach(p => {
                    totals.adherence += p.adherenceScore;
                    totals.sentiment += p.sentimentScore;
                    totals.correctness += p.correctnessScore;
                    totals.speed += p.speedScore;
                    totals.count++;
                  });
                  const avgDims = {
                    Adherencia: totals.adherence / totals.count,
                    Sentimiento: totals.sentiment / totals.count,
                    Corrección: totals.correctness / totals.count,
                    Velocidad: totals.speed / totals.count,
                  };
                  const weakest = Object.entries(avgDims).reduce((min, [key, val]) =>
                    val < min.val ? { key, val } : min,
                    { key: "", val: Infinity }
                  );
                  return (
                    <>
                      <p className="font-semibold text-orange-600">{weakest.key}</p>
                      <p className="text-xs mt-1">Promedio: {weakest.val.toFixed(1)}</p>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Operators needing attention */}
            {operatorProcessMatrix.operators.length > 0 && (
              <div className="bg-white rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Operadores con score &lt;50</p>
                {(() => {
                  const lowScoreOps = operatorProcessMatrix.operators.filter(op => {
                    const scores = Object.values(operatorProcessMatrix.matrix[op] || {});
                    if (scores.length === 0) return false;
                    const avg = scores.reduce((sum, s) => sum + s.total / s.count, 0) / scores.length;
                    return avg < 50;
                  });
                  return (
                    <>
                      <p className="font-semibold text-red-600">{lowScoreOps.length}</p>
                      <p className="text-xs mt-1">de {operatorProcessMatrix.operators.length} operadores</p>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
