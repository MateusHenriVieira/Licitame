"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileUpload } from "@/components/ui/file-upload"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useContracts } from "@/lib/contracts-provider"
import { useSuppliers } from "@/lib/suppliers-provider"
import { parseContractFile, type ParseResult } from "@/lib/file-parsers/contract-parser"
import { AlertCircle, CheckCircle2, FileSpreadsheet, FileJson, FileText, Upload, Building2, FileType, Link, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getFirebaseApp } from "@/lib/firebase";

const db = getFirestore(getFirebaseApp());

interface ContractImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContractImportDialog({ open, onOpenChange }: ContractImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [createSuppliers, setCreateSuppliers] = useState(false)
  const [driveLink, setDriveLink] = useState("")
  const { addContract } = useContracts()
  const { addSupplier, linkContractToSupplier, getSupplierByCNPJ } = useSuppliers()
  const { toast } = useToast()

  const isWordFile = file?.name.toLowerCase().endsWith(".docx") || file?.name.toLowerCase().endsWith(".doc")

  const handleFileSelect = async (uploadedFile: File | File[]) => {
    const selectedFile = Array.isArray(uploadedFile) ? uploadedFile[0] : uploadedFile
    setFile(selectedFile)
    setParseResult(null)
    setProgress(0)

    // For Word files, wait for user to optionally add drive link before parsing
    const isWord = selectedFile.name.toLowerCase().endsWith(".docx") || selectedFile.name.toLowerCase().endsWith(".doc")
    
    if (isWord) {
      // Don't parse immediately for Word files - wait for drive link input
      return
    }

    await parseFile(selectedFile)
  }

  const parseFile = async (selectedFile: File, link?: string) => {
    setParsing(true)
    try {
      const result = await parseContractFile(selectedFile, link)
      setParseResult(result)

      if (result.success) {
        const message = `${result.data.length} contratos encontrados no arquivo.`
        toast({
          title: "Arquivo processado",
          description: message,
        })
      } else {
        toast({
          title: "Erro ao processar arquivo",
          description: "Verifique os erros abaixo.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro ao processar arquivo",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      })
    } finally {
      setParsing(false)
    }
  }

  const handleParseWordFile = async () => {
    if (!file) return
    await parseFile(file, driveLink || undefined)
  }

  const handleImport = async () => {
    if (!parseResult || parseResult.data.length === 0) {
      toast({
        title: "Nenhum contrato para importar",
        description: "Certifique-se de que o arquivo contém contratos válidos.",
        variant: "destructive",
      });
      return;
    }

    setImporting(true)
    setProgress(0)

    let importedContracts = 0
    const total = parseResult.data.length
    let currentProgress = 0

    for (const contract of parseResult.data) {
      try {
        // Preparar os dados do contrato para salvar no Firestore
        const contractData = {
          contrato: {
            numero: contract.number,
            processo_administrativo: contract.administrativeProcess || "",
            pregao_eletronico: contract.electronicAuction || "",
            contratante: contract.contractingParty || "",
            fornecedor: {
              razao_social: contract.company,
              cnpj: contract.cnpj || ""
            },
            valor_total_contrato: contract.totalValue || 0,
            data_assinatura: contract.signatureDate || "",
            vigencia_meses: contract.validityMonths || 0
          },
          itens: contract.items || []
        }

        // Salvar no Firestore
        await addDoc(collection(db, "contracts"), contractData);
        importedContracts++

        currentProgress++
        setProgress(Math.round((currentProgress / total) * 100))
      } catch (error) {
        console.error("Erro ao importar contrato:", error)
        toast({
          title: "Erro ao importar contrato",
          description: error instanceof Error ? error.message : "Erro desconhecido",
          variant: "destructive",
        })
      }
    }

    setImporting(false)

    toast({
      title: "Importação concluída",
      description: `${importedContracts} de ${total} contratos importados com sucesso.`,
    })

    setTimeout(() => {
      onOpenChange(false)
      setFile(null)
      setParseResult(null)
      setProgress(0)
      setCreateSuppliers(false)
    }, 1500)
  }

  const handleCancel = () => {
    setFile(null)
    setParseResult(null)
    setProgress(0)
    setCreateSuppliers(false)
    setDriveLink("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Importar Contratos</DialogTitle>
          <DialogDescription>Importe contratos em massa através de arquivos CSV, Excel ou JSON.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formatos suportados */}
          <div className="grid grid-cols-4 gap-3">
            <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
              <FileType className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium text-sm">Word</div>
                <div className="text-xs text-muted-foreground">.docx</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
              <FileText className="h-5 w-5 text-gray-600" />
              <div>
                <div className="font-medium text-sm">CSV</div>
                <div className="text-xs text-muted-foreground">Valores separados</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium text-sm">Excel</div>
                <div className="text-xs text-muted-foreground">.xlsx, .xls</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
              <FileJson className="h-5 w-5 text-orange-600" />
              <div>
                <div className="font-medium text-sm">JSON</div>
                <div className="text-xs text-muted-foreground">Estruturado</div>
              </div>
            </div>
          </div>

          {/* Upload */}
          {!parseResult && !isWordFile && (
            <FileUpload accept=".csv,.xlsx,.xls,.json,.docx,.doc" maxSize={10} onUpload={handleFileSelect} disabled={parsing} />
          )}

          {/* Word file selected - show drive link input */}
          {isWordFile && !parseResult && (
            <div className="space-y-4">
              <Alert>
                <FileType className="h-4 w-4" />
                <AlertTitle>Arquivo Word selecionado: {file?.name}</AlertTitle>
                <AlertDescription>
                  Arquivos Word podem conter contratos no formato padrão. Os dados serão extraídos automaticamente.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="drive-link" className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  Link do Google Drive (opcional)
                </Label>
                <Input
                  id="drive-link"
                  type="url"
                  placeholder="https://drive.google.com/file/d/..."
                  value={driveLink}
                  onChange={(e) => setDriveLink(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Cole o link do Google Drive onde o documento original está armazenado. Isso permite acessar o arquivo sem ocupar espaço no banco de dados.
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleParseWordFile} 
                  disabled={parsing}
                  className="flex-1"
                >
                  {parsing ? "Processando..." : "Processar Documento"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFile(null)
                    setDriveLink("")
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Parsing */}
          {parsing && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-4">
                <Upload className="h-12 w-12 mx-auto animate-bounce text-primary" />
                <p className="text-sm text-muted-foreground">Processando arquivo...</p>
              </div>
            </div>
          )}

          {/* Checkbox para criar fornecedores */}
          {parseResult && parseResult.success && parseResult.suppliers.length > 0 && (
            <div className="flex items-start space-x-3 rounded-lg border p-4 bg-muted/50">
              <Checkbox
                id="create-suppliers"
                checked={createSuppliers}
                onCheckedChange={(checked) => setCreateSuppliers(checked === true)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="create-suppliers"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Cadastrar fornecedores automaticamente
                </Label>
                <p className="text-sm text-muted-foreground">
                  {parseResult.suppliers.length} fornecedores detectados no arquivo serão criados automaticamente com
                  base nos dados dos contratos.
                </p>
              </div>
            </div>
          )}

          {/* Resultado do parse */}
          {parseResult && (
            <ScrollArea className="h-[300px] rounded-md border p-4">
              <div className="space-y-4">
                {/* Resumo */}
                <Alert variant={parseResult.success ? "default" : "destructive"}>
                  {parseResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  <AlertTitle>
                    {parseResult.success
                      ? `${parseResult.data.length} contratos prontos para importação`
                      : "Erro ao processar arquivo"}
                  </AlertTitle>
                  <AlertDescription>
                    {parseResult.success ? (
                      <div className="space-y-1">
                        <p>Revise as informações abaixo e clique em 'Importar' para continuar.</p>
                        {createSuppliers && parseResult.suppliers.length > 0 && (
                          <p className="flex items-center gap-2 text-green-600 font-medium mt-2">
                            <Building2 className="h-4 w-4" />
                            {parseResult.suppliers.length} fornecedores serão criados automaticamente
                          </p>
                        )}
                        {(parseResult.driveLink || driveLink) && (
                          <p className="flex items-center gap-2 text-blue-600 font-medium mt-2">
                            <ExternalLink className="h-4 w-4" />
                            Documento vinculado ao Google Drive
                          </p>
                        )}
                      </div>
                    ) : (
                      "Corrija os erros e tente novamente."
                    )}
                  </AlertDescription>
                </Alert>

                {/* Erros */}
                {parseResult.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erros encontrados ({parseResult.errors.length})</AlertTitle>
                    <AlertDescription>
                      <ul className="mt-2 space-y-1 text-sm list-disc pl-4">
                        {parseResult.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Avisos */}
                {parseResult.warnings.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Avisos ({parseResult.warnings.length})</AlertTitle>
                    <AlertDescription>
                      <ul className="mt-2 space-y-1 text-sm list-disc pl-4">
                        {parseResult.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Preview dos dados */}
                {parseResult.data.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Preview dos contratos:</h4>
                    <div className="space-y-2">
                      {parseResult.data.slice(0, 5).map((contract, index) => (
                        <div key={index} className="p-3 rounded-lg border bg-muted/50 text-sm">
                          <div className="font-medium">{contract.number}</div>
                          <div className="text-muted-foreground">
                            {contract.company} - {contract.costBase}
                          </div>
                        </div>
                      ))}
                      {parseResult.data.length > 5 && (
                        <div className="text-sm text-muted-foreground text-center py-2">
                          ... e mais {parseResult.data.length - 5} contratos
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Preview dos fornecedores */}
                {createSuppliers && parseResult.suppliers.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Fornecedores a serem criados:
                    </h4>
                    <div className="space-y-2">
                      {parseResult.suppliers.slice(0, 5).map((supplier, index) => (
                        <div key={index} className="p-3 rounded-lg border bg-green-50 text-sm">
                          <div className="font-medium">{supplier.name}</div>
                          <div className="text-muted-foreground">
                            {supplier.cnpj} - {supplier.category}
                          </div>
                        </div>
                      ))}
                      {parseResult.suppliers.length > 5 && (
                        <div className="text-sm text-muted-foreground text-center py-2">
                          ... e mais {parseResult.suppliers.length - 5} fornecedores
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          {/* Progress da importação */}
          {importing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{createSuppliers ? "Importando contratos e fornecedores..." : "Importando contratos..."}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={importing}>
            Cancelar
          </Button>
          {parseResult && parseResult.success && (
            <Button onClick={handleImport} disabled={importing}>
              {importing ? "Importando..." : `Importar ${parseResult.data.length} contratos`}
            </Button>
          )}
          {parseResult && !parseResult.success && (
            <Button
              variant="outline"
              onClick={() => {
                setFile(null)
                setParseResult(null)
              }}
            >
              Tentar outro arquivo
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
