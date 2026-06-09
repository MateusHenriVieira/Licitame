"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useCostBase } from "@/lib/cost-base-provider"
import { ArrowLeft } from "lucide-react"

export default function NovaCustoPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { addCostBase } = useCostBase()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    cnpj: "",
    inscricaoEstadual: "",
    inscricaoMunicipal: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    contactPhone: "",
    contactEmail: "",
    contactName: "",
    category: "",
    observacoes: "",
    taxaAdministrativa: "",
    taxaImpostos: "",
    margemLucro: "",
    custoLogistica: "",
    custoOperacional: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const success = await addCostBase({
        name: formData.name,
        company: formData.company,
        cnpj: formData.cnpj,
        inscricaoEstadual: formData.inscricaoEstadual,
        inscricaoMunicipal: formData.inscricaoMunicipal,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        contactName: formData.contactName,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        category: formData.category,
        observacoes: formData.observacoes,
        taxaAdministrativa: formData.taxaAdministrativa ? Number.parseFloat(formData.taxaAdministrativa) : undefined,
        taxaImpostos: formData.taxaImpostos ? Number.parseFloat(formData.taxaImpostos) : undefined,
        margemLucro: formData.margemLucro ? Number.parseFloat(formData.margemLucro) : undefined,
        custoLogistica: formData.custoLogistica ? Number.parseFloat(formData.custoLogistica) : undefined,
        custoOperacional: formData.custoOperacional ? Number.parseFloat(formData.custoOperacional) : undefined,
      })

      if (success) {
        toast({
          title: "Base de custo cadastrada",
          description: "A base de custo foi cadastrada com sucesso.",
        })
        router.push("/dashboard/base-custo")
      } else {
        toast({
          title: "Erro ao cadastrar",
          description: "Ocorreu um erro ao cadastrar a base de custo. Verifique os dados e tente novamente.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro ao cadastrar",
        description: "Ocorreu um erro inesperado ao cadastrar a base de custo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nova Base de Custo</h1>
          <p className="text-muted-foreground">Cadastre uma nova base de custo no sistema</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="informacoes" className="w-full">
          <TabsList className="grid grid-cols-2 w-full max-w-md mb-6">
            <TabsTrigger value="informacoes">Informações Básicas</TabsTrigger>
            <TabsTrigger value="financeiro">Dados Financeiros</TabsTrigger>
          </TabsList>

          <TabsContent value="informacoes">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>Preencha as informações básicas da base de custo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Base de Custo *</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Nome da base de custo"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Empresa *</Label>
                    <Input
                      id="company"
                      name="company"
                      placeholder="Nome da empresa"
                      value={formData.company}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ *</Label>
                    <Input
                      id="cnpj"
                      name="cnpj"
                      placeholder="00.000.000/0000-00"
                      value={formData.cnpj}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="inscricaoEstadual">Inscrição Estadual</Label>
                    <Input
                      id="inscricaoEstadual"
                      name="inscricaoEstadual"
                      placeholder="Inscrição Estadual"
                      value={formData.inscricaoEstadual}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="inscricaoMunicipal">Inscrição Municipal</Label>
                    <Input
                      id="inscricaoMunicipal"
                      name="inscricaoMunicipal"
                      placeholder="Inscrição Municipal"
                      value={formData.inscricaoMunicipal}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="address">Endereço *</Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder="Endereço completo"
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade *</Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder="Cidade"
                      value={formData.city}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">Estado *</Label>
                    <Select
                      onValueChange={(value) => handleSelectChange("state", value)}
                      value={formData.state}
                      required
                    >
                      <SelectTrigger id="state">
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AC">AC</SelectItem>
                        <SelectItem value="AL">AL</SelectItem>
                        <SelectItem value="AP">AP</SelectItem>
                        <SelectItem value="AM">AM</SelectItem>
                        <SelectItem value="BA">BA</SelectItem>
                        <SelectItem value="CE">CE</SelectItem>
                        <SelectItem value="DF">DF</SelectItem>
                        <SelectItem value="ES">ES</SelectItem>
                        <SelectItem value="GO">GO</SelectItem>
                        <SelectItem value="MA">MA</SelectItem>
                        <SelectItem value="MT">MT</SelectItem>
                        <SelectItem value="MS">MS</SelectItem>
                        <SelectItem value="MG">MG</SelectItem>
                        <SelectItem value="PA">PA</SelectItem>
                        <SelectItem value="PB">PB</SelectItem>
                        <SelectItem value="PR">PR</SelectItem>
                        <SelectItem value="PE">PE</SelectItem>
                        <SelectItem value="PI">PI</SelectItem>
                        <SelectItem value="RJ">RJ</SelectItem>
                        <SelectItem value="RN">RN</SelectItem>
                        <SelectItem value="RS">RS</SelectItem>
                        <SelectItem value="RO">RO</SelectItem>
                        <SelectItem value="RR">RR</SelectItem>
                        <SelectItem value="SC">SC</SelectItem>
                        <SelectItem value="SP">SP</SelectItem>
                        <SelectItem value="SE">SE</SelectItem>
                        <SelectItem value="TO">TO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode">CEP *</Label>
                    <Input
                      id="zipCode"
                      name="zipCode"
                      placeholder="00000-000"
                      value={formData.zipCode}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Pessoa de Contato *</Label>
                    <Input
                      id="contactName"
                      name="contactName"
                      placeholder="Nome do contato"
                      value={formData.contactName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">E-mail *</Label>
                    <Input
                      id="contactEmail"
                      name="contactEmail"
                      type="email"
                      placeholder="email@exemplo.com"
                      value={formData.contactEmail}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Telefone *</Label>
                    <Input
                      id="contactPhone"
                      name="contactPhone"
                      placeholder="(00) 00000-0000"
                      value={formData.contactPhone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select onValueChange={(value) => handleSelectChange("category", value)} value={formData.category}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="industrial">Industrial</SelectItem>
                      <SelectItem value="comercial">Comercial</SelectItem>
                      <SelectItem value="servicos">Serviços</SelectItem>
                      <SelectItem value="governamental">Governamental</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    name="observacoes"
                    placeholder="Observações adicionais"
                    value={formData.observacoes}
                    onChange={handleChange}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financeiro">
            <Card>
              <CardHeader>
                <CardTitle>Dados Financeiros</CardTitle>
                <CardDescription>Configure os parâmetros financeiros da base de custo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxaAdministrativa">Taxa Administrativa (%)</Label>
                    <Input
                      id="taxaAdministrativa"
                      name="taxaAdministrativa"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.taxaAdministrativa}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxaImpostos">Taxa de Impostos (%)</Label>
                    <Input
                      id="taxaImpostos"
                      name="taxaImpostos"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.taxaImpostos}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="margemLucro">Margem de Lucro (%)</Label>
                    <Input
                      id="margemLucro"
                      name="margemLucro"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.margemLucro}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="custoLogistica">Custo de Logística (%)</Label>
                    <Input
                      id="custoLogistica"
                      name="custoLogistica"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.custoLogistica}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="custoOperacional">Custo Operacional (%)</Label>
                    <Input
                      id="custoOperacional"
                      name="custoOperacional"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.custoOperacional}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <Separator />

                <div className="bg-muted p-4 rounded-md">
                  <h3 className="font-medium mb-3">Resumo de Custos</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Taxa Administrativa:</div>
                    <div className="text-right font-medium">{formData.taxaAdministrativa || "0.00"}%</div>

                    <div>Taxa de Impostos:</div>
                    <div className="text-right font-medium">{formData.taxaImpostos || "0.00"}%</div>

                    <div>Margem de Lucro:</div>
                    <div className="text-right font-medium">{formData.margemLucro || "0.00"}%</div>

                    <div>Custo de Logística:</div>
                    <div className="text-right font-medium">{formData.custoLogistica || "0.00"}%</div>

                    <div>Custo Operacional:</div>
                    <div className="text-right font-medium">{formData.custoOperacional || "0.00"}%</div>

                    <Separator className="col-span-2 my-2" />

                    <div className="font-semibold">Total:</div>
                    <div className="text-right font-semibold">
                      {(
                        Number.parseFloat(formData.taxaAdministrativa || "0") +
                        Number.parseFloat(formData.taxaImpostos || "0") +
                        Number.parseFloat(formData.margemLucro || "0") +
                        Number.parseFloat(formData.custoLogistica || "0") +
                        Number.parseFloat(formData.custoOperacional || "0")
                      ).toFixed(2)}
                      %
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar Base de Custo"}
          </Button>
        </div>
      </form>
    </div>
  )
}
