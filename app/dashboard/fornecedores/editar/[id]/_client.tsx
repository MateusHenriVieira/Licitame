"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSuppliers } from "@/lib/suppliers-provider"
import { useContracts } from "@/lib/contracts-provider"
import { useToast } from "@/components/ui/use-toast"
import { formatDocument, validateDocumentWithDetails, formatCPF, validateCPF, isCPFFormatValid, formatCNPJ, isCNPJFormatValid, validateCNPJWithDetails } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { NavigationProgress } from "@/components/navigation-progress"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

import {
  ArrowLeft,
  Building,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Package,
  Plus,
  Trash2,
  FileText,
} from "lucide-react"

interface SupplierProduct {
  id: string
  name: string
  quantity: number
  unitPrice: number
}

export default function EditarFornecedorPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { getSupplierById, updateSupplier, suppliers, linkContractToSupplier, unlinkContractFromSupplier } =
    useSuppliers()
  const { contracts, updateContract } = useContracts()

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [cnpjValidationTimeout, setCnpjValidationTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isCnpjValid, setIsCnpjValid] = useState<boolean | null>(null)
  const [isCnpjDuplicate, setIsCnpjDuplicate] = useState(false)
  const [originalCnpj, setOriginalCnpj] = useState("")
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([])
  const [selectedContractIds, setSelectedContractIds] = useState<string[]>([])

  const [formData, setFormData] = useState({
    name: "",
    cnpj: "",
    category: "",
    active: true,
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    email: "",
    website: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    rating: "3",
    notes: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (params.id) {
      const supplier = getSupplierById(params.id as string)
      if (supplier) {
        const addressParts = supplier.address ? supplier.address.split(",") : [""]

        setFormData({
          name: supplier.name || "",
          cnpj: supplier.cnpj || "",
          category: supplier.category || "",
          active: supplier.active,
          address: addressParts[0] || "",
          city: supplier.city || "",
          state: supplier.state || "",
          zipCode: supplier.zipCode || "",
          phone: supplier.contactPhone || "",
          email: supplier.email || "",
          website: supplier.website || "",
          contactName: supplier.contactName || "",
          contactPhone: supplier.contactPhone || "",
          contactEmail: supplier.email || "",
          rating: supplier.rating?.toString() || "3",
          notes: "",
        })

        setOriginalCnpj(supplier.cnpj || "")
        setIsCnpjValid(true)
        setSupplierProducts(supplier.products || [])
        setSelectedContractIds(supplier.contractIds || [])
      } else {
        setNotFound(true)
        toast({
          title: "Fornecedor não encontrado",
          description: "O fornecedor solicitado não existe ou foi removido.",
          variant: "destructive",
        })
      }
    }
    setIsLoading(false)
  }, [params.id, getSupplierById, toast])

  useEffect(() => {
    if (formData.cnpj && formData.cnpj !== originalCnpj && (isCNPJFormatValid(formData.cnpj) || isCPFFormatValid(formData.cnpj))) {
      const isDuplicate = suppliers.some((supplier) => supplier.cnpj === formData.cnpj && supplier.id !== params.id)
      setIsCnpjDuplicate(isDuplicate)

      if (isDuplicate) {
        setErrors((prev) => ({
          ...prev,
          cnpj: "CNPJ/CPF já cadastrado para outro fornecedor",
        }))
      } else if (errors.cnpj === "CNPJ/CPF já cadastrado para outro fornecedor") {
        const newErrors = { ...errors }
        delete newErrors.cnpj
        setErrors(newErrors)
      }
    }
  }, [formData.cnpj, suppliers, originalCnpj, params.id, errors])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    if (name === "cnpj") {
      const formattedDocument = formatDocument(value)
      setFormData((prev) => ({ ...prev, [name]: formattedDocument }))

      if (formattedDocument === originalCnpj) {
        setIsCnpjValid(true)
        const newErrors = { ...errors }
        delete newErrors.cnpj
        setErrors(newErrors)
        return
      }

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

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleAddProduct = () => {
    const newProduct: SupplierProduct = {
      id: `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: "",
      quantity: 0,
      unitPrice: 0,
    }
    setSupplierProducts((prev) => [...prev, newProduct])
  }

  const handleRemoveProduct = (id: string) => {
    setSupplierProducts((prev) => prev.filter((p) => p.id !== id))
  }

  const handleProductChange = (id: string, field: keyof SupplierProduct, value: string | number) => {
    setSupplierProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return { ...p, [field]: value }
        }
        return p
      }),
    )
  }

  const handleContractToggle = (contractId: string) => {
    setSelectedContractIds((prev) => {
      if (prev.includes(contractId)) {
        return prev.filter((id) => id !== contractId)
      } else {
        return [...prev, contractId]
      }
    })
  }

  const isCnpjFormatValid = (cnpj: string): boolean => {
    return isCNPJFormatValid(cnpj) || isCPFFormatValid(cnpj)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = "Nome é obrigatório"
    if (!formData.cnpj.trim()) newErrors.cnpj = "CNPJ/CPF é obrigatório"
    if (!formData.category) newErrors.category = "Categoria é obrigatória"

    if (formData.cnpj && formData.cnpj !== originalCnpj) {
      const validation = validateDocumentWithDetails(formData.cnpj)
      if (!validation.isValid) {
        newErrors.cnpj = validation.message || "CNPJ/CPF inválido"
      }
    }

    if (formData.cnpj && formData.cnpj !== originalCnpj && !newErrors.cnpj) {
      const isDuplicate = suppliers.some((supplier) => supplier.cnpj === formData.cnpj && supplier.id !== params.id)
      if (isDuplicate) {
        newErrors.cnpj = "CNPJ/CPF já cadastrado para outro fornecedor"
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Email inválido"
    }

    if (formData.contactEmail && !emailRegex.test(formData.contactEmail)) {
      newErrors.contactEmail = "Email de contato inválido"
    }

    const cepRegex = /^\d{5}-\d{3}$/
    if (formData.zipCode && !cepRegex.test(formData.zipCode)) {
      newErrors.zipCode = "CEP inválido. Use o formato: 00000-000"
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
      await new Promise((resolve) => setTimeout(resolve, 1000))

      await updateSupplier(params.id as string, {
        name: formData.name,
        cnpj: formData.cnpj,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        contactName: formData.contactName,
        contactPhone: formData.phone,
        email: formData.email,
        website: formData.website,
        category: formData.category,
        rating: Number.parseInt(formData.rating),
        active: formData.active,
        products: supplierProducts,
        contractIds: selectedContractIds,
        updatedAt: new Date().toISOString(),
      })

      for (const contractId of selectedContractIds) {
        const contract = contracts.find((c) => c.id === contractId)
        if (contract && contract.supplierId !== params.id) {
          await updateContract(contractId, { supplierId: params.id as string })
        }
      }

      const supplier = getSupplierById(params.id as string)
      if (supplier && supplier.contractIds) {
        const removedContractIds = supplier.contractIds.filter((id) => !selectedContractIds.includes(id))
        for (const contractId of removedContractIds) {
          const contract = contracts.find((c) => c.id === contractId)
          if (contract && contract.supplierId === params.id) {
            await updateContract(contractId, { supplierId: undefined })
          }
        }
      }

      toast({
        title: "Fornecedor atualizado com sucesso",
        description: `As informações de ${formData.name} foram atualizadas.`,
      })

      setIsNavigating(true)
      router.push(`/dashboard/fornecedores/${params.id}`)
    } catch (error) {
      console.error("Erro ao atualizar fornecedor:", error)
      toast({
        title: "Erro ao atualizar fornecedor",
        description: "Ocorreu um erro ao tentar atualizar o fornecedor. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsNavigating(true)
    router.push(`/dashboard/fornecedores/${params.id}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">Carregando dados do fornecedor...</p>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
          <h2 className="mt-2 text-xl font-semibold">Fornecedor não encontrado</h2>
          <p className="mt-1 text-muted-foreground">O fornecedor solicitado não existe ou foi removido.</p>
          <Button
            className="mt-4"
            onClick={() => {
              setIsNavigating(true)
              router.push("/dashboard/fornecedores")
            }}
          >
            Voltar para a lista
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {isNavigating && <NavigationProgress />}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleCancel} disabled={isNavigating || isSubmitting}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Editar Fornecedor</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
            <TabsTrigger value="address">Endereço</TabsTrigger>
            <TabsTrigger value="contact">Contatos</TabsTrigger>
            <TabsTrigger value="contracts">Contratos</TabsTrigger>
            <TabsTrigger value="products">Produtos</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dados do Fornecedor</CardTitle>
                <CardDescription>Informações básicas sobre o fornecedor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Nome/Razão Social <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex">
                      <div className="flex items-center justify-center bg-muted px-3 rounded-l-md border border-r-0 border-input">
                        <Building className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Input
                        id="name"
                        name="name"
                        className={`rounded-l-none ${errors.name ? "border-destructive" : ""}`}
                        placeholder="Nome da empresa"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    {errors.name && (
                      <p className="text-sm text-destructive flex items-center mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.name}
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
                      {isCnpjValid === true && !isCnpjDuplicate && (
                        <CheckCircle2 className="h-4 w-4 text-green-500 absolute right-3 top-1/2 transform -translate-y-1/2" />
                      )}
                      {(isCnpjValid === false || isCnpjDuplicate) && (
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
                    <Label htmlFor="category">
                      Categoria <span className="text-destructive">*</span>
                    </Label>
                    <Select value={formData.category} onValueChange={(value) => handleSelectChange("category", value)}>
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
                    <Label htmlFor="active">Status</Label>
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch
                        id="active"
                        checked={formData.active}
                        onCheckedChange={(checked) => handleSwitchChange("active", checked)}
                      />
                      <Label htmlFor="active" className="cursor-pointer">
                        {formData.active ? "Ativo" : "Inativo"}
                      </Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="address" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Endereço</CardTitle>
                <CardDescription>Informações de localização do fornecedor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Logradouro</Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder="Rua, Avenida, etc."
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder="Cidade"
                      value={formData.city}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Select value={formData.state} onValueChange={(value) => handleSelectChange("state", value)}>
                      <SelectTrigger id="state">
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
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="zipCode">CEP</Label>
                    <Input
                      id="zipCode"
                      name="zipCode"
                      className={errors.zipCode ? "border-destructive" : ""}
                      placeholder="00000-000"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                    />
                    {errors.zipCode && (
                      <p className="text-sm text-destructive flex items-center mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.zipCode}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações de Contato</CardTitle>
                <CardDescription>Dados para contato com o fornecedor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="(00) 0000-0000"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      className={errors.email ? "border-destructive" : ""}
                      placeholder="email@empresa.com"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive flex items-center mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      name="website"
                      placeholder="www.empresa.com"
                      value={formData.website}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactName">Nome do Contato</Label>
                    <Input
                      id="contactName"
                      name="contactName"
                      placeholder="Nome completo"
                      value={formData.contactName}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Telefone do Contato</Label>
                    <Input
                      id="contactPhone"
                      name="contactPhone"
                      placeholder="(00) 00000-0000"
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contracts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Contratos Vinculados
                </CardTitle>
                <CardDescription>
                  Selecione os contratos que este fornecedor está associado. Isso permitirá criar pedidos vinculados a
                  esses contratos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {contracts.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground mb-4">Nenhum contrato cadastrado no sistema</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsNavigating(true)
                        router.push("/dashboard/contratos/novo")
                      }}
                    >
                      Criar Novo Contrato
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-muted-foreground">
                        {selectedContractIds.length} de {contracts.length} contratos selecionados
                      </p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedContractIds(contracts.map((c) => c.id))}
                        >
                          Selecionar Todos
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => setSelectedContractIds([])}>
                          Limpar Seleção
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3">
                      {contracts.map((contract) => {
                        const isSelected = selectedContractIds.includes(contract.id)
                        const hasOtherSupplier = contract.supplierId && contract.supplierId !== params.id
                        const otherSupplier = hasOtherSupplier
                          ? suppliers.find((s) => s.id === contract.supplierId)
                          : null

                        return (
                          <div
                            key={contract.id}
                            className={`flex items-start space-x-3 rounded-lg border p-4 transition-colors ${
                              isSelected ? "bg-primary/5 border-primary" : "hover:bg-muted/50"
                            } ${hasOtherSupplier ? "opacity-60" : ""}`}
                          >
                            <Checkbox
                              id={`contract-${contract.id}`}
                              checked={isSelected}
                              onCheckedChange={() => handleContractToggle(contract.id)}
                              disabled={hasOtherSupplier}
                            />
                            <div className="flex-1 space-y-1">
                              <Label
                                htmlFor={`contract-${contract.id}`}
                                className={`text-sm font-medium leading-none cursor-pointer ${
                                  hasOtherSupplier ? "cursor-not-allowed" : ""
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {contract.number}
                                  <Badge variant={contract.status === "ativo" ? "default" : "secondary"}>
                                    {contract.status}
                                  </Badge>
                                  {hasOtherSupplier && (
                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                      Vinculado a {otherSupplier?.name}
                                    </Badge>
                                  )}
                                </div>
                              </Label>
                              <p className="text-sm text-muted-foreground">{contract.description}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                                <span>Empresa: {contract.company}</span>
                                <span>•</span>
                                <span>Base: {contract.costBase}</span>
                                <span>•</span>
                                <span>
                                  Vigência: {new Date(contract.startDate).toLocaleDateString("pt-BR")} até{" "}
                                  {new Date(contract.expirationDate).toLocaleDateString("pt-BR")}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mt-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">Sobre a vinculação de contratos</p>
                          <p className="text-sm text-blue-700 mt-1">
                            Ao vincular contratos a este fornecedor, você poderá criar pedidos diretamente associados a
                            esses contratos. Contratos já vinculados a outros fornecedores não podem ser selecionados.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Produtos do Fornecedor
                  </div>
                  <Button type="button" onClick={handleAddProduct} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Produto
                  </Button>
                </CardTitle>
                <CardDescription>
                  Liste os produtos que este fornecedor pode fornecer com suas quantidades e preços
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {supplierProducts.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground mb-4">Nenhum produto adicionado ainda</p>
                    <Button type="button" onClick={handleAddProduct} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Primeiro Produto
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {supplierProducts.map((product, index) => (
                      <div key={product.id} className="p-4 border rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Produto {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          <div className="space-y-2 md:col-span-3">
                            <Label htmlFor={`product-name-${product.id}`}>Nome do Produto</Label>
                            <Input
                              id={`product-name-${product.id}`}
                              placeholder="Ex: Notebook Dell Inspiron 15"
                              value={product.name}
                              onChange={(e) => handleProductChange(product.id, "name", e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`product-quantity-${product.id}`}>Quantidade</Label>
                            <Input
                              id={`product-quantity-${product.id}`}
                              type="number"
                              min="0"
                              step="1"
                              placeholder="0"
                              value={product.quantity || ""}
                              onChange={(e) =>
                                handleProductChange(product.id, "quantity", Number.parseInt(e.target.value) || 0)
                              }
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor={`product-price-${product.id}`}>Valor Unitário (R$)</Label>
                            <Input
                              id={`product-price-${product.id}`}
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0,00"
                              value={product.unitPrice || ""}
                              onChange={(e) =>
                                handleProductChange(product.id, "unitPrice", Number.parseFloat(e.target.value) || 0)
                              }
                            />
                          </div>
                        </div>

                        {product.name && product.quantity > 0 && product.unitPrice > 0 && (
                          <div className="pt-2 border-t">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Valor Total:</span>
                              <span className="text-lg font-semibold">
                                R$ {(product.quantity * product.unitPrice).toFixed(2).replace(".", ",")}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {supplierProducts.length > 0 && (
                      <div className="pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Total Geral:</span>
                          <span className="text-xl font-bold text-primary">
                            R${" "}
                            {supplierProducts
                              .reduce((acc, p) => acc + p.quantity * p.unitPrice, 0)
                              .toFixed(2)
                              .replace(".", ",")}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {supplierProducts.length} produto(s) cadastrado(s)
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mt-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Dica sobre produtos</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Cadastre todos os produtos que este fornecedor pode fornecer. Isso facilitará a criação de
                        pedidos e contratos futuros.
                      </p>
                    </div>
                  </div>
                </div>
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
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </div>
        </Tabs>
      </form>
    </div>
  )
}
