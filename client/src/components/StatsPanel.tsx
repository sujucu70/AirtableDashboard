import { EvaluationStats } from "../types";
import { Phone, TrendingUp, Users, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface StatsPanelProps {
  stats: EvaluationStats | null;
  isLoading: boolean;
}

const PROCESO_COLORS: Record<string, string> = {
  COBROS: "#2563eb",
  ATENCION: "#16a34a",
  RECLAMACIONES: "#d97706",
  "GESTION SINGULAR": "#9333ea",
  FACTURACION: "#db2777",
  CONTRATACION: "#4f46e5",
  DESCONOCIDO: "#6b7280",
};

export function StatsPanel({ stats, isLoading }: StatsPanelProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-card">
            <CardContent className="pt-6">
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const totalProcesos = Object.values(stats.procesoDistribution).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      {/* Main stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Llamadas</p>
                <p className="text-3xl font-bold text-foreground">{stats.totalCalls}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Phone className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Puntuación Promedio</p>
                <p className="text-3xl font-bold text-foreground">{stats.overallAverageScore.toFixed(1)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Operadores</p>
                <p className="text-3xl font-bold text-foreground">{stats.uniqueOperators.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Escenarios</p>
                <p className="text-3xl font-bold text-foreground">{stats.uniqueScenarios.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Proceso distribution */}
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Distribución por Proceso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.procesoDistribution).map(([proceso, count]) => (
                <div key={proceso} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="truncate">{proceso}</span>
                    <span className="font-medium">{count} ({((count / totalProcesos) * 100).toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(count / totalProcesos) * 100}%`,
                        backgroundColor: PROCESO_COLORS[proceso] || "#6b7280",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Priority distribution */}
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Distribución por Prioridad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.priorityDistribution).map(([priority, count]) => {
                const total = Object.values(stats.priorityDistribution).reduce((a, b) => a + b, 0);
                const percentage = (count / total) * 100;
                return (
                  <div key={priority} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${priority === "P0" ? "priority-p0" : "priority-p1"}`}>
                        {priority}
                      </span>
                      <span className="font-medium">{count} ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: priority === "P0" ? "#dc2626" : "#d97706",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top operators */}
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Operadores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topOperators.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin datos disponibles</p>
              ) : (
                stats.topOperators.map((op, index) => (
                  <div key={op.name} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? "bg-yellow-100 text-yellow-700" :
                      index === 1 ? "bg-gray-100 text-gray-600" :
                      index === 2 ? "bg-orange-100 text-orange-700" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{op.name}</p>
                      <p className="text-xs text-muted-foreground">{op.callCount} llamadas</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{op.averageScore.toFixed(1)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
