"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useOrders, type Order } from "@/lib/orders-provider"
import { useContracts } from "@/lib/contracts-provider"
import { useAuth } from "@/lib/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"
import { ArrowLeft, FileText, FileCheck, AlertTriangle, CheckCircle2, Printer } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"

type OrderStatus = "pendente" | "em separação" | "realizado" | "entregue" | "concluído" | "cancelado"

const STATUS_OPTIONS: { value: OrderStatus; label: string; color: "default" | "secondary" | "destructive" | "outline" }[] = [
  { value: "pendente", label: "Pendente", color: "secondary" },
  { value: "em separação", label: "Em Separação", color: "secondary" },
  { value: "realizado", label: "Realizado", color: "default" },
  { value: "entregue", label: "Entregue", color: "default" },
  { value: "concluído", label: "Concluído", color: "default" },
  { value: "cancelado", label: "Cancelado", color: "destructive" },
]

export default function PedidoDetalhesPage({ params }: { params: { id: string } }) {
  const { getOrderById, approveOrder, rejectOrder, updateOrder } = useOrders()
  const { getContractById } = useContracts()
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [order, setOrder] = useState<Order | null>(null)
  const [contractNumber, setContractNumber] = useState("")
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [showRejectionDialog, setShowRejectionDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [rejectionError, setRejectionError] = useState("")
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const isCompras = user?.role === "compras" || user?.role === "admin"

  useEffect(() => {
    const foundOrder = getOrderById(params.id)
    if (foundOrder) {
      setOrder(foundOrder)

      // Buscar informações do contrato
      const contract = getContractById(foundOrder.contractId)
      if (contract) {
        setContractNumber(contract.number)
      }
    } else {
      router.push("/dashboard/pedidos")
    }
  }, [params.id, getOrderById, getContractById, router])

  if (!order) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  const orderId = order.id

  const handleApproveOrder = () => {
    approveOrder(orderId)
    setShowApprovalDialog(false)

    // Notification is now handled inside the OrdersProvider
  }

  const handleRejectOrder = () => {
    if (!rejectionReason) {
      setRejectionError("É necessário informar um motivo para a rejeição")
      return
    }

    rejectOrder(orderId, rejectionReason)
    setShowRejectionDialog(false)
    setRejectionReason("")

    // Notification is now handled inside the OrdersProvider
  }

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order) return

    setIsUpdatingStatus(true)
    try {
      updateOrder(order.id, { status: newStatus })
      
      // Atualizar o estado local
      setOrder({ ...order, status: newStatus })

      toast({
        title: "Status atualizado",
        description: `O pedido foi marcado como ${STATUS_OPTIONS.find(s => s.value === newStatus)?.label || newStatus}.`,
      })
    } catch (error) {
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status do pedido.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handlePrint = () => {
    router.push(`/dashboard/pedidos/${order?.id}/imprimir`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.push("/dashboard/pedidos")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Detalhes do Pedido</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          {isCompras && order.status === "pendente" && !order.deliveryNote && (
            <Button onClick={() => router.push(`/dashboard/pedidos/${order.id}/nota-entrega`)}>
              <FileCheck className="mr-2 h-4 w-4" />
              Registrar Nota de Entrega
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informações do Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Número do Pedido</p>
                <p className="text-lg font-semibold">{order.number}</p>
              </div>
              <div>
                <Label htmlFor="status-select" className="text-sm font-medium text-muted-foreground">
                  Status
                </Label>
                <Select value={order.status} onValueChange={(value) => handleStatusChange(value as OrderStatus)} disabled={isUpdatingStatus}>
                  <SelectTrigger id="status-select" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data do Pedido</p>
                <p className="text-lg font-semibold">{new Date(order.date).toLocaleDateString("pt-BR")}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contrato</p>
                <p className="text-lg font-semibold">
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => router.push(`/dashboard/contratos/${order.contractId}`)}
                  >
                    {order.contractNumber}
                  </Button>
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Solicitado por</p>
                <p className="text-base">{order.requestedBy}</p>
                <p className="text-xs text-muted-foreground">{order.requestedByDepartment}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Destino</p>
                <p className="text-base">{order.requestedFor}</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
              <p className="text-xl font-bold mt-1">{formatCurrency(order.totalValue)}</p>
            </div>
          </CardContent>
        </Card>

        {order.deliveryNote && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Nota de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Número da Nota</p>
                  <p className="text-lg font-semibold">{order.deliveryNote.number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data da Entrega</p>
                  <p className="text-lg font-semibold">
                    {new Date(order.deliveryNote.date).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor Total da Nota</p>
                <p className="text-xl font-bold mt-1">{formatCurrency(order.deliveryNote.totalValue)}</p>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Status da Verificação</p>
                {order.deliveryNote.verified ? (
                  <div
                    className={`flex items-center gap-2 p-3 rounded-md ${
                      order.deliveryNote.matchesOrder ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                    }`}
                  >
                    {order.deliveryNote.matchesOrder ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                        <p className="text-sm">Nota de entrega verificada e aprovada.</p>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                        <p className="text-sm">Nota de entrega verificada com divergências.</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-800 rounded-md">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm">Nota de entrega pendente de verificação.</p>
                  </div>
                )}
              </div>

              {!order.deliveryNote.verified && isCompras && (
                <Button onClick={() => router.push(`/dashboard/pedidos/${order.id}/verificar-nota`)} className="w-full">
                  Verificar Nota de Entrega
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Itens do Pedido</CardTitle>
          <CardDescription>Lista de todos os itens incluídos neste pedido</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Valor Unitário</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.totalPrice)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-bold">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(order.totalValue)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {order.deliveryNote && (
        <Card>
          <CardHeader>
            <CardTitle>Comparação com Nota de Entrega</CardTitle>
            <CardDescription>Comparação entre os itens do pedido e os itens da nota de entrega</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qtd. Pedido</TableHead>
                    <TableHead className="text-right">Valor Unit. Pedido</TableHead>
                    <TableHead className="text-right">Qtd. Nota</TableHead>
                    <TableHead className="text-right">Valor Unit. Nota</TableHead>
                    <TableHead className="text-right">Diferença</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((orderItem) => {
                    const noteItem = order.deliveryNote?.items.find((item) => item.orderItemId === orderItem.id)
                    const quantityDiff = noteItem ? noteItem.quantity - orderItem.quantity : -orderItem.quantity
                    const priceDiff = noteItem
                      ? noteItem.unitPrice * noteItem.quantity - orderItem.unitPrice * orderItem.quantity
                      : -(orderItem.unitPrice * orderItem.quantity)

                    const hasDiscrepancy =
                      quantityDiff !== 0 || (noteItem && noteItem.unitPrice !== orderItem.unitPrice)

                    return (
                      <TableRow key={orderItem.id}>
                        <TableCell className="font-medium">{orderItem.name}</TableCell>
                        <TableCell className="text-right">{orderItem.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(orderItem.unitPrice)}</TableCell>
                        <TableCell className="text-right">{noteItem ? noteItem.quantity : "-"}</TableCell>
                        <TableCell className="text-right">
                          {noteItem ? formatCurrency(noteItem.unitPrice) : "-"}
                        </TableCell>
                        <TableCell
                          className={`text-right ${priceDiff !== 0 ? (priceDiff > 0 ? "text-red-600" : "text-amber-600") : ""}`}
                        >
                          {priceDiff !== 0 ? formatCurrency(priceDiff) : "-"}
                        </TableCell>
                        <TableCell>
                          {!noteItem ? (
                            <Badge variant="destructive">Não entregue</Badge>
                          ) : hasDiscrepancy ? (
                            <Badge variant="secondary">Divergente</Badge>
                          ) : (
                            <Badge variant="outline">Conforme</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  <TableRow>
                    <TableCell colSpan={5} className="text-right font-bold">
                      Diferença Total
                    </TableCell>
                    <TableCell
                      className={`text-right font-bold ${
                        order.deliveryNote.totalValue !== order.totalValue
                          ? order.deliveryNote.totalValue > order.totalValue
                            ? "text-red-600"
                            : "text-amber-600"
                          : ""
                      }`}
                    >
                      {order.deliveryNote.totalValue !== order.totalValue
                        ? formatCurrency(order.deliveryNote.totalValue - order.totalValue)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {order.deliveryNote.totalValue === order.totalValue ? (
                        <Badge variant="outline">Conforme</Badge>
                      ) : (
                        <Badge variant="secondary">Divergente</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
