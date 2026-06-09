"use client"

import type React from "react"

import { useState } from "react"
import { useSuppliers } from "@/lib/suppliers-provider"
import { parseSupplierFile, type SupplierImportData } from "@/lib/file-parsers/supplier-parser"
import { useToast } from "@/components/ui/use-toast"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Upload, FileText, AlertCircle, CheckCircle2, X } from "lucide-react"

interface SupplierImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SupplierImportDialog({ open, onOpenChange }: SupplierImportDialogProps) {
  const { addSupplier } = useSuppliers()
  const { toast } = useToast()

  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<SupplierImportData[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setIsProcessing(true)
    setParsedData([])
    setErrors([])
    setWarnings([])

    try {
      const result = await parseSupplierFile(selectedFile)
      setParsedData(result.data)
      setErrors(result.errors)
      setWarnings(result.warnings)

      if (result.errors.length > 0) {
        toast({
          title: "Erros encontrados",
          description: `${result.errors.length} erro(s) encontrado(s) no arquivo.`,
          variant: "destructive",
        })
      } else if (result.data.length > 0) {
        toast({
          title: "Arquivo processado",
          description: `${result.data.length} fornecedor(es) pronto(s) para importação.`,
        })
      }
    } catch (error) {
      setErrors([`Erro ao processar arquivo: ${error instanceof Error ? error.message : "Erro desconhecido"}`])
      toast({
        title: "Erro ao processar arquivo",
        description: "Não foi possível processar o arquivo. Verifique o formato.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImport = async () => {
    if (parsedData.length === 0) return

    setIsImporting(true)
    setImportProgress(0)

    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < parsedData.length; i++) {
      const supplierData = parsedData[i]

      try {
        await addSupplier({
          name: supplierData.name,
          cnpj: supplierData.cnpj,
          category: supplierData.category,
          email: supplierData.email,
          contactPhone: supplierData.contactPhone,
          address: supplierData.address,
          city: supplierData.city,
          state: supplierData.state,
          zipCode: supplierData.zipCode,
          rating: supplierData.rating || 0,
          active: supplierData.active !== undefined ? supplierData.active : true,
          contactPerson: supplierData.contactPerson,
          website: supplierData.website,
          notes: supplierData.notes,
        })
        successCount++
      } catch (error) {
        console.error(`Erro ao importar fornecedor ${supplierData.name}:`, error)
        errorCount++
      }

      setImportProgress(((i + 1) / parsedData.length) * 100)
    }

    setIsImporting(false)

    toast({
      title: "Importação concluída",
      description: `${successCount} fornecedor(es) importado(s) com sucesso. ${errorCount > 0 ? `${errorCount} erro(s).` : ""}`,
      variant: errorCount > 0 ? "destructive" : "default",
    })

    if (errorCount === 0) {
      handleClose()
    }
  }

  const handleClose = () => {
    setFile(null)
    setParsedData([])
    setErrors([])
    setWarnings([])
    setImportProgress(0)
    onOpenChange(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      const input = document.createElement("input")
      input.type = "file"
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(droppedFile)
      input.files = dataTransfer.files
      handleFileChange({ target: input } as any)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar Fornecedores</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo CSV, Excel ou JSON com os dados dos fornecedores
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {!file && (
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-2">Arraste um arquivo ou clique para selecionar</p>
              <p className="text-xs text-muted-foreground">Formatos suportados: CSV, XLSX, XLS, JSON</p>
              <input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx,.xls,.json"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          {file && (
            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <span className="text-sm font-medium">{file.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFile(null)
                    setParsedData([])
                    setErrors([])
                    setWarnings([])
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {isProcessing && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Processando arquivo...</p>
                  <Progress value={50} className="w-full" />
                </div>
              )}

              {errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erros encontrados</AlertTitle>
                  <AlertDescription>
                    <ScrollArea className="h-24 mt-2">
                      <ul className="list-disc list-inside space-y-1">
                        {errors.map((error, index) => (
                          <li key={index} className="text-sm">
                            {error}
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </AlertDescription>
                </Alert>
              )}

              {warnings.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Avisos</AlertTitle>
                  <AlertDescription>
                    <ScrollArea className="h-24 mt-2">
                      <ul className="list-disc list-inside space-y-1">
                        {warnings.map((warning, index) => (
                          <li key={index} className="text-sm">
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </AlertDescription>
                </Alert>
              )}

              {parsedData.length > 0 && (
                <div className="flex-1 overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold">
                      Preview dos dados ({parsedData.length} fornecedor{parsedData.length > 1 ? "es" : ""})
                    </h3>
                  </div>
                  <ScrollArea className="flex-1 border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>CNPJ</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead>Cidade</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedData.slice(0, 10).map((supplier, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{supplier.name}</TableCell>
                            <TableCell>{supplier.cnpj}</TableCell>
                            <TableCell>{supplier.category}</TableCell>
                            <TableCell>{supplier.email}</TableCell>
                            <TableCell>{supplier.contactPhone}</TableCell>
                            <TableCell>{supplier.city}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {parsedData.length > 10 && (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        ... e mais {parsedData.length - 10} fornecedor{parsedData.length - 10 > 1 ? "es" : ""}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              )}

              {isImporting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Importando fornecedores...</span>
                    <span>{Math.round(importProgress)}%</span>
                  </div>
                  <Progress value={importProgress} className="w-full" />
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isImporting}>
            Cancelar
          </Button>
          <Button onClick={handleImport} disabled={parsedData.length === 0 || errors.length > 0 || isImporting}>
            {isImporting ? (
              <>Importando...</>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Importar {parsedData.length} Fornecedor{parsedData.length > 1 ? "es" : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
