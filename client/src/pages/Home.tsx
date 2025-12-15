import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { FilterState, CallEvaluation } from "../types";
import { DataTable } from "@/components/DataTable";
import { Filters } from "@/components/Filters";
import { StatsPanel } from "@/components/StatsPanel";
import { DetailView } from "@/components/DetailView";
import { SyncDialog } from "@/components/SyncDialog";
import { TrendsChart } from "@/components/TrendsChart";
import { Button } from "@/components/ui/button";
import { Download, Database, LogIn, User, LogOut } from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

const DEFAULT_FILTERS: FilterState = {
  search: "",
  operatorName: "",
  proceso: "",
  priority: "",
  scenarioId: "",
  minScore: undefined,
  maxScore: undefined,
  startDate: "",
  endDate: "",
  sortBy: "createdAt",
  sortOrder: "desc",
};

export default function Home() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [selectedEvaluation, setSelectedEvaluation] = useState<CallEvaluation | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [trendsDateRange, setTrendsDateRange] = useState<{ startDate: string; endDate: string } | null>(null);

  // Queries
  const { data: evaluations, isLoading: evaluationsLoading, refetch: refetchEvaluations } = trpc.evaluations.list.useQuery({
    search: filters.search || undefined,
    operatorName: filters.operatorName || undefined,
    proceso: filters.proceso || undefined,
    priority: filters.priority || undefined,
    scenarioId: filters.scenarioId || undefined,
    minScore: filters.minScore,
    maxScore: filters.maxScore,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.evaluations.stats.useQuery();

  const { data: trends, isLoading: trendsLoading, refetch: refetchTrends } = trpc.evaluations.trends.useQuery({
    startDate: trendsDateRange?.startDate,
    endDate: trendsDateRange?.endDate,
  });

  // Sync mutation
  const syncMutation = trpc.evaluations.syncFromAirtable.useMutation({
    onSuccess: (data) => {
      setSyncResult({
        success: true,
        message: `Se importaron ${data.recordsImported} registros correctamente.`,
      });
      refetchEvaluations();
      refetchStats();
      refetchTrends();
      toast.success(`Sincronización completada: ${data.recordsImported} registros importados`);
    },
    onError: (error) => {
      setSyncResult({
        success: false,
        message: error.message || "Error al sincronizar con Airtable",
      });
      toast.error("Error al sincronizar con Airtable");
    },
  });

  const handleSync = async (apiKey: string) => {
    setSyncResult(null);
    await syncMutation.mutateAsync({ apiKey });
  };

  const handleOpenSyncDialog = () => {
    if (!isAuthenticated) {
      toast.error("Debes iniciar sesión para sincronizar datos");
      return;
    }
    setSyncResult(null);
    setIsSyncDialogOpen(true);
  };

  const handleViewDetails = (evaluation: CallEvaluation) => {
    setSelectedEvaluation(evaluation);
    setIsDetailOpen(true);
  };

  const handleSort = (column: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === "asc" ? "desc" : "asc",
    }));
  };

  // Export to CSV
  const handleExportCSV = useCallback(() => {
    if (!evaluations || evaluations.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    const headers = [
      "Call ID",
      "Operador ID",
      "Operador",
      "Escenario ID",
      "Escenario",
      "Proceso",
      "Prioridad",
      "Adherencia",
      "Sentimiento",
      "Corrección",
      "Velocidad",
      "Promedio",
      "Estado",
      "Feedback",
      "Áreas de Mejora",
      "Fortalezas",
      "Problemas Críticos",
      "Duración (s)",
      "Fecha Evaluación",
    ];

    const rows = evaluations.map((e) => [
      e.callId,
      e.operatorId || "",
      e.operatorName || "",
      e.scenarioId || "",
      e.scenarioName || "",
      e.proceso || "",
      e.priority || "",
      e.adherenceScore || "",
      e.sentimentScore || "",
      e.correctnessScore || "",
      e.speedScore || "",
      e.averageScore || "",
      e.status || "",
      (e.feedback || "").replace(/"/g, '""'),
      (e.areasMejora || "").replace(/"/g, '""'),
      (e.fortalezas || "").replace(/"/g, '""'),
      (e.criticalIssues || "").replace(/"/g, '""'),
      e.durationSeconds?.toString() || "",
      e.evaluatedAt ? new Date(e.evaluatedAt).toISOString() : "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `evaluaciones_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exportados ${evaluations.length} registros a CSV`);
  }, [evaluations]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-20">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="/beyond-logo.png" 
                alt="Beyond CX" 
                className="h-8 w-auto"
              />
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-lg font-semibold text-foreground">Customer Interactions Dashboard</h1>
                <p className="text-xs text-muted-foreground">Análisis de evaluaciones de llamadas</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {evaluations && evaluations.length > 0 && (
                <Button variant="outline" onClick={handleExportCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              )}
              {authLoading ? (
                <div className="h-9 w-24 bg-muted animate-pulse rounded-md" />
              ) : isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{user?.name || "Usuario"}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => logout()}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button asChild>
                  <a href={getLoginUrl()}>
                    <LogIn className="h-4 w-4 mr-2" />
                    Iniciar sesión
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container py-6 space-y-6">
        {/* Stats Panel */}
        <StatsPanel stats={stats || null} isLoading={statsLoading} />

        {/* Trends Chart */}
        <TrendsChart
          overall={trends?.overall || []}
          byOperator={trends?.byOperator || []}
          isLoading={trendsLoading}
          dateRange={trendsDateRange}
          onDateRangeChange={setTrendsDateRange}
        />

        {/* Filters */}
        <Filters
          filters={filters}
          onFiltersChange={setFilters}
          stats={stats || null}
          onSync={handleOpenSyncDialog}
          isSyncing={syncMutation.isPending}
        />

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {evaluationsLoading ? (
              "Cargando..."
            ) : (
              <>
                Mostrando <span className="font-medium text-foreground">{evaluations?.length || 0}</span> registros
              </>
            )}
          </p>
        </div>

        {/* Data Table */}
        {evaluationsLoading ? (
          <div className="border rounded-lg bg-white p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          </div>
        ) : (
          <DataTable
            data={evaluations || []}
            onViewDetails={handleViewDetails}
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            onSort={handleSort}
          />
        )}
      </main>

      {/* Detail View */}
      <DetailView
        evaluation={selectedEvaluation}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />

      {/* Sync Dialog */}
      <SyncDialog
        isOpen={isSyncDialogOpen}
        onClose={() => setIsSyncDialogOpen(false)}
        onSync={handleSync}
        isSyncing={syncMutation.isPending}
        syncResult={syncResult}
      />
    </div>
  );
}
