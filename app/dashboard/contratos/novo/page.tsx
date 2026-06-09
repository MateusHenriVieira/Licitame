"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useContracts } from "@/lib/contracts-provider"
import { useSuppliers } from "@/lib/suppliers-provider"
import { useToast } from "@/hooks/use-toast"
import { formatDocument, validateDocumentWithDetails, formatCPF, validateCPF, isCPFFormatValid, formatCNPJ, isCNPJFormatValid, validateCNPJWithDetails } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { DatePicker } from "@/components/ui/date-picker"
import { Checkbox } from "@/components/ui/checkbox"
import { NavigationProgress } from "@/components/navigation-progress"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import {
  ArrowLeft,
  Building,
  FileText,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  Globe,
  User,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Plus,
  Trash2,
  Building2,
} from "lucide-react"

export default function NovoContratoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { addContract } = useContracts()
  const { addSupplier, suppliers } = useSuppliers()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [cnpjValidationTimeout, setCnpjValidationTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isCnpjValid, setIsCnpjValid] = useState<boolean | null>(null)
  const [createSupplier, setCreateSupplier] = useState(false)

  const [formData, setFormData] = useState({
    // Informações básicas do contrato
    number: "",
    company: "",
    cnpj: "",
    value: "",
    startDate: undefined as Date | undefined,
    expirationDate: undefined as Date | undefined,
    costBase: "",
    description: "",
    status: "ativo" as "ativo" | "vencido" | "expirado" | "cancelado",

    // Informações do fornecedor (quando createSupplier = true)
    category: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    contactName: "",
    contactPhone: "",
    email: "",
    website: "",
  })

  const [items, setItems] = useState<
    Array<{
      id: string
      name: string
      description: string
      quantity: string
      unitPrice: string
      totalPrice: string
    }>
  >([
    {
      id: "1",
      name: "",
      description: "",
      quantity: "1",
      unitPrice: "0",
      totalPrice: "0",
    },
  ])

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (formData.cnpj && (isCNPJFormatValid(formData.cnpj) || isCPFFormatValid(formData.cnpj))) {
      const isDuplicate = suppliers.some((supplier) => supplier.cnpj === formData.cnpj)
      if (isDuplicate && createSupplier) {
        setErrors((prev) => ({
          ...prev,
          cnpj: "CNPJ/CPF já cadastrado. Desmarque 'Cadastrar fornecedor' para usar o existente.",
        }))
      } else {
        // Limpar erro de CNPJ/CPF duplicado se a condição não é mais verdadeira
        setErrors((prev) => {
          const newErrors = { ...prev }
          if (newErrors.cnpj?.includes("CNPJ/CPF já cadastrado")) {
            delete newErrors.cnpj
          }
          return newErrors
        })
      }
    }
  }, [formData.cnpj, suppliers, createSupplier])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    if (name === "cnpj") {
      const formattedDocument = formatDocument(value)
      setFormData((prev) => ({ ...prev, [name]: formattedDocument }))

      setIsCnpjValid(null)

      if (cnpjValidationTimeout) {
        clearTimeout(cnpjValidationTimeout)
      }

      const timeout = setTimeout(() => {
        const cleanValue = formattedDocument.replace(/\D/g, "")
        if (cleanValue.length === 14 || cleanValue.length === 11) {
          const validation = validateDocumentWithDetails(formattedDocument)
          setIsCnpjValid(validation.isValid)

          if (!validation.isValid) {
            setErrors((prev) => ({
              ...prev,
              cnpj: validation.message || "CNPJ/CPF inválido",
            }))
          } else {
            const newErrors = { ...errors }
            delete newErrors.cnpj
            setErrors(newErrors)
          }
        }
      }, 500)

      setCnpjValidationTimeout(timeout)
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }

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

  const handleDateChange = (name: "startDate" | "expirationDate", date: Date | undefined) => {
    setFormData((prev) => ({ ...prev, [name]: date }))

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleItemChange = (id: string, field: string, value: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value }

          if (field === "quantity" || field === "unitPrice") {
            const quantity = Number.parseFloat(field === "quantity" ? value : item.quantity) || 0
            const unitPrice = Number.parseFloat(field === "unitPrice" ? value : item.unitPrice) || 0
            updatedItem.totalPrice = (quantity * unitPrice).toFixed(2)
          }

          return updatedItem
        }
        return item
      }),
    )
  }

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: "",
        description: "",
        quantity: "1",
        unitPrice: "0",
        totalPrice: "0",
      },
    ])
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const calculateTotalValue = () => {
    return items.reduce((sum, item) => sum + Number.parseFloat(item.totalPrice || "0"), 0).toFixed(2)
  }

  const isCnpjFormatValid = (cnpj: string): boolean => {
    return isCNPJFormatValid(cnpj) || isCPFFormatValid(cnpj)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validar campos obrigatórios do contrato
    if (!formData.number.trim()) newErrors.number = "Número do contrato é obrigatório"
    if (!formData.company.trim()) newErrors.company = "Empresa é obrigatória"
    if (!formData.cnpj.trim()) newErrors.cnpj = "CNPJ/CPF é obrigatório"
    if (!formData.value.trim()) newErrors.value = "Valor é obrigatório"
    if (!formData.startDate) newErrors.startDate = "Data de início é obrigatória"
    if (!formData.expirationDate) newErrors.expirationDate = "Data de vencimento é obrigatória"
    if (!formData.costBase.trim()) newErrors.costBase = "Base de custo é obrigatória"
    if (!formData.description.trim()) newErrors.description = "Descrição é obrigatória"

    // Validar CNPJ/CPF
    if (formData.cnpj) {
      const validation = validateDocumentWithDetails(formData.cnpj)
      if (!validation.isValid) {
        newErrors.cnpj = validation.message || "CNPJ/CPF inválido"
      }
    }

    // Validar campos do fornecedor se createSupplier estiver marcado
    if (createSupplier) {
      if (!formData.category.trim()) newErrors.category = "Categoria é obrigatória"
      if (!formData.address.trim()) newErrors.address = "Endereço é obrigatório"
      if (!formData.city.trim()) newErrors.city = "Cidade é obrigatória"
      if (!formData.state.trim()) newErrors.state = "Estado é obrigatório"

      // Validar email se fornecido
      if (formData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) {
          newErrors.email = "Email inválido"
        }
      }

      // Verificar CNPJ/CPF duplicado
      const isDuplicate = suppliers.some((supplier) => supplier.cnpj === formData.cnpj)
      if (isDuplicate) {
        newErrors.cnpj = "CNPJ/CPF já cadastrado. Desmarque 'Cadastrar fornecedor' para usar o existente."
      }
    }

    // Validar itens
    if (items.length === 0) {
      newErrors.items = "Adicione pelo menos um item ao contrato"
    }

    items.forEach((item, index) => {
      if (!item.name.trim()) {
        newErrors[`item_${index}_name`] = "Nome do item é obrigatório"
      }
    })

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
      await new Promise((resolve) => setTimeout(resolve, 1000))

      let supplierId: string | undefined = undefined

      // Criar fornecedor se a opção estiver marcada
      if (createSupplier) {
        const supplierData = {
          name: formData.company,
          cnpj: formData.cnpj,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          contactName: formData.contactName,
          contactPhone: formData.contactPhone,
          email: formData.email,
          website: formData.website,
          category: formData.category,
          rating: 0,
          active: true,
        }

        const supplierSuccess = await addSupplier(supplierData)

        if (!supplierSuccess) {
          toast({
            title: "Erro ao cadastrar fornecedor",
            description: "Não foi possível criar o fornecedor. Tente novamente.",
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }

        // Aguardar um momento para garantir que o estado foi atualizado
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Buscar o fornecedor recém-criado pelo CNPJ
        const createdSupplier = suppliers.find((s) => s.cnpj === formData.cnpj)
        if (createdSupplier) {
          supplierId = createdSupplier.id
        }

        toast({
          title: "Fornecedor cadastrado",
          description: `${formData.company} foi adicionado aos fornecedores.`,
        })
      }

      // Criar contrato
      const contractData = {
        number: formData.number,
        company: formData.company,
        value: Number.parseFloat(formData.value.replace(/[^\d,.-]/g, "").replace(",", ".")),
        startDate: formData.startDate ? formData.startDate.toISOString().split("T")[0] : "",
        expirationDate: formData.expirationDate ? formData.expirationDate.toISOString().split("T")[0] : "",
        costBase: formData.costBase,
        description: formData.description,
        status: formData.status,
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          quantity: Number.parseFloat(item.quantity),
          unitPrice: Number.parseFloat(item.unitPrice),
          totalPrice: Number.parseFloat(item.totalPrice),
          usedQuantity: 0,
        })),
        supplierId,
      }

      const contractSuccess = await addContract(contractData)

      if (!contractSuccess) {
        toast({
          title: "Erro ao cadastrar contrato",
          description: "Não foi possível criar o contrato. Tente novamente.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      toast({
        title: "Contrato cadastrado com sucesso",
        description: `Contrato ${formData.number} foi adicionado ao sistema.`,
      })

      setIsNavigating(true)
      router.push("/dashboard/contratos")
    } catch (error) {
      console.error("Erro ao cadastrar contrato:", error)
      toast({
        title: "Erro ao cadastrar contrato",
        description: "Ocorreu um erro ao tentar cadastrar o contrato. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsNavigating(true)
    router.push("/dashboard/contratos")
  }

  return (
    <div className="space-y-6">
      {isNavigating && <NavigationProgress />}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleCancel} disabled={isNavigating || isSubmitting}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Novo Contrato</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
            <TabsTrigger value="items">Itens do Contrato</TabsTrigger>
            <TabsTrigger value="supplier">Fornecedor</TabsTrigger>
            <TabsTrigger value="review">Revisão</TabsTrigger>
          </TabsList>

          {/* Aba de Informações Básicas */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dados do Contrato</CardTitle>
                <CardDescription>Informações básicas sobre o contrato</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="number">
                      Número do Contrato <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex">
                      <div className="flex items-center justify-center bg-muted px-3 rounded-l-md border border-r-0 border-input">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Input
                        id="number"
                        name="number"
                        className={`rounded-l-none ${errors.number ? "border-destructive" : ""}`}
                        placeholder="CT-2024-001"
                        value={formData.number}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    {errors.number && (
                      <p className="text-sm text-destructive flex items-center mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.number}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="vencido">Vencido</SelectItem>
                        <SelectItem value="expirado">Expirado</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startDate">
                      Data de Início <span className="text-destructive">*</span>
                    </Label>
                    <DatePicker
                      date={formData.startDate}
                      onDateChange={(date) => handleDateChange("startDate", date)}
                    />
                    {errors.startDate && (
                      <p className="text-sm text-destructive flex items-center mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.startDate}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expirationDate">
                      Data de Vencimento <span className="text-destructive">*</span>
                    </Label>
                    <DatePicker
                      date={formData.expirationDate}
                      onDateChange={(date) => handleDateChange("expirationDate", date)}
                    />
                    {errors.expirationDate && (
                      <p className="text-sm text-destructive flex items-center mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.expirationDate}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">
                      Empresa/Fornecedor <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex">
                      <div className="flex items-center justify-center bg-muted px-3 rounded-l-md border border-r-0 border-input">
                        <Building className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Input
                        id="company"
                        name="company"
                        className={`rounded-l-none ${errors.company ? "border-destructive" : ""}`}
                        placeholder="Nome da empresa"
                        value={formData.company}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    {errors.company && (
                      <p className="text-sm text-destructive flex items-center mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.company}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="cnpj">
                        CNPJ/CPF <span className="text-destructive">*</span>
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-5 w-5">
                              <HelpCircle className="h-3 w-3" />
                              <span className="sr-only">Ajuda sobre CNPJ/CPF</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>CNPJ: XX.XXX.XXX/XXXX-XX (14 dígitos)</p>
                            <p>CPF: XXX.XXX.XXX-XX (11 dígitos)</p>
                            <p>O sistema validará automaticamente</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="relative">
                      <Input
                        id="cnpj"
                        name="cnpj"
                        className={`pr-10 ${errors.cnpj ? "border-destructive" : isCnpjValid ? "border-green-500" : ""}`}
                        placeholder="Digite CNPJ ou CPF"
                        value={formData.cnpj}
                        onChange={handleInputChange}
                        required
                        maxLength={18}
                      />
                      {isCnpjValid === true && (
                        <CheckCircle2 className="h-4 w-4 text-green-500 absolute right-3 top-1/2 transform -translate-y-1/2" />
                      )}
                      {isCnpjValid === false && (
                        <AlertCircle className="h-4 w-4 text-destructive absolute right-3 top-1/2 transform -translate-y-1/2" />
                      )}
                    </div>
                    {errors.cnpj && (
                      <p className="text-sm text-destructive flex items-center mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.cnpj}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="value">
                      Valor Total <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex">
                      <div className="flex items-center justify-center bg-muted px-3 rounded-l-md border border-r-0 border-input">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Input
                        id="value"
                        name="value"
                        type="text"
                        className={`rounded-l-none ${errors.value ? "border-destructive" : ""}`}
                        placeholder="R$ 0,00"
                        value={formData.value}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    {errors.value && (
                      <p className="text-sm text-destructive flex items-center mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.value}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="costBase">
                      Base de Custo <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="costBase"
                      name="costBase"
                      className={errors.costBase ? "border-destructive" : ""}
                      placeholder="Centro de custo"
                      value={formData.costBase}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.costBase && (
                      <p className="text-sm text-destructive flex items-center mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.costBase}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    Objeto do Contrato <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    className={errors.description ? "border-destructive" : ""}
                    placeholder="Descreva o objeto do contrato"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    required
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive flex items-center mt-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba de Itens */}
          <TabsContent value="items" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Itens do Contrato</CardTitle>
                <CardDescription>Adicione os itens e serviços incluídos no contrato</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="p-4 border rounded-lg space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Item {index + 1}</h4>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor={`item-${item.id}-name`}>
                          Nome do Item <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`item-${item.id}-name`}
                          placeholder="Nome do produto/serviço"
                          value={item.name}
                          onChange={(e) => handleItemChange(item.id, "name", e.target.value)}
                          className={errors[`item_${index}_name`] ? "border-destructive" : ""}
                        />
                        {errors[`item_${index}_name`] && (
                          <p className="text-sm text-destructive flex items-center mt-1">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {errors[`item_${index}_name`]}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor={`item-${item.id}-description`}>Descrição</Label>
                        <Textarea
                          id={`item-${item.id}-description`}
                          placeholder="Descrição detalhada"
                          value={item.description}
                          onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                          rows={2}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`item-${item.id}-quantity`}>Quantidade</Label>
                        <Input
                          id={`item-${item.id}-quantity`}
                          type="number"
                          placeholder="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, "quantity", e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`item-${item.id}-unitPrice`}>Valor Unitário</Label>
                        <Input
                          id={`item-${item.id}-unitPrice`}
                          type="number"
                          placeholder="0.00"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(item.id, "unitPrice", e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label>Valor Total</Label>
                        <div className="p-3 bg-muted rounded-md font-medium">
                          R$ {Number.parseFloat(item.totalPrice).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <Button type="button" variant="outline" onClick={addItem} className="w-full bg-transparent">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Item
                </Button>

                <Separator />

                <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                  <span className="font-medium">Valor Total do Contrato:</span>
                  <span className="text-xl font-bold">
                    R$ {Number.parseFloat(calculateTotalValue()).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba de Fornecedor */}
          <TabsContent value="supplier" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Fornecedor</CardTitle>
                <CardDescription>Configure se deseja cadastrar um novo fornecedor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3 rounded-lg border p-4 bg-muted/50">
                  <Checkbox
                    id="create-supplier"
                    checked={createSupplier}
                    onCheckedChange={(checked) => setCreateSupplier(checked === true)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor="create-supplier"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      <Building2 className="h-4 w-4 inline mr-2" />
                      Cadastrar fornecedor automaticamente
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Ao marcar esta opção, um novo fornecedor será criado com os dados do contrato. Os campos de
                      empresa e CNPJ já informados serão utilizados.
                    </p>
                  </div>
                </div>

                {createSupplier && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="category">
                          Categoria <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => handleSelectChange("category", value)}
                        >
                          <SelectTrigger id="category" className={errors.category ? "border-destructive" : ""}>
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Saúde">Saúde</SelectItem>
                            <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                            <SelectItem value="Construção">Construção</SelectItem>
                            <SelectItem value="Alimentação">Alimentação</SelectItem>
                            <SelectItem value="Serviços">Serviços</SelectItem>
                            <SelectItem value="Educação">Educação</SelectItem>
                            <SelectItem value="Transporte">Transporte</SelectItem>
                            <SelectItem value="Locações">Locações</SelectItem>
                            <SelectItem value="Material de Consumo">Material de Consumo</SelectItem>
                            <SelectItem value="Outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.category && (
                          <p className="text-sm text-destructive flex items-center mt-1">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {errors.category}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contactName">Responsável</Label>
                        <div className="flex">
                          <div className="flex items-center justify-center bg-muted px-3 rounded-l-md border border-r-0 border-input">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <Input
                            id="contactName"
                            name="contactName"
                            className="rounded-l-none"
                            placeholder="Nome do responsável"
                            value={formData.contactName}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contactPhone">Telefone</Label>
                        <div className="flex">
                          <div className="flex items-center justify-center bg-muted px-3 rounded-l-md border border-r-0 border-input">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <Input
                            id="contactPhone"
                            name="contactPhone"
                            className="rounded-l-none"
                            placeholder="(00) 00000-0000"
                            value={formData.contactPhone}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="flex">
                          <div className="flex items-center justify-center bg-muted px-3 rounded-l-md border border-r-0 border-input">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            className={`rounded-l-none ${errors.email ? "border-destructive" : ""}`}
                            placeholder="email@empresa.com"
                            value={formData.email}
                            onChange={handleInputChange}
                          />
                        </div>
                        {errors.email && (
                          <p className="text-sm text-destructive flex items-center mt-1">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {errors.email}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="website">Website</Label>
                        <div className="flex">
                          <div className="flex items-center justify-center bg-muted px-3 rounded-l-md border border-r-0 border-input">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <Input
                            id="website"
                            name="website"
                            className="rounded-l-none"
                            placeholder="www.empresa.com"
                            value={formData.website}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <h4 className="font-medium">Endereço</h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address">
                          Logradouro <span className="text-destructive">*</span>
                        </Label>
                        <div className="flex">
                          <div className="flex items-center justify-center bg-muted px-3 rounded-l-md border border-r-0 border-input">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <Input
                            id="address"
                            name="address"
                            className={`rounded-l-none ${errors.address ? "border-destructive" : ""}`}
                            placeholder="Rua, Avenida, etc."
                            value={formData.address}
                            onChange={handleInputChange}
                          />
                        </div>
                        {errors.address && (
                          <p className="text-sm text-destructive flex items-center mt-1">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {errors.address}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city">
                          Cidade <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="city"
                          name="city"
                          className={errors.city ? "border-destructive" : ""}
                          placeholder="Cidade"
                          value={formData.city}
                          onChange={handleInputChange}
                        />
                        {errors.city && (
                          <p className="text-sm text-destructive flex items-center mt-1">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {errors.city}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="state">
                          Estado <span className="text-destructive">*</span>
                        </Label>
                        <Select value={formData.state} onValueChange={(value) => handleSelectChange("state", value)}>
                          <SelectTrigger id="state" className={errors.state ? "border-destructive" : ""}>
                            <SelectValue placeholder="Selecione o estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AC">Acre</SelectItem>
                            <SelectItem value="AL">Alagoas</SelectItem>
                            <SelectItem value="AP">Amapá</SelectItem>
                            <SelectItem value="AM">Amazonas</SelectItem>
                            <SelectItem value="BA">Bahia</SelectItem>
                            <SelectItem value="CE">Ceará</SelectItem>
                            <SelectItem value="DF">Distrito Federal</SelectItem>
                            <SelectItem value="ES">Espírito Santo</SelectItem>
                            <SelectItem value="GO">Goiás</SelectItem>
                            <SelectItem value="MA">Maranhão</SelectItem>
                            <SelectItem value="MT">Mato Grosso</SelectItem>
                            <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                            <SelectItem value="MG">Minas Gerais</SelectItem>
                            <SelectItem value="PA">Pará</SelectItem>
                            <SelectItem value="PB">Paraíba</SelectItem>
                            <SelectItem value="PR">Paraná</SelectItem>
                            <SelectItem value="PE">Pernambuco</SelectItem>
                            <SelectItem value="PI">Piauí</SelectItem>
                            <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                            <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                            <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                            <SelectItem value="RO">Rondônia</SelectItem>
                            <SelectItem value="RR">Roraima</SelectItem>
                            <SelectItem value="SC">Santa Catarina</SelectItem>
                            <SelectItem value="SP">São Paulo</SelectItem>
                            <SelectItem value="SE">Sergipe</SelectItem>
                            <SelectItem value="TO">Tocantins</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.state && (
                          <p className="text-sm text-destructive flex items-center mt-1">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {errors.state}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="zipCode">CEP</Label>
                        <Input
                          id="zipCode"
                          name="zipCode"
                          placeholder="00000-000"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba de Revisão */}
          <TabsContent value="review" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Revisão Final</CardTitle>
                <CardDescription>Revise todas as informações antes de cadastrar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Dados do Contrato</h3>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-muted-foreground">Número:</dt>
                    <dd className="font-medium">{formData.number || "-"}</dd>
                    <dt className="text-muted-foreground">Empresa:</dt>
                    <dd className="font-medium">{formData.company || "-"}</dd>
                    <dt className="text-muted-foreground">CNPJ:</dt>
                    <dd className="font-medium">{formData.cnpj || "-"}</dd>
                    <dt className="text-muted-foreground">Valor:</dt>
                    <dd className="font-medium">{formData.value || "-"}</dd>
                    <dt className="text-muted-foreground">Período:</dt>
                    <dd className="font-medium">
                      {formData.startDate && formData.expirationDate
                        ? `${formData.startDate.toLocaleDateString("pt-BR")} até ${formData.expirationDate.toLocaleDateString("pt-BR")}`
                        : "-"}
                    </dd>
                    <dt className="text-muted-foreground">Base de Custo:</dt>
                    <dd className="font-medium">{formData.costBase || "-"}</dd>
                  </dl>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-2">Itens ({items.length})</h3>
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div key={item.id} className="p-3 bg-muted rounded-lg text-sm">
                        <div className="font-medium">{item.name || `Item ${index + 1}`}</div>
                        <div className="text-muted-foreground">
                          Qtd: {item.quantity} × R$ {Number.parseFloat(item.unitPrice).toFixed(2)} = R${" "}
                          {Number.parseFloat(item.totalPrice).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {createSupplier && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-medium mb-2 flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Fornecedor será cadastrado
                      </h3>
                      <dl className="grid grid-cols-2 gap-2 text-sm">
                        <dt className="text-muted-foreground">Nome:</dt>
                        <dd className="font-medium">{formData.company || "-"}</dd>
                        <dt className="text-muted-foreground">CNPJ:</dt>
                        <dd className="font-medium">{formData.cnpj || "-"}</dd>
                        <dt className="text-muted-foreground">Categoria:</dt>
                        <dd className="font-medium">{formData.category || "-"}</dd>
                        <dt className="text-muted-foreground">Cidade/UF:</dt>
                        <dd className="font-medium">
                          {formData.city && formData.state ? `${formData.city}/${formData.state}` : "-"}
                        </dd>
                      </dl>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <div className="flex justify-between border rounded-lg p-6">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isNavigating || isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || isNavigating}>
              {isSubmitting ? (
                <>
                  <LoadingSpinner className="mr-2" />
                  Cadastrando...
                </>
              ) : (
                "Cadastrar Contrato"
              )}
            </Button>
          </div>
        </Tabs>
      </form>
    </div>
  )
}
