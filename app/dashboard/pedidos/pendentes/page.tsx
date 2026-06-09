"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useOrders } from "@/lib/orders-provider"
import { useAuth } from "@/lib/auth-provider"
import { formatCurrency } from "@/lib/utils"
import { FileText, MoreHorizontal, ArrowLeft, Clock, FileCheck } from "lucide-react"

export default function PedidosPendentesPage() {
  const { orders } = useOrders()
  const { user } = useAuth()
  const router = useRouter()
  const [pendingOrders, setPendingOrders] = useState<typeof orders>([])

  const isCompras = user?.role === "compras" || user?.role === "admin"

  useEffect(() => {
    // Filtrar pedidos pendentes
    const filtered = orders.filter((o) => o.status === "pendente")

    // Ordenar por data (mais recentes primeiro)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    setPendingOrders(filtered)
  }, [orders])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Pedidos Pendentes</h1>
        </div>
        {isCompras && <Button onClick={() => router.push("/dashboard/pedidos/novo")}>Novo Pedido</Button>}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center space-y-0">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Pedidos aguardando processamento
            </CardTitle>
            <CardDescription>Lista de pedidos que estão pendentes e precisam de atenção.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Dias Pendente</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      Nenhum pedido pendente.
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingOrders.map((order) => {
                    const orderDate = new Date(order.date)
                    const today = new Date()
                    const diffTime = Math.abs(today.getTime() - orderDate.getTime())
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.number}</TableCell>
                        <TableCell>{order.contractNumber}</TableCell>
                        <TableCell>{new Date(order.date).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>{order.requestedBy}</TableCell>
                        <TableCell>{order.requestedFor}</TableCell>
                        <TableCell>{formatCurrency(order.totalValue)}</TableCell>
                        <TableCell>
                          <span className={diffDays > 7 ? "text-red-600 font-medium" : "text-amber-600 font-medium"}>
                            {diffDays} {diffDays === 1 ? "dia" : "dias"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Abrir menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => router.push(`/dashboard/pedidos/${order.id}`)}>
                                <FileText className="mr-2 h-4 w-4" />
                                Visualizar detalhes
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {isCompras && (
                                <>
                                  {!order.deliveryNote && (
                                    <DropdownMenuItem
                                      onClick={() => router.push(`/dashboard/pedidos/${order.id}/nota-entrega`)}
                                    >
                                      <FileCheck className="mr-2 h-4 w-4" />
                                      Registrar nota de entrega
                                    </DropdownMenuItem>
                                  )}
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
