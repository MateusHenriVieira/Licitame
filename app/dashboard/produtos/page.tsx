"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, Filter, Download, MoreHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { useProducts } from "@/lib/products-provider"
import { formatCurrency } from "@/lib/utils"

export default function ProdutosPage() {
  const { products, exportProducts } = useProducts()

  const handleExport = () => {
    exportProducts()
  }

  // Calcular estatísticas
  const totalProducts = products.length
  const activeProducts = products.filter((p) => p.active).length
  const lowStockProducts = products.filter((p) => p.currentStock <= p.minStock).length

  // Agrupar por categoria
  const categoryCounts = products.reduce(
    (acc, product) => {
      const category = product.category
      acc[category] = (acc[category] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Agrupar por status de estoque
  const stockStatus = {
    adequate: products.filter((p) => p.currentStock > p.minStock * 2).length,
    low: products.filter((p) => p.currentStock <= p.minStock * 2 && p.currentStock > p.minStock).length,
    critical: products.filter((p) => p.currentStock <= p.minStock && p.currentStock > 0).length,
    out: products.filter((p) => p.currentStock === 0).length,
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Produtos</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Link href="/dashboard/produtos/novo">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="todos" className="space-y-4">
        <div className="flex justify-between">
          <TabsList>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="ativos">Ativos</TabsTrigger>
            <TabsTrigger value="estoque-baixo">Estoque Baixo</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Buscar produto..." className="w-[200px] pl-8 md:w-[260px]" />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
          </div>
        </div>

        <TabsContent value="todos" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Resumo de Produtos</CardTitle>
              <CardDescription>Visão geral dos produtos cadastrados no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-none shadow-none">
                  <CardHeader className="px-0 pb-2">
                    <CardDescription>Total de Produtos</CardDescription>
                    <CardTitle className="text-2xl">{totalProducts}</CardTitle>
                  </CardHeader>
                </Card>
                <Card className="border-none shadow-none">
                  <CardHeader className="px-0 pb-2">
                    <CardDescription>Produtos Ativos</CardDescription>
                    <CardTitle className="text-2xl">{activeProducts}</CardTitle>
                  </CardHeader>
                </Card>
                <Card className="border-none shadow-none">
                  <CardHeader className="px-0 pb-2">
                    <CardDescription>Estoque Baixo</CardDescription>
                    <CardTitle className="text-2xl">{lowStockProducts}</CardTitle>
                  </CardHeader>
                </Card>
              </div>
              <Separator className="my-4" />
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="mb-2 text-sm font-medium">Categorias de Produtos</h4>
                  <div className="space-y-2">
                    {Object.entries(categoryCounts).map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between">
                        <span className="text-sm">{category}</span>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-medium">Status de Estoque</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Adequado</span>
                      <span className="text-sm font-medium">{stockStatus.adequate}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Baixo</span>
                      <span className="text-sm font-medium">{stockStatus.low}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Crítico</span>
                      <span className="text-sm font-medium">{stockStatus.critical}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Esgotado</span>
                      <span className="text-sm font-medium">{stockStatus.out}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Lista de Produtos</CardTitle>
                <Select defaultValue="recentes">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recentes">Mais recentes</SelectItem>
                    <SelectItem value="alfabetica">Ordem alfabética</SelectItem>
                    <SelectItem value="estoque">Nível de estoque</SelectItem>
                    <SelectItem value="preco">Preço</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.slice(0, 5).map((product, i) => {
                    const stockPercentage = Math.min(
                      100,
                      Math.round((product.currentStock / (product.minStock * 3)) * 100),
                    )
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.sku}</TableCell>
                        <TableCell>
                          <Link href={`/dashboard/produtos/${product.id}`} className="hover:underline">
                            {product.name}
                          </Link>
                        </TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>Fornecedor {product.supplierId.replace("s", "")}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs">{product.currentStock} un.</span>
                              <span className="text-xs">{stockPercentage}%</span>
                            </div>
                            <Progress value={stockPercentage} className="h-2" />
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(product.price)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Link href={`/dashboard/produtos/${product.id}`}>Ver detalhes</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Link href={`/dashboard/produtos/editar/${product.id}`}>Editar</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>Ajustar estoque</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">Desativar</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ativos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Produtos Ativos</CardTitle>
              <CardDescription>Lista de produtos com status ativo no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products
                    .filter((p) => p.active)
                    .slice(0, 4)
                    .map((product) => {
                      const stockPercentage = Math.min(
                        100,
                        Math.round((product.currentStock / (product.minStock * 3)) * 100),
                      )
                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.sku}</TableCell>
                          <TableCell>
                            <Link href={`/dashboard/produtos/${product.id}`} className="hover:underline">
                              {product.name}
                            </Link>
                          </TableCell>
                          <TableCell>{product.category}</TableCell>
                          <TableCell>Fornecedor {product.supplierId.replace("s", "")}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs">{product.currentStock} un.</span>
                                <span className="text-xs">{stockPercentage}%</span>
                              </div>
                              <Progress value={stockPercentage} className="h-2" />
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(product.price)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                                <DropdownMenuItem>Editar</DropdownMenuItem>
                                <DropdownMenuItem>Ajustar estoque</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">Desativar</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estoque-baixo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Produtos com Estoque Baixo</CardTitle>
              <CardDescription>Lista de produtos que precisam de reposição</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products
                    .filter((p) => p.currentStock <= p.minStock)
                    .slice(0, 3)
                    .map((product, i) => {
                      const stockPercentage = Math.min(
                        100,
                        Math.round((product.currentStock / (product.minStock * 3)) * 100),
                      )
                      const isCritical = product.currentStock === 0 || product.currentStock <= product.minStock * 0.5

                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.sku}</TableCell>
                          <TableCell>
                            <Link href={`/dashboard/produtos/${product.id}`} className="hover:underline">
                              {product.name}
                            </Link>
                          </TableCell>
                          <TableCell>{product.category}</TableCell>
                          <TableCell>Fornecedor {product.supplierId.replace("s", "")}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs">{product.currentStock} un.</span>
                                <span className="text-xs">{stockPercentage}%</span>
                              </div>
                              <Progress value={stockPercentage} className="h-2" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={isCritical ? "destructive" : "warning"}>
                              {product.currentStock === 0 ? "Esgotado" : isCritical ? "Crítico" : "Baixo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                                <DropdownMenuItem>Solicitar compra</DropdownMenuItem>
                                <DropdownMenuItem>Ajustar estoque</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
