"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSuppliers } from "@/lib/suppliers-provider"
import { useToast } from "@/components/ui/use-toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, Filter, Download, MoreHorizontal, Package, Upload } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { NavigationProgress } from "@/components/navigation-progress"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Skeleton } from "@/components/ui/skeleton"
import { SupplierImportDialog } from "@/components/supplier-import-dialog"

export default function FornecedoresPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { suppliers, updateSupplier, isLoading } = useSuppliers()

  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("todos")
  const [sortOrder, setSortOrder] = useState("recentes")
  const [isExporting, setIsExporting] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [filters, setFilters] = useState({
    category: "",
    rating: "",
    hasContracts: false,
  })

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    supplierId: "",
    action: "" as "activate" | "deactivate",
  })

  // Filtrar fornecedores
  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) || supplier.cnpj.includes(searchTerm)
    const matchesTab = activeTab === "todos" ? true : activeTab === "ativos" ? supplier.active : !supplier.active
    const matchesCategory = !filters.category || supplier.category === filters.category
    const matchesRating = !filters.rating || supplier.rating >= Number.parseInt(filters.rating)

    return matchesSearch && matchesTab && matchesCategory && matchesRating
  })

  // Ordenar fornecedores
  const sortedSuppliers = [...filteredSuppliers].sort((a, b) => {
    switch (sortOrder) {
      case "recentes":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case "alfabetica":
        return a.name.localeCompare(b.name)
      case "avaliacao":
        return b.rating - a.rating
      default:
        return 0
    }
  })

  // Estatísticas
  const totalSuppliers = suppliers.length
  const activeSuppliers = suppliers.filter((s) => s.active).length

  const categoryCounts = suppliers.reduce(
    (acc, supplier) => {
      const category = supplier.category || "Não categorizado"
      acc[category] = (acc[category] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  const ratingCounts = {
    excellent: suppliers.filter((s) => s.rating >= 4.5).length,
    good: suppliers.filter((s) => s.rating >= 3.5 && s.rating < 4.5).length,
    regular: suppliers.filter((s) => s.rating < 3.5).length,
  }

  const handleNewSupplier = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsNavigating(true)
    router.push("/dashboard/fornecedores/novo")
  }

  const handleExport = async () => {
    setIsExporting(true)

    try {
      const dataToExport = filteredSuppliers.map((supplier) => ({
        Nome: supplier.name,
        CNPJ: supplier.cnpj,
        Categoria: supplier.category,
        Status: supplier.active ? "Ativo" : "Inativo",
        Avaliação: supplier.rating,
        Email: supplier.email,
        Telefone: supplier.contactPhone,
        Endereço: supplier.address,
        Cidade: supplier.city,
        Estado: supplier.state,
        CEP: supplier.zipCode,
        "Data de Cadastro": new Date(supplier.createdAt).toLocaleDateString("pt-BR"),
      }))

      const headers = Object.keys(dataToExport[0]).join(",")
      const rows = dataToExport.map((obj) => Object.values(obj).join(","))
      const csv = [headers, ...rows].join("\n")

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `fornecedores_${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Exportação concluída",
        description: `${dataToExport.length} fornecedores exportados com sucesso.`,
      })
    } catch (error) {
      console.error("Erro ao exportar fornecedores:", error)
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os fornecedores. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleToggleStatus = (supplierId: string, currentStatus: boolean) => {
    setConfirmDialog({
      open: true,
      supplierId,
      action: currentStatus ? "deactivate" : "activate",
    })
  }

  const confirmStatusChange = async () => {
    const { supplierId, action } = confirmDialog
    const newStatus = action === "activate"

    const success = await updateSupplier(supplierId, { active: newStatus })

    if (success) {
      toast({
        title: newStatus ? "Fornecedor ativado" : "Fornecedor desativado",
        description: `O status do fornecedor foi alterado com sucesso.`,
      })
    }

    setConfirmDialog({ open: false, supplierId: "", action: "activate" })
  }

  const handleViewDetails = (supplierId: string) => {
    setIsNavigating(true)
    router.push(`/dashboard/fornecedores/${supplierId}`)
  }

  const handleEditSupplier = (supplierId: string) => {
    setIsNavigating(true)
    router.push(`/dashboard/fornecedores/editar/${supplierId}`)
  }

  const handleViewContracts = (supplierId: string) => {
    setIsNavigating(true)
    router.push(`/dashboard/contratos?fornecedor=${supplierId}`)
  }

  const renderRatingStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            className={`h-4 w-4 ${i < Math.round(rating) ? "fill-primary" : "fill-muted"}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-48" />
          </div>
        </div>

        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {isNavigating && <NavigationProgress />}

      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Fornecedores</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Importar
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting || suppliers.length === 0}>
            {isExporting ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </>
            )}
          </Button>
          <Button size="sm" onClick={handleNewSupplier} disabled={isNavigating}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Fornecedor
          </Button>
        </div>
      </div>

      {suppliers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum fornecedor cadastrado</h3>
            <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
              Comece adicionando fornecedores ao sistema para gerenciar seus contratos e pedidos de forma eficiente.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleNewSupplier}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Primeiro Fornecedor
              </Button>
              <Button variant="outline" onClick={() => setShowImportDialog(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Importar Fornecedores
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="todos" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex justify-between">
            <TabsList>
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="ativos">Ativos</TabsTrigger>
              <TabsTrigger value="inativos">Inativos</TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar fornecedor..."
                  className="w-[200px] pl-8 md:w-[260px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="mr-2 h-4 w-4" />
                Filtros
              </Button>
            </div>
          </div>

          {showFilters && (
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Filtros Avançados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Categoria</label>
                    <Select
                      value={filters.category}
                      onValueChange={(value) => setFilters({ ...filters, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as categorias" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as categorias</SelectItem>
                        <SelectItem value="Saúde">Saúde</SelectItem>
                        <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                        <SelectItem value="Construção">Construção</SelectItem>
                        <SelectItem value="Alimentação">Alimentação</SelectItem>
                        <SelectItem value="Serviços">Serviços</SelectItem>
                        <SelectItem value="Educação">Educação</SelectItem>
                        <SelectItem value="Transporte">Transporte</SelectItem>
                        <SelectItem value="Material de Consumo">Material de Consumo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Avaliação mínima</label>
                    <Select value={filters.rating} onValueChange={(value) => setFilters({ ...filters, rating: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Qualquer avaliação" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Qualquer avaliação</SelectItem>
                        <SelectItem value="5">5 estrelas</SelectItem>
                        <SelectItem value="4">4+ estrelas</SelectItem>
                        <SelectItem value="3">3+ estrelas</SelectItem>
                        <SelectItem value="2">2+ estrelas</SelectItem>
                        <SelectItem value="1">1+ estrela</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => setFilters({ category: "", rating: "", hasContracts: false })}
                    >
                      Limpar Filtros
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <TabsContent value="todos" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Resumo de Fornecedores</CardTitle>
                <CardDescription>Visão geral dos fornecedores cadastrados no sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="border-none shadow-none">
                    <CardHeader className="px-0 pb-2">
                      <CardDescription>Total de Fornecedores</CardDescription>
                      <CardTitle className="text-2xl">{totalSuppliers}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="border-none shadow-none">
                    <CardHeader className="px-0 pb-2">
                      <CardDescription>Fornecedores Ativos</CardDescription>
                      <CardTitle className="text-2xl">{activeSuppliers}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="border-none shadow-none">
                    <CardHeader className="px-0 pb-2">
                      <CardDescription>Contratos Ativos</CardDescription>
                      <CardTitle className="text-2xl">0</CardTitle>
                    </CardHeader>
                  </Card>
                </div>
                <Separator className="my-4" />
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="mb-2 text-sm font-medium">Categoria de Fornecedores</h4>
                    <div className="space-y-2">
                      {topCategories.length > 0 ? (
                        topCategories.map(([category, count], i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-sm">{category}</span>
                            <span className="text-sm font-medium">{count}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">Nenhuma categoria registrada</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-2 text-sm font-medium">Avaliação de Fornecedores</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Excelente</span>
                        <span className="text-sm font-medium">{ratingCounts.excellent}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Bom</span>
                        <span className="text-sm font-medium">{ratingCounts.good}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Regular</span>
                        <span className="text-sm font-medium">{ratingCounts.regular}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>Lista de Fornecedores</CardTitle>
                  <Select defaultValue="recentes" value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recentes">Mais recentes</SelectItem>
                      <SelectItem value="alfabetica">Ordem alfabética</SelectItem>
                      <SelectItem value="avaliacao">Melhor avaliação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Contratos</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Avaliação</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedSuppliers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                          Nenhum fornecedor encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedSuppliers.map((supplier) => (
                        <TableRow key={supplier.id}>
                          <TableCell className="font-medium">
                            <button
                              className="hover:underline text-left"
                              onClick={() => handleViewDetails(supplier.id)}
                            >
                              {supplier.name}
                            </button>
                          </TableCell>
                          <TableCell>{supplier.category}</TableCell>
                          <TableCell>0</TableCell>
                          <TableCell>
                            <Badge variant={supplier.active ? "default" : "destructive"}>
                              {supplier.active ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell>{renderRatingStars(supplier.rating)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewDetails(supplier.id)}>
                                  Ver detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditSupplier(supplier.id)}>
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewContracts(supplier.id)}>
                                  Ver contratos
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className={supplier.active ? "text-destructive" : "text-primary"}
                                  onClick={() => handleToggleStatus(supplier.id, supplier.active)}
                                >
                                  {supplier.active ? "Desativar" : "Reativar"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ativos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Fornecedores Ativos</CardTitle>
                <CardDescription>Lista de fornecedores com status ativo no sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Contratos</TableHead>
                      <TableHead>Avaliação</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedSuppliers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                          Nenhum fornecedor ativo encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedSuppliers.map((supplier) => (
                        <TableRow key={supplier.id}>
                          <TableCell className="font-medium">
                            <button
                              className="hover:underline text-left"
                              onClick={() => handleViewDetails(supplier.id)}
                            >
                              {supplier.name}
                            </button>
                          </TableCell>
                          <TableCell>{supplier.category}</TableCell>
                          <TableCell>0</TableCell>
                          <TableCell>{renderRatingStars(supplier.rating)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewDetails(supplier.id)}>
                                  Ver detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditSupplier(supplier.id)}>
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewContracts(supplier.id)}>
                                  Ver contratos
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleToggleStatus(supplier.id, true)}
                                >
                                  Desativar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inativos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Fornecedores Inativos</CardTitle>
                <CardDescription>Lista de fornecedores com status inativo no sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Último Contrato</TableHead>
                      <TableHead>Inativo desde</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedSuppliers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                          Nenhum fornecedor inativo encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedSuppliers.map((supplier) => (
                        <TableRow key={supplier.id}>
                          <TableCell className="font-medium">
                            <button
                              className="hover:underline text-left"
                              onClick={() => handleViewDetails(supplier.id)}
                            >
                              {supplier.name}
                            </button>
                          </TableCell>
                          <TableCell>{supplier.category}</TableCell>
                          <TableCell>N/A</TableCell>
                          <TableCell>{new Date(supplier.updatedAt).toLocaleDateString("pt-BR")}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewDetails(supplier.id)}>
                                  Ver detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewContracts(supplier.id)}>
                                  Ver histórico
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-primary"
                                  onClick={() => handleToggleStatus(supplier.id, false)}
                                >
                                  Reativar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
      <SupplierImportDialog open={showImportDialog} onOpenChange={setShowImportDialog} />
    </div>
  )
}
