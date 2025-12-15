import { useState } from "react";
import { FilterState, EvaluationStats } from "../types";
import { Search, Filter, X, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface FiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  stats: EvaluationStats | null;
  onSync: () => void;
  isSyncing: boolean;
}

const PROCESOS = [
  { value: "all", label: "Todos los procesos" },
  { value: "COBROS", label: "Cobros" },
  { value: "ATENCION", label: "Atención" },
  { value: "RECLAMACIONES", label: "Reclamaciones" },
  { value: "GESTION SINGULAR", label: "Gestión Singular" },
  { value: "FACTURACION", label: "Facturación" },
  { value: "CONTRATACION", label: "Contratación" },
];

const PRIORITIES = [
  { value: "all", label: "Todas las prioridades" },
  { value: "P0", label: "P0 - Alta" },
  { value: "P1", label: "P1 - Normal" },
];

export function Filters({ filters, onFiltersChange, stats, onSync, isSyncing }: FiltersProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
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
    });
  };

  const hasActiveFilters = 
    filters.search || 
    filters.operatorName || 
    filters.proceso || 
    filters.priority || 
    filters.scenarioId ||
    filters.minScore !== undefined ||
    filters.maxScore !== undefined ||
    filters.startDate ||
    filters.endDate;

  return (
    <div className="space-y-4 bg-card p-4 rounded-lg">
      {/* Search and main controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID, operador, escenario o feedback..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-10 bg-white"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onSync}
            disabled={isSyncing}
            className="whitespace-nowrap"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Sincronizando..." : "Sincronizar"}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground">
              <X className="h-4 w-4 mr-1" />
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* Quick filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Operador</Label>
          <Select
            value={filters.operatorName || "all"}
            onValueChange={(value) => updateFilter("operatorName", value === "all" ? "" : value)}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Todos los operadores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los operadores</SelectItem>
              {stats?.uniqueOperators.map((op) => (
                <SelectItem key={op} value={op}>
                  {op}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Proceso</Label>
          <Select
            value={filters.proceso || "all"}
            onValueChange={(value) => updateFilter("proceso", value === "all" ? "" : value)}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Todos los procesos" />
            </SelectTrigger>
            <SelectContent>
              {PROCESOS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Prioridad</Label>
          <Select
            value={filters.priority || "all"}
            onValueChange={(value) => updateFilter("priority", value === "all" ? "" : value)}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Todas las prioridades" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Escenario</Label>
          <Select
            value={filters.scenarioId || "all"}
            onValueChange={(value) => updateFilter("scenarioId", value === "all" ? "" : value)}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Todos los escenarios" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los escenarios</SelectItem>
              {stats?.uniqueScenarios.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Advanced filters */}
      <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Filter className="h-4 w-4 mr-2" />
            {isAdvancedOpen ? "Ocultar filtros avanzados" : "Mostrar filtros avanzados"}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Puntuación mínima</Label>
              <Input
                type="number"
                placeholder="0"
                min={0}
                max={100}
                value={filters.minScore ?? ""}
                onChange={(e) => updateFilter("minScore", e.target.value ? Number(e.target.value) : undefined)}
                className="bg-white"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Puntuación máxima</Label>
              <Input
                type="number"
                placeholder="100"
                min={0}
                max={100}
                value={filters.maxScore ?? ""}
                onChange={(e) => updateFilter("maxScore", e.target.value ? Number(e.target.value) : undefined)}
                className="bg-white"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Fecha desde</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => updateFilter("startDate", e.target.value)}
                className="bg-white"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Fecha hasta</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => updateFilter("endDate", e.target.value)}
                className="bg-white"
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
