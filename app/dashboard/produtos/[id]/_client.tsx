"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useProducts } from "@/lib/products-provider"
import { useSuppliers } from "@/lib/suppliers-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Package, Truck, Calendar, BarChart3, Edit, Trash2, AlertTriangle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/loading-spinner"

export default function ProductDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { getProductById } = useProducts()
  const { getSupplierById } = useSuppliers()

  const [product, setProduct] = useState<any>(null)
  const [supplier, setSupplier] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      const productData = getProductById(params.id as string)
      if (productData) {
        setProduct(productData)

        // Buscar fornecedor
        const supplierData = getSupplierById(productData.supplierId)
        if (supplierData) {
          setSupplier(supplierData)
        }
      }
      setLoading(false)
    }
  }, [params.id, getProductById, getSupplierById])

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="p-6">
        <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/produtos")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Produtos
        </Button>

        <div className="mt-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Produto não encontrado</AlertTitle>
            <AlertDescription>O produto solicitado não foi encontrado no sistema.</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  // Calcular porcentagem de estoque
  const stockPercentage = Math.min(100, Math.round((product.currentStock / (product.minStock * 3)) * 100))

  // Determinar status do estoque
  let stockStatus = "adequate"
  let stockStatusLabel = "Adequado"
  let stockVariant = "default"

  if (product.currentStock === 0) {
    stockStatus = "out"
    stockStatusLabel = "Esgotado"
    stockVariant = "destructive"
  } else if (product.currentStock <= product.minStock * 0.5) {
    stockStatus = "critical"
    stockStatusLabel = "Crítico"
    stockVariant = "destructive"
  } else if (product.currentStock <= product.minStock) {
    stockStatus = "low"
    stockStatusLabel = "Baixo"
    stockVariant = "warning"
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.push("/dashboard/produtos")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
          <Badge variant={product.active ? "default" : "secondary"}>{product.active ? "Ativo" : "Inativo"}</Badge>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/produtos/editar/${product.id}`)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>Detalhes do produto</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Código</dt>
                <dd className="text-base">{product.sku}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Categoria</dt>
                <dd className="text-base">{product.category}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Preço</dt>
                <dd className="text-base font-medium">{formatCurrency(product.price)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Unidade</dt>
                <dd className="text-base">{product.unit}</dd>
              </div>
              {product.barcode && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Código de Barras</dt>
                  <dd className="text-base">{product.barcode}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Descrição</dt>
                <dd className="text-sm text-muted-foreground">{product.description || "Sem descrição"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Estoque</CardTitle>
                <CardDescription>Informações de estoque</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Nível de Estoque</span>
                  <Badge variant={stockVariant as any}>{stockStatusLabel}</Badge>
                </div>
                <div className="mt-2">
                  <Progress value={stockPercentage} className="h-2" />
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs">
                      {product.currentStock} {product.unit}
                    </span>
                    <span className="text-xs">{stockPercentage}%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Estoque Atual</span>
                  <span className="font-medium">
                    {product.currentStock} {product.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Estoque Mínimo</span>
                  <span>
                    {product.minStock} {product.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Valor em Estoque</span>
                  <span>{formatCurrency(product.currentStock * product.price)}</span>
                </div>
              </div>

              {product.currentStock <= product.minStock && (
                <Alert variant={product.currentStock === 0 ? "destructive" : "warning"}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Alerta de Estoque</AlertTitle>
                  <AlertDescription>
                    {product.currentStock === 0
                      ? "Este produto está esgotado e precisa ser reposto urgentemente."
                      : "O estoque deste produto está abaixo do mínimo recomendado."}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Fornecedor</CardTitle>
                <CardDescription>Informações do fornecedor</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {supplier ? (
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Nome</dt>
                  <dd className="text-base">{supplier.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">CNPJ</dt>
                  <dd className="text-base">{supplier.cnpj || "Não informado"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Contato</dt>
                  <dd className="text-base">{supplier.contactName || "Não informado"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Telefone</dt>
                  <dd className="text-base">{supplier.phone || "Não informado"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                  <dd className="text-base">{supplier.email || "Não informado"}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">Informações do fornecedor não disponíveis</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Movimentações</CardTitle>
              <CardDescription>Registro de entradas e saídas do produto</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 border-b pb-4">
                  <Calendar className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Entrada de Estoque</p>
                    <p className="text-sm text-muted-foreground">Adicionadas 50 unidades ao estoque em 15/04/2023</p>
                  </div>
                  <Badge className="ml-auto">+50 un</Badge>
                </div>

                <div className="flex items-center gap-4 border-b pb-4">
                  <Calendar className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Saída para Pedido #12345</p>
                    <p className="text-sm text-muted-foreground">Removidas 20 unidades do estoque em 20/05/2023</p>
                  </div>
                  <Badge variant="secondary" className="ml-auto">
                    -20 un
                  </Badge>
                </div>

                <div className="flex items-center gap-4">
                  <Calendar className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Ajuste de Inventário</p>
                    <p className="text-sm text-muted-foreground">Ajuste manual de estoque em 10/06/2023</p>
                  </div>
                  <Badge variant="outline" className="ml-auto">
                    +5 un
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pedidos Relacionados</CardTitle>
              <CardDescription>Pedidos que incluem este produto</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Nenhum pedido encontrado para este produto.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Documentos</CardTitle>
              <CardDescription>Documentos relacionados ao produto</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Nenhum documento disponível para este produto.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
