"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSuppliers } from "@/lib/suppliers-provider"
import { useContracts } from "@/lib/contracts-provider" // Importação corrigida
import { useToast } from "@/components/ui/use-toast"
import { formatDocument, validateDocumentWithDetails, formatCPF, validateCPF, isCPFFormatValid, formatCNPJ, isCNPJFormatValid } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { FileUpload } from "@/components/ui/file-upload"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { NavigationProgress } from "@/components/navigation-progress"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

import {
  ArrowLeft,
  Building,
  Mail,
  Phone,
  MapPin,
  Globe,
  User,
  Briefcase,
  CreditCard,
  Star,
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

export default function NovoFornecedorPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { addSupplier, suppliers } = useSuppliers()
  const { contracts, updateContract } = useContracts()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [cnpjValidationTimeout, setCnpjValidationTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isCnpjValid, setIsCnpjValid] = useState<boolean | null>(null)
  const [isCnpjDuplicate, setIsCnpjDuplicate] = useState(false)
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([])
  const [selectedContractIds, setSelectedContractIds] = useState<string[]>([])

  const [formData, setFormData] = useState({
    // Informações básicas
    name: "",
    cnpj: "",
    category: "",
    active: true,

    // Endereço
    address: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",

    // Contato
    phone: "",
    email: "",
    website: "",

    // Contato principal
    contactName: "",
    contactPosition: "",
    contactPhone: "",
    contactEmail: "",

    // Informações bancárias
    bankName: "",
    bankBranch: "",
    bankAccount: "",
    bankPixKey: "",

    // Informações adicionais
    taxRegime: "",
    registrationNumber: "",
    rating: "3",
    notes: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [documents, setDocuments] = useState<File[]>([])

  // Verifica se o CNPJ/CPF já existe na base
  useEffect(() => {
    if (formData.cnpj && (isCNPJFormatValid(formData.cnpj) || isCPFFormatValid(formData.cnpj))) {
      const isDuplicate = suppliers.some((supplier) => supplier.cnpj === formData.cnpj)
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
  }, [formData.cnpj, suppliers])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    // Formatação especial para CNPJ/CPF
    if (name === "cnpj") {
      const formattedDocument = formatDocument(value)
      setFormData((prev) => ({ ...prev, [name]: formattedDocument }))

      // Limpar validação anterior
      setIsCnpjValid(null)

      // Cancelar timeout anterior se existir
      if (cnpjValidationTimeout) {
        clearTimeout(cnpjValidationTimeout)
      }

      // Configurar novo timeout para validação
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

    // Limpar erro do campo quando o usuário digitar
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

    // Limpar erro do campo quando o usuário selecionar
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

  const handleDocumentUpload = (file: File | File[]) => {
    if (Array.isArray(file)) {
      setDocuments((prev) => [...prev, ...file])
    } else {
      setDocuments((prev) => [...prev, file])
    }
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

    // Validar campos obrigatórios
    if (!formData.name.trim()) newErrors.name = "Nome é obrigatório"
    if (!formData.cnpj.trim()) newErrors.cnpj = "CNPJ/CPF é obrigatório"
    if (!formData.category) newErrors.category = "Categoria é obrigatória"

    // Validar CNPJ/CPF
    if (formData.cnpj) {
      const validation = validateDocumentWithDetails(formData.cnpj)
      if (!validation.isValid) {
        newErrors.cnpj = validation.message || "CNPJ/CPF inválido"
      }
    }

    // Verificar duplicidade de CNPJ/CPF
    if (formData.cnpj && !newErrors.cnpj) {
      const isDuplicate = suppliers.some((supplier) => supplier.cnpj === formData.cnpj)
      if (isDuplicate) {
        newErrors.cnpj = "CNPJ/CPF já cadastrado para outro fornecedor"
      }
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Email inválido"
    }

    if (formData.contactEmail && !emailRegex.test(formData.contactEmail)) {
      newErrors.contactEmail = "Email de contato inválido"
    }

    // Validar CEP
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

      const success = await addSupplier({
        name: formData.name,
        cnpj: formData.cnpj,
        address: `${formData.address}, ${formData.number}${formData.complement ? `, ${formData.complement}` : ""}`,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        contactName: formData.contactName,
        contactPhone: formData.contactPhone,
        email: formData.email,
        website: formData.website,
        category: formData.category,
        rating: Number.parseInt(formData.rating),
        active: formData.active,
        products: supplierProducts,
        contractIds: selectedContractIds,
      })

      if (success) {
        const newSupplier = suppliers.find((s) => s.cnpj === formData.cnpj)

        if (newSupplier) {
          for (const contractId of selectedContractIds) {
            await updateContract(contractId, { supplierId: newSupplier.id })
          }
        }

        toast({
          title: "Fornecedor cadastrado com sucesso",
          description: `${formData.name} foi adicionado à sua lista de fornecedores.`,
        })

        setIsNavigating(true)
        router.push("/dashboard/fornecedores")
      }
    } catch (error) {
      console.error("Erro ao cadastrar fornecedor:", error)
      toast({
        title: "Erro ao cadastrar fornecedor",
        description: "Ocorreu um erro ao tentar cadastrar o fornecedor. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsNavigating(true)
    router.push("/dashboard/fornecedores")
  }

  return (
    <div className="space-y-6">
      {isNavigating && <NavigationProgress />}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleCancel} disabled={isNavigating || isSubmitting}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Novo Fornecedor</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
            <TabsTrigger value="address">Endereço</TabsTrigger>
            <TabsTrigger value="contact">Contatos</TabsTrigger>
            <TabsTrigger value="contracts">Contratos</TabsTrigger>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="financial">Informações Financeiras</TabsTrigger>
            <TabsTrigger value="additional">Informações Adicionais</TabsTrigger>
          </TabsList>

          {/* Aba de Informações Básicas */}
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

          {/* Aba de Endereço */}
          <TabsContent value="address" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Endereço</CardTitle>
                <CardDescription>Informações de localização do fornecedor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Logradouro</Label>
                  <div className="flex">
                    <div className="flex items-center justify-center bg-muted px-3 rounded-l-md border border-r-0 border-input">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input
                      id="address"
                      name="address"
                      className="rounded-l-none"
                      placeholder="Rua, Avenida, etc."
                      value={formData.address}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="number">Número</Label>
                    <Input
                      id="number"
                      name="number"
                      placeholder="123"
                      value={formData.number}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      name="complement"
                      placeholder="Sala, Andar, etc."
                      value={formData.complement}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input
                      id="neighborhood"
                      name="neighborhood"
                      placeholder="Bairro"
                      value={formData.neighborhood}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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

                  <div className="space-y-2">
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

          {/* Aba de Contatos */}
          <TabsContent value="contact" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações de Contato</CardTitle>
                <CardDescription>Dados para contato com o fornecedor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <div className="flex">
                      <div className="flex items-center justify-center bg-muted px-3 rounded-l-md border border-r-0 border-input">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Input
                        id="phone"
                        name="phone"
                        className="rounded-l-none"
                        placeholder="(00) 0000-0000"
                        value={formData.phone}
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

                  <div className="space-y-2">
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

                <Separator className="my-4" />

                <h3 className="text-lg font-medium">Contato Principal</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Nome do Contato</Label>
                    <div className="flex">
                      <div className="flex items-center justify-center bg-muted px-3 rounded-l-md border border-r-0 border-input">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Input
                        id="contactName"
                        name="contactName"
                        className="rounded-l-none"
                        placeholder="Nome completo"
                        value={formData.contactName}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPosition">Cargo</Label>
                    <div className="flex">
                      <div className="flex items-center justify-center bg-muted px-3 rounded-l-md border border-r-0 border-input">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Input
                        id="contactPosition"
                        name="contactPosition"
                        className="rounded-l-none"
                        placeholder="Cargo ou função"
                        value={formData.contactPosition}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Telefone do Contato</Label>
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
                    <Label htmlFor="contactEmail">Email do Contato</Label>
                    <div className="flex">
                      <div className="flex items-center justify-center bg-muted px-3 rounded-l-md border border-r-0 border-input">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Input
                        id="contactEmail"
                        name="contactEmail"
                        type="email"
                        className={`rounded-l-none ${errors.contactEmail ? "border-destructive" : ""}`}
                        placeholder="contato@empresa.com"
                        value={formData.contactEmail}
                        onChange={handleInputChange}
                      />
                    </div>
                    {errors.contactEmail && (
                      <p className="text-sm text-destructive flex items-center mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.contactEmail}
                      </p>
                    )}
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
                  Selecione os contratos que este fornecedor estará associado. Isso permitirá criar pedidos vinculados a
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
                        const hasSupplier = !!contract.supplierId
                        const supplier = hasSupplier ? suppliers.find((s) => s.id === contract.supplierId) : null

                        return (
                          <div
                            key={contract.id}
                            className={`flex items-start space-x-3 rounded-lg border p-4 transition-colors ${
                              isSelected ? "bg-primary/5 border-primary" : "hover:bg-muted/50"
                            } ${hasSupplier ? "opacity-60" : ""}`}
                          >
                            <Checkbox
                              id={`contract-${contract.id}`}
                              checked={isSelected}
                              onCheckedChange={() => handleContractToggle(contract.id)}
                              disabled={hasSupplier}
                            />
                            <div className="flex-1 space-y-1">
                              <Label
                                htmlFor={`contract-${contract.id}`}
                                className={`text-sm font-medium leading-none cursor-pointer ${
                                  hasSupplier ? "cursor-not-allowed" : ""
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {contract.number}
                                  <Badge variant={contract.status === "ativo" ? "default" : "secondary"}>
                                    {contract.status}
                                  </Badge>
                                  {hasSupplier && (
                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                      Vinculado a {supplier?.name}
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

          {/* Aba de Produtos */}
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

          {/* Aba de Informações Financeiras */}
          <TabsContent value="financial" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Financeiras</CardTitle>
                <CardDescription>Dados bancários e financeiros do fornecedor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Banco</Label>
                    <div className="flex">
                      <div className="flex items-center justify-center bg-muted px-3 rounded-l-md border border-r-0 border-input">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Input
                        id="bankName"
                        name="bankName"
                        className="rounded-l-none"
                        placeholder="Nome do banco"
                        value={formData.bankName}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bankBranch">Agência</Label>
                    <Input
                      id="bankBranch"
                      name="bankBranch"
                      placeholder="0000"
                      value={formData.bankBranch}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bankAccount">Conta</Label>
                    <Input
                      id="bankAccount"
                      name="bankAccount"
                      placeholder="00000-0"
                      value={formData.bankAccount}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bankPixKey">Chave PIX</Label>
                    <Input
                      id="bankPixKey"
                      name="bankPixKey"
                      placeholder="CNPJ, Email, Telefone ou Chave Aleatória"
                      value={formData.bankPixKey}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="taxRegime">Regime Tributário</Label>
                    <Select
                      value={formData.taxRegime}
                      onValueChange={(value) => handleSelectChange("taxRegime", value)}
                    >
                      <SelectTrigger id="taxRegime">
                        <SelectValue placeholder="Selecione o regime tributário" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simples">Simples Nacional</SelectItem>
                        <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                        <SelectItem value="lucro_real">Lucro Real</SelectItem>
                        <SelectItem value="mei">MEI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registrationNumber">Inscrição Estadual/Municipal</Label>
                    <Input
                      id="registrationNumber"
                      name="registrationNumber"
                      placeholder="Número de registro"
                      value={formData.registrationNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="documents">Documentos</Label>
                  <FileUpload
                    accept=".pdf,.doc,.docx,.jpg,.png"
                    maxSize={5}
                    multiple={true}
                    onUpload={handleDocumentUpload}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Anexe documentos como: Contrato Social, Certidões Negativas, etc.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba de Informações Adicionais */}
          <TabsContent value="additional" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Adicionais</CardTitle>
                <CardDescription>Dados complementares sobre o fornecedor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rating">Avaliação Inicial</Label>
                  <div className="flex items-center space-x-2">
                    <RadioGroup
                      value={formData.rating}
                      onValueChange={(value) => handleSelectChange("rating", value)}
                      className="flex space-x-2"
                    >
                      {[1, 2, 3, 4, 5].map((value) => (
                        <div key={value} className="flex flex-col items-center">
                          <RadioGroupItem value={value.toString()} id={`rating-${value}`} className="sr-only" />
                          <Label
                            htmlFor={`rating-${value}`}
                            className={`cursor-pointer rounded-full p-2 hover:bg-muted ${
                              Number.parseInt(formData.rating) >= value ? "text-primary" : "text-muted-foreground"
                            }`}
                          >
                            <Star className="h-5 w-5" />
                          </Label>
                          <span className="text-xs">{value}</span>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Informações adicionais sobre o fornecedor"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={5}
                  />
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
                  Cadastrando...
                </>
              ) : (
                "Cadastrar Fornecedor"
              )}
            </Button>
          </div>
        </Tabs>
      </form>
    </div>
  )
}
