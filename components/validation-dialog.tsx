"use client"

import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { ValidationReport } from "@/lib/validation/json-validator"

interface ValidationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  report: ValidationReport | null
  onConfirm?: () => void
  onCancel?: () => void
}

export function ValidationDialog({ open, onOpenChange, report, onConfirm, onCancel }: ValidationDialogProps) {
  if (!report) return null

  const handleConfirm = () => {
    onConfirm?.()
    onOpenChange(false)
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {report.valid ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            Resultado da Validação
          </DialogTitle>
          <DialogDescription>Análise detalhada dos dados de {report.dataType}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-4">
            {/* Status geral */}
            <Alert variant={report.valid ? "default" : "destructive"}>
              <Info className="h-4 w-4" />
              <AlertTitle>Status: {report.valid ? "Válido" : "Inválido"}</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-1 text-sm">
                  <div>Total de itens: {report.itemCount}</div>
                  <div>Itens válidos: {report.validItemCount}</div>
                  <div>Itens inválidos: {report.invalidItemCount}</div>
                </div>
              </AlertDescription>
            </Alert>

            {/* Erros */}
            {report.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erros encontrados ({report.errors.length})</AlertTitle>
                <AlertDescription>
                  <ul className="mt-2 space-y-1 text-sm list-disc pl-4">
                    {report.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Avisos */}
            {report.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Avisos ({report.warnings.length})</AlertTitle>
                <AlertDescription>
                  <ul className="mt-2 space-y-1 text-sm list-disc pl-4">
                    {report.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Mensagem de sucesso */}
            {report.valid && report.errors.length === 0 && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Validação bem-sucedida!</AlertTitle>
                <AlertDescription>
                  Todos os {report.itemCount} itens foram validados com sucesso e estão prontos para uso.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          {report.valid && onConfirm && <Button onClick={handleConfirm}>Confirmar Importação</Button>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
