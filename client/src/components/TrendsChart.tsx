import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, Users, Calendar, X } from "lucide-react";

interface TrendDataPoint {
  date: string;
  averageScore: number;
  adherenceScore: number;
  sentimentScore: number;
  correctnessScore: number;
  speedScore: number;
  callCount: number;
}

interface OperatorTrend {
  operatorName: string;
  data: TrendDataPoint[];
}

interface DateRange {
  startDate: string;
  endDate: string;
}

interface TrendsChartProps {
  overall: TrendDataPoint[];
  byOperator: OperatorTrend[];
  isLoading: boolean;
  onDateRangeChange?: (range: DateRange | null) => void;
  dateRange?: DateRange | null;
}

const SCORE_COLORS = {
  averageScore: "#6D84E3", // Primary corporate color
  adherenceScore: "#16a34a", // Green
  sentimentScore: "#d97706", // Orange
  correctnessScore: "#9333ea", // Purple
  speedScore: "#db2777", // Pink
};

const OPERATOR_COLORS = [
  "#6D84E3",
  "#16a34a",
  "#d97706",
  "#9333ea",
  "#db2777",
  "#2563eb",
  "#dc2626",
  "#0891b2",
];

const SCORE_LABELS: Record<string, string> = {
  averageScore: "Promedio",
  adherenceScore: "Adherencia",
  sentimentScore: "Sentimiento",
  correctnessScore: "Corrección",
  speedScore: "Velocidad",
};

// Preset date ranges
const DATE_PRESETS = [
  { label: "Última semana", days: 7 },
  { label: "Últimos 15 días", days: 15 },
  { label: "Último mes", days: 30 },
  { label: "Últimos 3 meses", days: 90 },
];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

function getDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium mb-2">{formatDate(label)}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">{entry.value.toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}

