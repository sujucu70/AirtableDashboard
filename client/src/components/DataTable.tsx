import { useState, useMemo } from "react";
import { CallEvaluation } from "../types";
import { ChevronUp, ChevronDown, ChevronsUpDown, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface DataTableProps {
  data: CallEvaluation[];
  onViewDetails: (evaluation: CallEvaluation) => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (column: string) => void;
}

const PROCESO_COLORS: Record<string, string> = {
  COBROS: "proceso-cobros",
  ATENCION: "proceso-atencion",
  RECLAMACIONES: "proceso-reclamaciones",
  "GESTION SINGULAR": "proceso-gestion-singular",
  FACTURACION: "proceso-facturacion",
  CONTRATACION: "proceso-contratacion",
  DESCONOCIDO: "proceso-desconocido",
};

function ScoreBar({ score, maxScore = 100 }: { score: number | null; maxScore?: number }) {
  if (score === null) return <span className="text-muted-foreground">-</span>;
  
  const percentage = Math.min((score / maxScore) * 100, 100);
  const color = percentage >= 70 ? "bg-green-500" : percentage >= 40 ? "bg-yellow-500" : "bg-red-500";
  
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${percentage}%` }} />
      </div>
      <span className="text-sm font-medium w-8 text-right">{score.toFixed(0)}</span>
    </div>
  );
}

function SortIcon({ column, sortBy, sortOrder }: { column: string; sortBy: string; sortOrder: string }) {
  if (sortBy !== column) {
    return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />;
  }
  return sortOrder === "asc" ? (
    <ChevronUp className="h-4 w-4 text-primary" />
  ) : (
    <ChevronDown className="h-4 w-4 text-primary" />
  );
}

function SortableHeader({
  column,
  label,
  sortBy,
  sortOrder,
  onSort,
  className = "",
}: {
  column: string;
  label: string;
  sortBy: string;
  sortOrder: string;
  onSort: (column: string) => void;
  className?: string;
}) {
  return (
    <TableHead className={`cursor-pointer hover:bg-muted/50 ${className}`} onClick={() => onSort(column)}>
      <div className="flex items-center gap-1">
        <span>{label}</span>
        <SortIcon column={column} sortBy={sortBy} sortOrder={sortOrder} />
      </div>
    </TableHead>
  );
}

export function DataTable({ data, onViewDetails, sortBy, sortOrder, onSort }: DataTableProps) {
  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <div className="overflow-auto custom-scrollbar max-h-[calc(100vh-400px)]">
        <Table>
          <TableHeader className="sticky top-0 bg-white z-10">
            <TableRow className="bg-muted/30">
              <TableHead className="w-[50px]">#</TableHead>
              <SortableHeader column="callId" label="Call ID" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} className="min-w-[180px]" />
              <SortableHeader column="operatorName" label="Operador" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} className="min-w-[120px]" />
              <SortableHeader column="scenarioName" label="Escenario" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} className="min-w-[200px]" />
              <SortableHeader column="proceso" label="Proceso" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} className="min-w-[140px]" />
              <SortableHeader column="priority" label="Prioridad" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} className="min-w-[100px]" />
              <SortableHeader column="adherenceScore" label="Adherencia" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} className="min-w-[140px]" />
              <SortableHeader column="sentimentScore" label="Sentimiento" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} className="min-w-[140px]" />
              <SortableHeader column="correctnessScore" label="Corrección" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} className="min-w-[140px]" />
              <SortableHeader column="speedScore" label="Velocidad" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} className="min-w-[140px]" />
              <SortableHeader column="averageScore" label="Promedio" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} className="min-w-[140px]" />
              <SortableHeader column="durationSeconds" label="Duración" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} className="min-w-[100px]" />
              <SortableHeader column="evaluatedAt" label="Fecha" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} className="min-w-[120px]" />
              <TableHead className="w-[80px] sticky right-0 bg-white">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={14} className="text-center py-8 text-muted-foreground">
                  No se encontraron registros
                </TableCell>
              </TableRow>
            ) : (
              data.map((evaluation, index) => (
                <TableRow key={evaluation.id} className="hover:bg-muted/20">
                  <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {evaluation.callId?.length > 20 
                      ? `${evaluation.callId.substring(0, 20)}...` 
                      : evaluation.callId}
                  </TableCell>
                  <TableCell>{evaluation.operatorName || "-"}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={evaluation.scenarioName || ""}>
                    {evaluation.scenarioName || "-"}
                  </TableCell>
                  <TableCell>
                    {evaluation.proceso && (
                      <Badge variant="secondary" className={`${PROCESO_COLORS[evaluation.proceso] || "proceso-desconocido"} border-0`}>
                        {evaluation.proceso}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={evaluation.priority === "P1" ? "priority-p1 border-0" : "priority-p0 border-0"}>
                      {evaluation.priority || "P0"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ScoreBar score={evaluation.adherenceScore ? parseFloat(evaluation.adherenceScore) : null} />
                  </TableCell>
                  <TableCell>
                    <ScoreBar score={evaluation.sentimentScore ? parseFloat(evaluation.sentimentScore) : null} />
                  </TableCell>
                  <TableCell>
                    <ScoreBar score={evaluation.correctnessScore ? parseFloat(evaluation.correctnessScore) : null} />
                  </TableCell>
                  <TableCell>
                    <ScoreBar score={evaluation.speedScore ? parseFloat(evaluation.speedScore) : null} />
                  </TableCell>
                  <TableCell>
                    <ScoreBar score={evaluation.averageScore ? parseFloat(evaluation.averageScore) : null} />
                  </TableCell>
                  <TableCell>
                    {evaluation.durationSeconds ? `${Math.floor(evaluation.durationSeconds / 60)}:${String(evaluation.durationSeconds % 60).padStart(2, '0')}` : "-"}
                  </TableCell>
                  <TableCell>
                    {evaluation.evaluatedAt 
                      ? new Date(evaluation.evaluatedAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
                      : "-"}
                  </TableCell>
                  <TableCell className="sticky right-0 bg-white">
                    <Button variant="ghost" size="sm" onClick={() => onViewDetails(evaluation)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
