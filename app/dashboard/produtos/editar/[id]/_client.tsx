"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useProducts } from "@/lib/products-provider"
import { useSuppliers } from "@/lib/suppliers-provider"
import { ArrowLeft, Package, Barcode, Tag, AlertCircle } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { formatCurrency } from "@/lib/utils"
import { LoadingSpinner } from "@/components/loading-spinner"

interface EditarProdutoClientProps {
  params: { id: string }
}

export function EditarProdutoClient({ params }: EditarProdutoClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { getProductById, updateProduct } = useProducts()
  const { suppliers } = useSuppliers()

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    supplierId: "",
    price: "",
    cost: "",
    unit: "un",
    sku: "",
    barcode: "",
    minStock: "10",
    currentStock: "0",
    stockMax: "100",
    location: "",
    active: true,
    notes: "",
    taxRate: "0",
    weight: "",
    dimensions: {
      length: "",
      width: "",
      height: "",
    },
    images: [],
    tags: [],
    customFields: {},
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const product = getProductById(params.id)
    if (product) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        category: product.category || "",
        supplierId: product.supplierId || "",
        price: product.price?.toString() || "",
        cost: "",
        unit: product.unit || "un",
        sku: product.sku || "",
        barcode: product.barcode || "",
        minStock: product.minStock?.toString() || "10",
        currentStock: product.currentStock?.toString() || "0",
        stockMax: "100",
        location: "",
        active: product.active !== false,
        notes: "",
        taxRate: "0",
        weight: "",
        dimensions: { length: "", width: "", height: "" },
        images: [],
        tags: [],
        customFields: {},
      })
      setLoading(false)
    } else {
      router.push("/dashboard/produtos")
    }
  }, [params.id, getProductById, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSliderChange = (name: string, value: number[]) => {
    setFormData((prev) => ({ ...prev, [name]: value[0].toString() }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Nome do produto é obrigatório"
    }

    if (!formData.category) {
      newErrors.category = "Categoria é obrigatória"
    }

    if (!formData.supplierId) {
      newErrors.supplierId = "Fornecedor é obrigatório"
    }

    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = "Preço deve ser um valor positivo"
    }

    if (formData.cost && (isNaN(Number(formData.cost)) || Number(formData.cost) < 0)) {
      newErrors.cost = "Custo deve ser um valor positivo ou zero"
    }

    if (!formData.sku.trim()) {
      newErrors.sku = "Código do produto é obrigatório"
    }

    if (isNaN(Number(formData.minStock)) || Number(formData.minStock) < 0) {
      newErrors.minStock = "Estoque mínimo deve ser um número positivo ou zero"
    }

    if (isNaN(Number(formData.currentStock)) || Number(formData.currentStock) < 0) {
      newErrors.currentStock = "Estoque atual deve ser um número positivo ou zero"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: "Erro de validação",
        description: "Por favor, corrija os erros no formulário antes de continuar.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const price = Number(formData.price)
      const minStock = Number(formData.minStock)
      const currentStock = Number(formData.currentStock)

      const updatedProduct = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price,
        unit: formData.unit,
        sku: formData.sku,
        barcode: formData.barcode,
        minStock,
        currentStock,
        supplierId: formData.supplierId,
        active: formData.active,
      }

      const success = await updateProduct(params.id, updatedProduct)

      if (success) {
        toast({
          title: "Produto atualizado com sucesso",
          description: `O produto "${formData.name}" foi atualizado no sistema.`,
        })

        router.push("/dashboard/produtos")
      } else {
        toast({
          title: "Erro ao atualizar produto",
          description: "Ocorreu um erro ao atualizar o produto. Tente novamente.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao atualizar produto:", error)
      toast({
        title: "Erro ao atualizar produto",
        description: "Ocorreu um erro ao atualizar o produto. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const calculateProfit = () => {
    const price = Number(formData.price) || 0
    const cost = Number(formData.cost) || 0

    if (price === 0 || cost === 0) return 0

    const profit = price - cost
    const margin = (profit / price) * 100

    return margin.toFixed(2)
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.push("/dashboard/produtos")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Editar Produto</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
            <TabsTrigger value="stock">Estoque</TabsTrigger>
            <TabsTrigger value="additional">Informações Adicionais</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dados do Produto</CardTitle>
                <CardDescription>Informações básicas sobre o produto</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sku">Código do Produto *</Label>
                    <div className="flex">
                      <div className="flex items-center justify-center bg-muted px-3 rounded-l-md border border-r-0 border-input">
                        <Barcode className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Input
                        id="sku"
                        name="sku"
                        className={`rounded-l-none ${errors.sku ? "border-destructive" : ""}`}
                        value={formData.sku}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    {errors.sku && <p className="text-sm text-destructive mt-1">{errors.sku}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Produto *</Label>
                    <div className="flex">
                      <div className="flex items-center justify-center bg-muted px-3 rounded-l-md border border-r-0 border-input">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Input
                        id="name"
                        name="name"
                        className={`rounded-l-none ${errors.name ? "border-destructive" : ""}`}
                        placeholder="Nome do produto"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleSelectChange("category", value)}>
                      <SelectTrigger id="category" className={errors.category ? "border-destructive" : ""}>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Saúde">Saúde</SelectItem>
                        <SelectItem value="Construção">Construção</SelectItem>
                        <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                        <SelectItem value="Escritório">Escritório</SelectItem>
                        <SelectItem value="Alimentação">Alimentação</SelectItem>
                        <SelectItem value="Limpeza">Limpeza</SelectItem>
                        <SelectItem value="Outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.category && <p className="text-sm text-destructive mt-1">{errors.category}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supplierId">Fornecedor *</Label>
                    <Select
                      value={formData.supplierId}
                      onValueChange={(value) => handleSelectChange("supplierId", value)}
                    >
                      <SelectTrigger id="supplierId" className={errors.supplierId ? "border-destructive" : ""}>
                        <SelectValue placeholder="Selecione o fornecedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.supplierId && <p className="text-sm text-destructive mt-1">{errors.supplierId}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Preço de Venda (R$) *</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      min="0.001"
                      step="0.001"
                      placeholder="0,000"
                      value={formData.price}
                      onChange={handleInputChange}
                      className={errors.price ? "border-destructive" : ""}
                      required
                    />
                    {errors.price && <p className="text-sm text-destructive mt-1">{errors.price}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cost">Custo de Aquisição (R$)</Label>
                    <Input
                      id="cost"
                      name="cost"
                      type="number"
                      min="0"
                      step="0.001"
                      placeholder="0,000"
                      value={formData.cost}
                      onChange={handleInputChange}
                      className={errors.cost ? "border-destructive" : ""}
                    />
                    {errors.cost && <p className="text-sm text-destructive mt-1">{errors.cost}</p>}
                    {formData.cost && formData.price && (
                      <p className="text-xs text-muted-foreground mt-1">Margem de lucro: {calculateProfit()}%</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Descrição detalhada do produto"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stock" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações de Estoque</CardTitle>
                <CardDescription>Configurações de estoque do produto</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="currentStock">Quantidade em Estoque</Label>
                    <Input
                      id="currentStock"
                      name="currentStock"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.currentStock}
                      onChange={handleInputChange}
                      className={errors.currentStock ? "border-destructive" : ""}
                    />
                    {errors.currentStock && <p className="text-sm text-destructive mt-1">{errors.currentStock}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit">Unidade de Medida</Label>
                    <Select value={formData.unit} onValueChange={(value) => handleSelectChange("unit", value)}>
                      <SelectTrigger id="unit">
                        <SelectValue placeholder="Selecione a unidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="un">Unidade (un)</SelectItem>
                        <SelectItem value="kg">Quilograma (kg)</SelectItem>
                        <SelectItem value="g">Grama (g)</SelectItem>
                        <SelectItem value="l">Litro (l)</SelectItem>
                        <SelectItem value="ml">Mililitro (ml)</SelectItem>
                        <SelectItem value="m">Metro (m)</SelectItem>
                        <SelectItem value="cm">Centímetro (cm)</SelectItem>
                        <SelectItem value="m2">Metro quadrado (m²)</SelectItem>
                        <SelectItem value="m3">Metro cúbico (m³)</SelectItem>
                        <SelectItem value="cx">Caixa (cx)</SelectItem>
                        <SelectItem value="pct">Pacote (pct)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Localização no Estoque</Label>
                    <Input
                      id="location"
                      name="location"
                      placeholder="Ex: Prateleira A, Seção 3"
                      value={formData.location}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="minStock">Estoque Mínimo</Label>
                      <span className="text-sm text-muted-foreground">
                        {formData.minStock} {formData.unit}
                      </span>
                    </div>
                    <Slider
                      id="minStock"
                      defaultValue={[Number.parseInt(formData.minStock)]}
                      max={Number.parseInt(formData.stockMax)}
                      step={1}
                      onValueChange={(value) => handleSliderChange("minStock", value)}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Quando o estoque atingir este valor, o sistema irá alertar sobre a necessidade de reposição.
                    </p>
                    {errors.minStock && <p className="text-sm text-destructive mt-1">{errors.minStock}</p>}
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="stockMax">Estoque Máximo</Label>
                      <span className="text-sm text-muted-foreground">
                        {formData.stockMax} {formData.unit}
                      </span>
                    </div>
                    <Slider
                      id="stockMax"
                      defaultValue={[Number.parseInt(formData.stockMax)]}
                      max={500}
                      step={10}
                      onValueChange={(value) => handleSliderChange("stockMax", value)}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Capacidade máxima de armazenamento para este produto.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => handleSwitchChange("active", checked)}
                  />
                  <Label htmlFor="active">Produto ativo</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Produtos inativos não aparecem nas listagens de pedidos e não podem ser adicionados a novos pedidos.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="additional" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Adicionais</CardTitle>
                <CardDescription>Dados complementares sobre o produto</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="barcode">Código de Barras</Label>
                  <div className="flex">
                    <div className="flex items-center justify-center bg-muted px-3 rounded-l-md border border-r-0 border-input">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input
                      id="barcode"
                      name="barcode"
                      className="rounded-l-none"
                      placeholder="Código de barras do produto"
                      value={formData.barcode}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Peso (kg)</Label>
                    <Input
                      id="weight"
                      name="weight"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.weight}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Alíquota de Imposto (%)</Label>
                    <Input
                      id="taxRate"
                      name="taxRate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.taxRate}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Informações adicionais sobre o produto"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={5}
                  />
                </div>
              </CardContent>
            </Card>

            {formData.name && formData.price && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Previsão de Produto</AlertTitle>
                <AlertDescription>
                  <p>
                    O produto <strong>{formData.name}</strong> será atualizado com preço de venda de{" "}
                    <strong>{formatCurrency(Number(formData.price))}</strong>.
                  </p>
                  {formData.cost && (
                    <p className="mt-1">
                      Custo de aquisição: {formatCurrency(Number(formData.cost))} | Margem de lucro: {calculateProfit()}
                      %
                    </p>
                  )}
                  {formData.currentStock && Number(formData.currentStock) > 0 && (
                    <p className="mt-1">
                      Estoque: {formData.currentStock} {formData.unit} | Valor em estoque:{" "}
                      {formatCurrency(Number(formData.currentStock) * Number(formData.price))}
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <CardFooter className="flex justify-between border rounded-lg p-6">
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard/produtos")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Atualizando..." : "Atualizar Produto"}
            </Button>
          </CardFooter>
        </Tabs>
      </form>
    </div>
  )
}
