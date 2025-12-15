import { useState } from "react";
import { RefreshCw, Key, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SyncDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSync: (apiKey: string) => Promise<void>;
  isSyncing: boolean;
  syncResult: { success: boolean; message: string } | null;
}

export function SyncDialog({ isOpen, onClose, onSync, isSyncing, syncResult }: SyncDialogProps) {
  const [apiKey, setApiKey] = useState("");

  const handleSync = async () => {
    if (!apiKey.trim()) return;
    await onSync(apiKey);
  };

  const handleClose = () => {
    if (!isSyncing) {
      setApiKey("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Sincronizar con Airtable
          </DialogTitle>
          <DialogDescription>
            Ingresa tu API Key de Airtable para importar los datos de evaluaciones.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Airtable API Key
            </Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="pat..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={isSyncing}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Puedes obtener tu API Key en{" "}
              <a
                href="https://airtable.com/create/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                airtable.com/create/tokens
              </a>
            </p>
          </div>

          {syncResult && (
            <Alert variant={syncResult.success ? "default" : "destructive"}>
              {syncResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{syncResult.message}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSyncing}>
            Cancelar
          </Button>
          <Button onClick={handleSync} disabled={!apiKey.trim() || isSyncing}>
            {isSyncing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sincronizar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
