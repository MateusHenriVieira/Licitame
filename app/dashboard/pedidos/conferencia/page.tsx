"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { FileUpload } from "@/components/ui/file-upload"
import { Check, X, AlertTriangle, FileSearch, FileText, RefreshCw } from "lucide-react"
import { useOrders } from "@/lib/orders-provider"
import { useContracts } from "@/lib/contracts-provider"

export default function ConferenciaPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { getOrderById, orders } = useOrders()
  const { getContractById } = useContracts()
  const [isProcessing, setIsProcessing] = useState(false)
  const [xmlProcessed, setXmlProcessed] = useState(false)
  const [pedidoId, setPedidoId] = useState("")
  const [notaFiscal, setNotaFiscal] = useState("")
  const [pedidoAtual, setPedidoAtual] = useState<any>(null)
  const [fornecedor, setFornecedor] = useState("")
  const [dataFornecedor, setDataFornecedor] = useState("")
  const [cnpjFornecedor, setCnpjFornecedor] = useState("")

  // Dados simulados para demonstração
  const [itensComparados, setItensComparados] = useState<any[]>([])

  const handleProcessarXML = (file: File | File[]) => {
    const xmlFile = Array.isArray(file) ? file[0] : file
    setIsProcessing(true)

    // Simulação de processamento de XML
    setTimeout(() => {
      // Dados simulados após processamento do XML
      setItensComparados([
        {
          id: 1,
          codigo: "PRD001",
          descricao: "Monitor LED 24 polegadas",
          qtdPedido: 10,
          qtdNota: 10,
          valorUnitPedido: 899.9,
          valorUnitNota: 899.9,
          status: "match",
        },
        {
          id: 2,
          codigo: "PRD002",
          descricao: "Teclado Mecânico RGB",
          qtdPedido: 15,
          qtdNota: 15,
          valorUnitPedido: 299.9,
          valorUnitNota: 299.9,
          status: "match",
        },
        {
          id: 3,
          codigo: "PRD003",
          descricao: "Mouse Wireless",
          qtdPedido: 20,
          qtdNota: 18,
          valorUnitPedido: 89.9,
          valorUnitNota: 89.9,
          status: "quantidade",
        },
        {
          id: 4,
          codigo: "PRD004",
          descricao: "Headset Gamer",
          qtdPedido: 8,
          qtdNota: 8,
          valorUnitPedido: 249.9,
          valorUnitNota: 259.9,
          status: "valor",
        },
        {
          id: 5,
          codigo: "PRD005",
          descricao: "Webcam HD",
          qtdPedido: 5,
          qtdNota: 5,
          valorUnitPedido: 199.9,
          valorUnitNota: 199.9,
          status: "match",
        },
        {
          id: 6,
          codigo: "PRD006",
          descricao: "Cabo HDMI 2.0",
          qtdPedido: 30,
          qtdNota: 0,
          valorUnitPedido: 29.9,
          valorUnitNota: 0,
          status: "ausente",
        },
        {
          id: 7,
          codigo: "PRD007",
          descricao: "Adaptador USB-C",
          qtdPedido: 0,
          qtdNota: 10,
          valorUnitPedido: 0,
          valorUnitNota: 59.9,
          status: "adicional",
        },
      ])

      setNotaFiscal("NF-e 123456789")
      setXmlProcessed(true)
      setIsProcessing(false)

      toast({
        title: "XML processado com sucesso",
        description: "Os itens da nota fiscal foram comparados com o pedido.",
      })
    }, 2000)
  }

  const handleBuscarPedido = () => {
    if (!pedidoId) {
      toast({
        title: "Erro",
        description: "Informe o número do pedido",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    // Buscar pedido pelo ID ou número
    const pedido = orders.find(p => p.id === pedidoId || p.number === pedidoId)
    
    setTimeout(() => {
      setIsProcessing(false)

      if (pedido) {
        setPedidoAtual(pedido)
        
        // Carregar informações do contrato para pegar dados do fornecedor
        const contrato = getContractById(pedido.contractId)
        if (contrato) {
          setFornecedor(contrato.company)
          setCnpjFornecedor(contrato.cnpj || "N/A")
          setDataFornecedor(contrato.startDate || "N/A")
        }

        toast({
          title: "Pedido encontrado",
          description: `Pedido #${pedido.number} carregado com sucesso com ${pedido.items.length} itens.`,
        })
      } else {
        toast({
          title: "Erro",
          description: "Pedido não encontrado",
          variant: "destructive",
        })
      }
    }, 1000)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "match":
        return (
          <Badge className="bg-green-500">
            <Check className="h-3 w-3 mr-1" /> Correto
          </Badge>
        )
      case "quantidade":
        return (
          <Badge className="bg-yellow-500">
            <AlertTriangle className="h-3 w-3 mr-1" /> Qtd. Divergente
          </Badge>
        )
      case "valor":
        return (
          <Badge className="bg-yellow-500">
            <AlertTriangle className="h-3 w-3 mr-1" /> Valor Divergente
          </Badge>
        )
      case "ausente":
        return (
          <Badge className="bg-red-500">
            <X className="h-3 w-3 mr-1" /> Não Enviado
          </Badge>
        )
      case "adicional":
        return (
          <Badge className="bg-blue-500">
            <AlertTriangle className="h-3 w-3 mr-1" /> Item Adicional
          </Badge>
        )
      default:
        return <Badge>Desconhecido</Badge>
    }
  }

  const calcularTotais = () => {
    // Se XML foi processado, usar itens comparados
    if (itensComparados.length > 0) {
      const total = {
        itens: itensComparados.length,
        corretos: itensComparados.filter((item) => item.status === "match").length,
        divergentes: itensComparados.filter((item) => item.status === "quantidade" || item.status === "valor").length,
        ausentes: itensComparados.filter((item) => item.status === "ausente").length,
        adicionais: itensComparados.filter((item) => item.status === "adicional").length,
        valorPedido: itensComparados.reduce((acc, item) => acc + item.qtdPedido * item.valorUnitPedido, 0),
        valorNota: itensComparados.reduce((acc, item) => acc + item.qtdNota * item.valorUnitNota, 0),
      }
      return total
    }
    
    // Caso contrário, usar dados do pedido atual
    const total = {
      itens: pedidoAtual?.items?.length || 0,
      corretos: 0,
      divergentes: 0,
      ausentes: 0,
      adicionais: 0,
      valorPedido: pedidoAtual?.totalValue || 0,
      valorNota: 0,
    }

    return total
  }

  const totais = calcularTotais()

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Conferência de Pedido x Nota Fiscal</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Voltar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Pedido</CardTitle>
            <CardDescription>Informe o número do pedido para conferência</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <div className="flex-1">
                <Label htmlFor="pedidoId" className="mb-2 block">
                  Número do Pedido
                </Label>
                <Input
                  id="pedidoId"
                  placeholder="Digite o número do pedido"
                  value={pedidoId}
                  onChange={(e) => setPedidoId(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleBuscarPedido} disabled={isProcessing}>
                  <FileSearch className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
              </div>
            </div>

            {pedidoAtual && (
              <div className="bg-muted p-3 rounded-md">
                <h3 className="font-medium mb-2">Informações do Pedido #{pedidoAtual.number}</h3>
                <div className="text-sm">
                  <div className="grid grid-cols-2 gap-1">
                    <div className="font-medium">Data:</div>
                    <div>{new Date(pedidoAtual.date).toLocaleDateString('pt-BR')}</div>

                    <div className="font-medium">Fornecedor:</div>
                    <div>{fornecedor || "N/A"}</div>

                    <div className="font-medium">CNPJ:</div>
                    <div>{cnpjFornecedor}</div>

                    <div className="font-medium">Valor Total:</div>
                    <div>R$ {pedidoAtual.totalValue?.toFixed(2) || "0.00"}</div>

                    <div className="font-medium">Status:</div>
                    <div className="capitalize">{pedidoAtual.status}</div>

                    <div className="font-medium">Solicitado Por:</div>
                    <div>{pedidoAtual.requestedBy}</div>

                    <div className="font-medium">Departamento:</div>
                    <div>{pedidoAtual.requestedByDepartment}</div>

                    <div className="font-medium">Quantidade de Itens:</div>
                    <div>{pedidoAtual.items?.length || 0}</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nota Fiscal</CardTitle>
            <CardDescription>Faça upload do arquivo XML da nota fiscal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block">Arquivo XML da NF-e</Label>
              <FileUpload
                accept=".xml"
                maxSize={5}
                onUpload={(file) => handleProcessarXML(file)}
                disabled={isProcessing}
              />
            </div>

            {notaFiscal && (
              <div className="bg-muted p-3 rounded-md">
                <h3 className="font-medium mb-2">Informações da Nota Fiscal</h3>
                <div className="text-sm">
                  <div className="grid grid-cols-2 gap-1">
                    <div className="font-medium">Número:</div>
                    <div>{notaFiscal}</div>

                    <div className="font-medium">Emissão:</div>
                    <div>{new Date().toLocaleDateString('pt-BR')}</div>

                    <div className="font-medium">Fornecedor:</div>
                    <div>{fornecedor || "N/A"}</div>

                    <div className="font-medium">Valor Total:</div>
                    <div>R$ {pedidoAtual?.totalValue?.toFixed(2) || "0.00"}</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {pedidoAtual && !xmlProcessed && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Itens do Pedido</CardTitle>
            <CardDescription>Produtos solicitados no pedido #{pedidoAtual.number}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-center">Quantidade</TableHead>
                    <TableHead className="text-right">Valor Unitário</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidoAtual.items && pedidoAtual.items.length > 0 ? (
                    pedidoAtual.items.map((item: any, index: number) => (
                      <TableRow key={item.id || index}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">R$ {item.unitPrice?.toFixed(2) || "0.00"}</TableCell>
                        <TableCell className="text-right">R$ {item.totalPrice?.toFixed(2) || "0.00"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Nenhum item encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <Separator className="my-4" />
            <div className="flex justify-end">
              <div>
                <div className="text-sm font-medium mb-1">Valor Total do Pedido</div>
                <div className="text-xl font-bold">R$ {pedidoAtual.totalValue?.toFixed(2) || "0.00"}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {xmlProcessed && (
        <>
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle>Resumo da Conferência</CardTitle>
              <CardDescription>Comparação entre os itens do pedido e da nota fiscal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div className="bg-muted p-3 rounded-md">
                  <div className="text-sm font-medium mb-1">Total de Itens</div>
                  <div className="text-2xl font-bold">{totais.itens}</div>
                </div>

                <div className="bg-green-100 p-3 rounded-md">
                  <div className="text-sm font-medium mb-1">Corretos</div>
                  <div className="text-2xl font-bold text-green-600">{totais.corretos}</div>
                </div>

                <div className="bg-yellow-100 p-3 rounded-md">
                  <div className="text-sm font-medium mb-1">Divergentes</div>
                  <div className="text-2xl font-bold text-yellow-600">{totais.divergentes}</div>
                </div>

                <div className="bg-red-100 p-3 rounded-md">
                  <div className="text-sm font-medium mb-1">Ausentes</div>
                  <div className="text-2xl font-bold text-red-600">{totais.ausentes}</div>
                </div>

                <div className="bg-blue-100 p-3 rounded-md">
                  <div className="text-sm font-medium mb-1">Adicionais</div>
                  <div className="text-2xl font-bold text-blue-600">{totais.adicionais}</div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium mb-1">Valor Total do Pedido</div>
                  <div className="text-xl font-bold">R$ {totais.valorPedido.toFixed(2)}</div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">Valor Total da Nota</div>
                  <div className="text-xl font-bold">R$ {totais.valorNota.toFixed(2)}</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-sm font-medium mb-1">Diferença de Valor</div>
                <div
                  className={`text-xl font-bold ${Math.abs(totais.valorNota - totais.valorPedido) > 0.01 ? "text-red-600" : "text-green-600"}`}
                >
                  R$ {Math.abs(totais.valorNota - totais.valorPedido).toFixed(2)}
                  {totais.valorNota > totais.valorPedido
                    ? " (maior)"
                    : totais.valorNota < totais.valorPedido
                      ? " (menor)"
                      : " (igual)"}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalhamento dos Itens</CardTitle>
              <CardDescription>Comparação detalhada entre os itens do pedido e da nota fiscal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-center">Qtd. Pedido</TableHead>
                      <TableHead className="text-center">Qtd. Nota</TableHead>
                      <TableHead className="text-right">Valor Unit. Pedido</TableHead>
                      <TableHead className="text-right">Valor Unit. Nota</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itensComparados.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.codigo}</TableCell>
                        <TableCell>{item.descricao}</TableCell>
                        <TableCell className="text-center">{item.qtdPedido}</TableCell>
                        <TableCell
                          className={`text-center ${item.qtdPedido !== item.qtdNota ? "text-red-600 font-medium" : ""}`}
                        >
                          {item.qtdNota}
                        </TableCell>
                        <TableCell className="text-right">R$ {item.valorUnitPedido.toFixed(2)}</TableCell>
                        <TableCell
                          className={`text-right ${item.valorUnitPedido !== item.valorUnitNota ? "text-red-600 font-medium" : ""}`}
                        >
                          R$ {item.valorUnitNota.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">{getStatusBadge(item.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-6 flex justify-end gap-4">
                <Button variant="outline" type="button" onClick={() => router.push(`/dashboard/pedidos/${pedidoId}`)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Ver Detalhes do Pedido
                </Button>
                <Button type="button">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar Conferência
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
