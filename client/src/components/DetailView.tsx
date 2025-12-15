import { CallEvaluation } from "../types";
import { X, Clock, User, FileText, AlertTriangle, CheckCircle, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DetailViewProps {
  evaluation: CallEvaluation | null;
  isOpen: boolean;
  onClose: () => void;
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

function ScoreCard({ label, score, maxScore = 100 }: { label: string; score: string | null; maxScore?: number }) {
  const numScore = score ? parseFloat(score) : null;
  const percentage = numScore !== null ? Math.min((numScore / maxScore) * 100, 100) : 0;
  const color = percentage >= 70 ? "bg-green-500" : percentage >= 40 ? "bg-yellow-500" : "bg-red-500";
  
  return (
    <div className="bg-muted/50 rounded-lg p-3">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${percentage}%` }} />
        </div>
        <span className="text-lg font-bold">{numScore !== null ? numScore.toFixed(1) : "-"}</span>
      </div>
    </div>
  );
}

function InfoSection({ icon: Icon, title, content }: { icon: any; title: string; content: string | null }) {
  if (!content) return null;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </div>
      <div className="bg-muted/30 rounded-lg p-3 text-sm whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );
}

export function DetailView({ evaluation, isOpen, onClose }: DetailViewProps) {
  if (!evaluation) return null;

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-hidden p-0">
        <SheetHeader className="p-6 pb-0">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-lg font-semibold">Detalle de Evaluación</SheetTitle>
              <p className="text-sm text-muted-foreground font-mono mt-1">{evaluation.callId}</p>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)] px-6 pb-6">
          <div className="space-y-6 pt-4">
            {/* Header info */}
            <div className="flex flex-wrap gap-2">
              {evaluation.proceso && (
                <Badge variant="secondary" className={`${PROCESO_COLORS[evaluation.proceso]} border-0`}>
                  {evaluation.proceso}
                </Badge>
              )}
              <Badge variant="secondary" className={evaluation.priority === "P1" ? "priority-p1 border-0" : "priority-p0 border-0"}>
                {evaluation.priority || "P0"}
              </Badge>
              {evaluation.status && (
                <Badge variant="outline">{evaluation.status}</Badge>
              )}
            </div>

            {/* Basic info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Operador</p>
                  <p className="font-medium">{evaluation.operatorName || "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Duración</p>
                  <p className="font-medium">{formatDuration(evaluation.durationSeconds)}</p>
                </div>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Escenario</p>
                <p className="font-medium">{evaluation.scenarioName || "-"}</p>
                <p className="text-xs text-muted-foreground">{evaluation.scenarioId}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Fecha de evaluación</p>
                <p className="font-medium">{formatDate(evaluation.evaluatedAt)}</p>
              </div>
            </div>

            <Separator />

            {/* Scores */}
            <div>
              <h3 className="text-sm font-medium mb-3">Puntuaciones</h3>
              <div className="grid grid-cols-2 gap-3">
                <ScoreCard label="Adherencia" score={evaluation.adherenceScore} />
                <ScoreCard label="Sentimiento" score={evaluation.sentimentScore} />
                <ScoreCard label="Corrección" score={evaluation.correctnessScore} />
                <ScoreCard label="Velocidad" score={evaluation.speedScore} />
              </div>
              <div className="mt-3">
                <ScoreCard label="Puntuación Promedio" score={evaluation.averageScore} />
              </div>
            </div>

            <Separator />

            {/* Detailed feedback */}
            <div className="space-y-4">
              <InfoSection icon={FileText} title="Feedback" content={evaluation.feedback} />
              <InfoSection icon={Target} title="Áreas de Mejora" content={evaluation.areasMejora} />
              <InfoSection icon={CheckCircle} title="Fortalezas" content={evaluation.fortalezas} />
              <InfoSection icon={AlertTriangle} title="Problemas Críticos" content={evaluation.criticalIssues} />
              <InfoSection icon={FileText} title="Cierre Esperado" content={evaluation.expectedWrapup} />
              <InfoSection icon={FileText} title="Pasos Esperados" content={evaluation.expectedSteps} />
            </div>

            {/* Raw response (collapsible) */}
            {evaluation.rawClaudeResponse && (
              <>
                <Separator />
                <details className="group">
                  <summary className="text-sm font-medium cursor-pointer hover:text-primary">
                    Ver respuesta raw de Claude
                  </summary>
                  <div className="mt-2 bg-muted/30 rounded-lg p-3 text-xs font-mono whitespace-pre-wrap overflow-auto max-h-64">
                    {evaluation.rawClaudeResponse}
                  </div>
                </details>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
