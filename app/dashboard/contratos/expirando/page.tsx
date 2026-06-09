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
import { useContracts } from "@/lib/contracts-provider"
import { useAuth } from "@/lib/auth-provider"
import { formatCurrency, calculateDaysRemaining } from "@/lib/utils"
import { FileText, MoreHorizontal, ArrowLeft, AlertTriangle } from "lucide-react"

export default function ContratosExpirandoPage() {
  const { contracts } = useContracts()
  const { user } = useAuth()
  const router = useRouter()
  const [expiringContracts, setExpiringContracts] = useState<typeof contracts>([])

  const isAdmin = user?.role === "admin"
  const isCompras = user?.role === "compras" || isAdmin

  useEffect(() => {
    // Filtrar contratos que expiram nos próximos 60 dias
    const now = new Date()
    const in60Days = new Date()
    in60Days.setDate(now.getDate() + 60)

    const filtered = contracts.filter((c) => new Date(c.expirationDate) > now && new Date(c.expirationDate) < in60Days)

    // Ordenar por data de expiração (mais próximos primeiro)
    filtered.sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime())

    setExpiringContracts(filtered)
  }, [contracts])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Contratos a Expirar</h1>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center space-y-0">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Contratos que expiram nos próximos 60 dias
            </CardTitle>
            <CardDescription>
              Lista de contratos que precisam de atenção por estarem próximos da data de vencimento.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Base de Custo</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Utilizado</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Dias Restantes</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiringContracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      Nenhum contrato próximo do vencimento.
                    </TableCell>
                  </TableRow>
                ) : (
                  expiringContracts.map((contract) => {
                    const daysRemaining = calculateDaysRemaining(contract.expirationDate)
                    const isVerySoon = daysRemaining <= 30

                    return (
                      <TableRow key={contract.id}>
                        <TableCell className="font-medium">{contract.number}</TableCell>
                        <TableCell>{contract.company}</TableCell>
                        <TableCell>{contract.costBase}</TableCell>
                        <TableCell>{formatCurrency(contract.value)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-full max-w-[100px] h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  contract.usedPercentage >= 90
                                    ? "bg-red-500"
                                    : contract.usedPercentage >= 60
                                      ? "bg-amber-500"
                                      : "bg-green-500"
                                }`}
                                style={{ width: `${contract.usedPercentage}%` }}
                              />
                            </div>
                            <span className="text-xs">{contract.usedPercentage}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(contract.expirationDate).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>
                          <span className={isVerySoon ? "text-red-600 font-medium" : "text-amber-600 font-medium"}>
                            {daysRemaining} dias
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
                              <DropdownMenuItem onClick={() => router.push(`/dashboard/contratos/${contract.id}`)}>
                                <FileText className="mr-2 h-4 w-4" />
                                Visualizar detalhes
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {isCompras && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => router.push(`/dashboard/contratos/editar/${contract.id}`)}
                                  >
                                    Editar contrato
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => router.push(`/dashboard/pedidos/novo?contrato=${contract.id}`)}
                                    disabled={contract.status !== "ativo"}
                                  >
                                    Fazer pedido
                                  </DropdownMenuItem>
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
