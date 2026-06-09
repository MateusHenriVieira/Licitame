"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useCostBase } from "@/lib/cost-base-provider"
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Download,
  Upload,
  Building2,
  DollarSign,
  TrendingUp,
  FileText,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function BaseCustoPage() {
  const { costBases, isLoading, deleteCostBase, exportData, importData } = useCostBase()
  const { toast } = useToast()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCostBaseId, setSelectedCostBaseId] = useState<string | null>(null)

  // Filtrar bases de custo
  const filteredCostBases = useMemo(() => {
    return costBases.filter(
      (cb) =>
        cb.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cb.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cb.cnpj.includes(searchTerm) ||
        cb.city.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [costBases, searchTerm])

  // Calcular estatísticas
  const stats = useMemo(() => {
    const totalCostBases = costBases.length
    const avgAdminFee = costBases.reduce((sum, cb) => sum + (cb.taxaAdministrativa || 0), 0) / totalCostBases || 0
    const avgTaxRate = costBases.reduce((sum, cb) => sum + (cb.taxaImpostos || 0), 0) / totalCostBases || 0
    const avgProfitMargin = costBases.reduce((sum, cb) => sum + (cb.margemLucro || 0), 0) / totalCostBases || 0

    return {
      total: totalCostBases,
      avgAdminFee: avgAdminFee.toFixed(2),
      avgTaxRate: avgTaxRate.toFixed(2),
      avgProfitMargin: avgProfitMargin.toFixed(2),
    }
  }, [costBases])

  const handleDelete = async () => {
    if (!selectedCostBaseId) return

    const success = await deleteCostBase(selectedCostBaseId)

    if (success) {
      toast({
        title: "Base de custo excluída",
        description: "A base de custo foi excluída com sucesso.",
      })
    } else {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a base de custo.",
        variant: "destructive",
      })
    }

    setDeleteDialogOpen(false)
    setSelectedCostBaseId(null)
  }

  const handleExport = () => {
    exportData()
    toast({
      title: "Dados exportados",
      description: "Os dados foram exportados com sucesso.",
    })
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      const success = await importData(data)

      if (success) {
        toast({
          title: "Dados importados",
          description: `${data.length} bases de custo importadas com sucesso.`,
        })
      } else {
        toast({
          title: "Erro ao importar",
          description: "Os dados não passaram na validação.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro ao importar",
        description: "Arquivo inválido ou corrompido.",
        variant: "destructive",
      })
    }

    event.target.value = ""
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bases de Custo</h1>
          <p className="text-muted-foreground">Gerencie as bases de custo do sistema</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button variant="outline" asChild>
            <label htmlFor="import-file" className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />
              Importar
              <input id="import-file" type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
          </Button>
          <Button onClick={() => router.push("/dashboard/base-custo/novo")}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Base de Custo
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Bases</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Bases de custo cadastradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Admin. Média</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgAdminFee}%</div>
            <p className="text-xs text-muted-foreground">Taxa administrativa média</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Impostos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgTaxRate}%</div>
            <p className="text-xs text-muted-foreground">Taxa de impostos média</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem de Lucro</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgProfitMargin}%</div>
            <p className="text-xs text-muted-foreground">Margem de lucro média</p>
          </CardContent>
        </Card>
      </div>

      {/* Busca e Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Bases de Custo Cadastradas</CardTitle>
          <CardDescription>
            {filteredCostBases.length} {filteredCostBases.length === 1 ? "base encontrada" : "bases encontradas"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nome, empresa, CNPJ ou cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {filteredCostBases.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma base de custo encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "Tente ajustar os filtros de busca" : "Comece criando sua primeira base de custo"}
              </p>
              {!searchTerm && (
                <Button onClick={() => router.push("/dashboard/base-custo/novo")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Base de Custo
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Taxas</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCostBases.map((costBase) => (
                    <TableRow key={costBase.id}>
                      <TableCell className="font-medium">{costBase.name}</TableCell>
                      <TableCell>{costBase.company}</TableCell>
                      <TableCell>{costBase.cnpj}</TableCell>
                      <TableCell>
                        {costBase.city}, {costBase.state}
                      </TableCell>
                      <TableCell>
                        {costBase.category ? (
                          <Badge variant="outline">{costBase.category}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col gap-1 items-end">
                          {costBase.taxaAdministrativa && (
                            <span className="text-xs">Admin: {costBase.taxaAdministrativa}%</span>
                          )}
                          {costBase.margemLucro && <span className="text-xs">Lucro: {costBase.margemLucro}%</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/base-custo/${costBase.id}`)}>
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => router.push(`/dashboard/base-custo/editar/${costBase.id}`)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedCostBaseId(costBase.id)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta base de custo? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