export function TrendsChart({ 
  overall, 
  byOperator, 
  isLoading, 
  onDateRangeChange,
  dateRange 
}: TrendsChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<string>("all");
  const [selectedOperator, setSelectedOperator] = useState<string>("all");
  const [localStartDate, setLocalStartDate] = useState<string>(dateRange?.startDate || "");
  const [localEndDate, setLocalEndDate] = useState<string>(dateRange?.endDate || "");

  // Apply date filter
  const handleApplyDateFilter = () => {
    if (localStartDate && localEndDate && onDateRangeChange) {
      onDateRangeChange({ startDate: localStartDate, endDate: localEndDate });
    }
  };

  // Apply preset
  const handlePreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    const startStr = getDateString(start);
    const endStr = getDateString(end);
    
    setLocalStartDate(startStr);
    setLocalEndDate(endStr);
    
    if (onDateRangeChange) {
      onDateRangeChange({ startDate: startStr, endDate: endStr });
    }
  };

  // Clear date filter
  const handleClearDateFilter = () => {
    setLocalStartDate("");
    setLocalEndDate("");
    if (onDateRangeChange) {
      onDateRangeChange(null);
    }
  };

  // Prepare data for overall trends
  const overallChartData = useMemo(() => {
    return overall.map((point) => ({
      ...point,
      dateLabel: formatDate(point.date),
    }));
  }, [overall]);

  // Prepare data for operator comparison
  const operatorComparisonData = useMemo(() => {
    if (byOperator.length === 0) return [];

    // Get all unique dates
    const allDates = new Set<string>();
    byOperator.forEach((op) => op.data.forEach((d) => allDates.add(d.date)));
    const sortedDates = Array.from(allDates).sort();

    // Create data points for each date with all operators
    return sortedDates.map((date) => {
      const point: Record<string, any> = { date, dateLabel: formatDate(date) };
      byOperator.forEach((op) => {
        const dataPoint = op.data.find((d) => d.date === date);
        point[op.operatorName] = dataPoint?.averageScore || null;
      });
      return point;
    });
  }, [byOperator]);

  // Filter operators for display (max 5)
  const displayOperators = useMemo(() => {
    if (selectedOperator !== "all") {
      return byOperator.filter((op) => op.operatorName === selectedOperator);
    }
    return byOperator.slice(0, 5);
  }, [byOperator, selectedOperator]);

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

  if (overall.length === 0) {
    return (
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Tendencias de Puntuaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-60 flex items-center justify-center text-muted-foreground text-center">
            No hay datos suficientes para mostrar tendencias.
            <br />
            Sincroniza los datos desde Airtable para ver las tendencias.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Tendencias de Puntuaciones
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {/* Date Range Filter */}
        <div className="mb-6 p-4 bg-muted/30 rounded-lg border">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Filtrar por rango de fechas</span>
            {dateRange && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearDateFilter}
                className="ml-auto h-7 px-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
            )}
          </div>
          
          {/* Preset buttons */}
          <div className="flex flex-wrap gap-2 mb-3">
            {DATE_PRESETS.map((preset) => (
              <Button
                key={preset.days}
                variant="outline"
                size="sm"
                onClick={() => handlePreset(preset.days)}
                className="h-7 text-xs"
              >
                {preset.label}
              </Button>
            ))}
          </div>
          
          {/* Custom date range */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="startDate" className="text-xs text-muted-foreground">
                Fecha inicio
              </Label>
              <Input
                id="startDate"
                type="date"
                value={localStartDate}
                onChange={(e) => setLocalStartDate(e.target.value)}
                className="h-8 w-[140px] text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="endDate" className="text-xs text-muted-foreground">
                Fecha fin
              </Label>
              <Input
                id="endDate"
                type="date"
                value={localEndDate}
                onChange={(e) => setLocalEndDate(e.target.value)}
                className="h-8 w-[140px] text-sm"
              />
            </div>
            <Button
              size="sm"
              onClick={handleApplyDateFilter}
              disabled={!localStartDate || !localEndDate}
              className="h-8"
            >
              Aplicar
            </Button>
          </div>
          
          {/* Active filter indicator */}
          {dateRange && (
            <div className="mt-3 text-xs text-muted-foreground">
              Mostrando datos desde{" "}
              <span className="font-medium text-foreground">
                {formatDate(dateRange.startDate)}
              </span>{" "}
              hasta{" "}
              <span className="font-medium text-foreground">
                {formatDate(dateRange.endDate)}
              </span>
            </div>
          )}
        </div>

        <Tabs defaultValue="overall" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="overall" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="operators" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Por Operador
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overall">
            <div className="mb-4">
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Seleccionar métrica" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las métricas</SelectItem>
                  <SelectItem value="averageScore">Promedio</SelectItem>
                  <SelectItem value="adherenceScore">Adherencia</SelectItem>
                  <SelectItem value="sentimentScore">Sentimiento</SelectItem>
                  <SelectItem value="correctnessScore">Corrección</SelectItem>
                  <SelectItem value="speedScore">Velocidad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={overallChartData}>
                  <defs>
                    {Object.entries(SCORE_COLORS).map(([key, color]) => (
                      <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E3E3" />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fontSize: 12, fill: "#B1B1B0" }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12, fill: "#B1B1B0" }}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: "20px" }}
                    formatter={(value) => (
                      <span className="text-sm text-foreground">{value}</span>
                    )}
                  />
                  {(selectedMetric === "all" || selectedMetric === "averageScore") && (
                    <Area
                      type="monotone"
                      dataKey="averageScore"
                      name={SCORE_LABELS.averageScore}
                      stroke={SCORE_COLORS.averageScore}
                      fill={`url(#gradient-averageScore)`}
                      strokeWidth={2}
                      dot={{ r: 4, fill: SCORE_COLORS.averageScore }}
                    />
                  )}
                  {(selectedMetric === "all" || selectedMetric === "adherenceScore") && (
                    <Area
                      type="monotone"
                      dataKey="adherenceScore"
                      name={SCORE_LABELS.adherenceScore}
                      stroke={SCORE_COLORS.adherenceScore}
                      fill={`url(#gradient-adherenceScore)`}
                      strokeWidth={2}
                      dot={{ r: 4, fill: SCORE_COLORS.adherenceScore }}
                    />
                  )}
                  {(selectedMetric === "all" || selectedMetric === "sentimentScore") && (
                    <Area
                      type="monotone"
                      dataKey="sentimentScore"
                      name={SCORE_LABELS.sentimentScore}
                      stroke={SCORE_COLORS.sentimentScore}
                      fill={`url(#gradient-sentimentScore)`}
                      strokeWidth={2}
                      dot={{ r: 4, fill: SCORE_COLORS.sentimentScore }}
                    />
                  )}
                  {(selectedMetric === "all" || selectedMetric === "correctnessScore") && (
                    <Area
                      type="monotone"
                      dataKey="correctnessScore"
                      name={SCORE_LABELS.correctnessScore}
                      stroke={SCORE_COLORS.correctnessScore}
                      fill={`url(#gradient-correctnessScore)`}
                      strokeWidth={2}
                      dot={{ r: 4, fill: SCORE_COLORS.correctnessScore }}
                    />
                  )}
                  {(selectedMetric === "all" || selectedMetric === "speedScore") && (
                    <Area
                      type="monotone"
                      dataKey="speedScore"
                      name={SCORE_LABELS.speedScore}
                      stroke={SCORE_COLORS.speedScore}
                      fill={`url(#gradient-speedScore)`}
                      strokeWidth={2}
                      dot={{ r: 4, fill: SCORE_COLORS.speedScore }}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="operators">
            <div className="mb-4">
              <Select value={selectedOperator} onValueChange={setSelectedOperator}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Seleccionar operador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos (máx. 5)</SelectItem>
                  {byOperator.map((op) => (
                    <SelectItem key={op.operatorName} value={op.operatorName}>
                      {op.operatorName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={operatorComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E3E3" />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fontSize: 12, fill: "#B1B1B0" }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12, fill: "#B1B1B0" }}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: "20px" }}
                    formatter={(value) => (
                      <span className="text-sm text-foreground">{value}</span>
                    )}
                  />
                  {displayOperators.map((op, index) => (
                    <Line
                      key={op.operatorName}
                      type="monotone"
                      dataKey={op.operatorName}
                      name={op.operatorName}
                      stroke={OPERATOR_COLORS[index % OPERATOR_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 4, fill: OPERATOR_COLORS[index % OPERATOR_COLORS.length] }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
