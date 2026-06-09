"use client"

import { useState, useEffect } from "react"
import { useOrders } from "@/lib/orders-provider"
import { useContracts } from "@/lib/contracts-provider"
import { useSuppliers } from "@/lib/suppliers-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { BarChart, LineChart, PieChart, DonutChart } from "@/components/charts"
import { Calendar, DollarSign, Package, Clock, AlertTriangle, Filter, Download } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { DataTable } from "@/components/data-table"
import { LoadingSpinner } from "@/components/loading-spinner"

// Tipos para as métricas
type PeriodMetrics = {
  totalOrders: number
  totalValue: number
  averageValue: number
  pendingOrders: number
  inProgressOrders: number
  completedOrders: number
  canceledOrders: number
  highPriorityOrders: number
  mediumPriorityOrders: number
  lowPriorityOrders: number
}

type SupplierMetrics = {
  supplierId: string
  supplierName: string
  totalOrders: number
  totalValue: number
}

type ContractMetrics = {
  contractId: string
  contractNumber: string
  totalOrders: number
  totalValue: number
  percentageUsed: number
}

type DepartmentMetrics = {
  department: string
  totalOrders: number
  totalValue: number
}

export default function OrderMetricsPage() {
  const { orders } = useOrders()
  const { contracts } = useContracts()
  const { suppliers } = useSuppliers()

  const [isLoading, setIsLoading] = useState(true)
  const [periodFilter, setPeriodFilter] = useState("all")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [filteredOrders, setFilteredOrders] = useState(orders)

  // Métricas calculadas
  const [metrics, setMetrics] = useState<PeriodMetrics>({
    totalOrders: 0,
    totalValue: 0,
    averageValue: 0,
    pendingOrders: 0,
    inProgressOrders: 0,
    completedOrders: 0,
    canceledOrders: 0,
    highPriorityOrders: 0,
    mediumPriorityOrders: 0,
    lowPriorityOrders: 0,
  })

  const [supplierMetrics, setSupplierMetrics] = useState<SupplierMetrics[]>([])
  const [contractMetrics, setContractMetrics] = useState<ContractMetrics[]>([])
  const [departmentMetrics, setDepartmentMetrics] = useState<DepartmentMetrics[]>([])
  const [monthlyData, setMonthlyData] = useState<{ month: string; value: number }[]>([])
  const [statusData, setStatusData] = useState<{ name: string; value: number }[]>([])
  const [priorityData, setPriorityData] = useState<{ name: string; value: number }[]>([])

  // Efeito para filtrar pedidos com base no período selecionado
  useEffect(() => {
    setIsLoading(true)

    let filtered = [...orders]
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    if (startDate && endDate) {
      // Filtro personalizado por datas
      filtered = orders.filter((order) => {
        const orderDate = new Date(order.date)
        return orderDate >= startDate && orderDate <= endDate
      })
    } else if (periodFilter !== "all") {
      // Filtros predefinidos
      if (periodFilter === "today") {
        filtered = orders.filter((order) => {
          const orderDate = new Date(order.date)
          return orderDate.toDateString() === today.toDateString()
        })
      } else if (periodFilter === "week") {
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay())

        filtered = orders.filter((order) => {
          const orderDate = new Date(order.date)
          return orderDate >= weekStart && orderDate <= today
        })
      } else if (periodFilter === "month") {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

        filtered = orders.filter((order) => {
          const orderDate = new Date(order.date)
          return orderDate >= monthStart && orderDate <= today
        })
      } else if (periodFilter === "year") {
        const yearStart = new Date(today.getFullYear(), 0, 1)

        filtered = orders.filter((order) => {
          const orderDate = new Date(order.date)
          return orderDate >= yearStart && orderDate <= today
        })
      }
    }

    setFilteredOrders(filtered)

    // Simular um pequeno atraso para mostrar o loading
    setTimeout(() => {
      setIsLoading(false)
    }, 500)
  }, [orders, periodFilter, startDate, endDate])

  // Calcular métricas com base nos pedidos filtrados
  useEffect(() => {
    if (filteredOrders.length === 0) {
      setMetrics({
        totalOrders: 0,
        totalValue: 0,
        averageValue: 0,
        pendingOrders: 0,
        inProgressOrders: 0,
        completedOrders: 0,
        canceledOrders: 0,
        highPriorityOrders: 0,
        mediumPriorityOrders: 0,
        lowPriorityOrders: 0,
      })
      setSupplierMetrics([])
      setContractMetrics([])
      setDepartmentMetrics([])
      setMonthlyData([])
      setStatusData([])
      setPriorityData([])
      return
    }

    // Métricas gerais
    const totalValue = filteredOrders.reduce((sum, order) => sum + order.totalValue, 0)
    const pendingOrders = filteredOrders.filter((order) => order.status === "pendente").length
    const inProgressOrders = filteredOrders.filter((order) => order.status === "em sepação").length
    const completedOrders = filteredOrders.filter((order) => order.status === "concluído").length
    const canceledOrders = filteredOrders.filter((order) => order.status === "cancelado").length

    const highPriorityOrders = filteredOrders.filter((order) => order.priority === "high").length
    const mediumPriorityOrders = filteredOrders.filter((order) => order.priority === "medium").length
    const lowPriorityOrders = filteredOrders.filter((order) => order.priority === "low").length

    setMetrics({
      totalOrders: filteredOrders.length,
      totalValue,
      averageValue: totalValue / filteredOrders.length,
      pendingOrders,
      inProgressOrders,
      completedOrders,
      canceledOrders,
      highPriorityOrders,
      mediumPriorityOrders,
      lowPriorityOrders,
    })

    // Métricas por fornecedor
    const supplierMap = new Map<string, SupplierMetrics>()

    filteredOrders.forEach((order) => {
      const contract = contracts.find((c) => c.id === order.contractId)
      if (!contract) return

      const supplier = suppliers.find((s) => s.id === contract.supplierId)
      if (!supplier) return

      const supplierId = supplier.id
      const supplierName = supplier.name

      if (supplierMap.has(supplierId)) {
        const current = supplierMap.get(supplierId)!
        supplierMap.set(supplierId, {
          ...current,
          totalOrders: current.totalOrders + 1,
          totalValue: current.totalValue + order.totalValue,
        })
      } else {
        supplierMap.set(supplierId, {
          supplierId,
          supplierName,
          totalOrders: 1,
          totalValue: order.totalValue,
        })
      }
    })

    setSupplierMetrics(
      Array.from(supplierMap.values())
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 5),
    )

    // Métricas por contrato
    const contractMap = new Map<string, ContractMetrics>()

    filteredOrders.forEach((order) => {
      const contract = contracts.find((c) => c.id === order.contractId)
      if (!contract) return

      const contractId = contract.id
      const contractNumber = contract.number

      if (contractMap.has(contractId)) {
        const current = contractMap.get(contractId)!
        contractMap.set(contractId, {
          ...current,
          totalOrders: current.totalOrders + 1,
          totalValue: current.totalValue + order.totalValue,
        })
      } else {
        contractMap.set(contractId, {
          contractId,
          contractNumber,
          totalOrders: 1,
          totalValue: order.totalValue,
          percentageUsed: (contract.usedValue / contract.value) * 100,
        })
      }
    })

    setContractMetrics(
      Array.from(contractMap.values())
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 5),
    )

    // Métricas por departamento
    const departmentMap = new Map<string, DepartmentMetrics>()

    filteredOrders.forEach((order) => {
      const department = order.requestedByDepartment

      if (departmentMap.has(department)) {
        const current = departmentMap.get(department)!
        departmentMap.set(department, {
          ...current,
          totalOrders: current.totalOrders + 1,
          totalValue: current.totalValue + order.totalValue,
        })
      } else {
        departmentMap.set(department, {
          department,
          totalOrders: 1,
          totalValue: order.totalValue,
        })
      }
    })

    setDepartmentMetrics(Array.from(departmentMap.values()).sort((a, b) => b.totalValue - a.totalValue))

    // Dados mensais para gráfico de linha
    const monthlyMap = new Map<string, number>()

    filteredOrders.forEach((order) => {
      const date = new Date(order.date)
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`

      if (monthlyMap.has(monthYear)) {
        monthlyMap.set(monthYear, monthlyMap.get(monthYear)! + order.totalValue)
      } else {
        monthlyMap.set(monthYear, order.totalValue)
      }
    })

    const sortedMonths = Array.from(monthlyMap.entries())
      .map(([month, value]) => ({ month, value }))
      .sort((a, b) => {
        const [aMonth, aYear] = a.month.split("/").map(Number)
        const [bMonth, bYear] = b.month.split("/").map(Number)

        if (aYear !== bYear) return aYear - bYear
        return aMonth - bMonth
      })

    setMonthlyData(sortedMonths)

    // Dados de status para gráfico de pizza
    setStatusData([
      { name: "Pendente", value: pendingOrders },
      { name: "Em Sepação", value: inProgressOrders },
      { name: "Concluído", value: completedOrders },
      { name: "Cancelado", value: canceledOrders },
    ])

    // Dados de prioridade para gráfico de donut
    setPriorityData([
      { name: "Alta", value: highPriorityOrders },
      { name: "Média", value: mediumPriorityOrders },
      { name: "Baixa", value: lowPriorityOrders },
    ])
  }, [filteredOrders, contracts, suppliers])

  // Função para exportar dados
  const exportData = () => {
    const dataStr = JSON.stringify(
      {
        metrics,
        supplierMetrics,
        contractMetrics,
        departmentMetrics,
        orders: filteredOrders,
      },
      null,
      2,
    )

    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

    const exportFileDefaultName = `pedidos-metricas-${new Date().toISOString().slice(0, 10)}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  // Colunas para a tabela de pedidos recentes
  const columns = [
    {
      accessorKey: "number",
      header: "Número",
    },
    {
      accessorKey: "date",
      header: "Data",
      cell: ({ row }: any) => new Date(row.getValue("date")).toLocaleDateString("pt-BR"),
    },
    {
      accessorKey: "requestedBy",
      header: "Solicitante",
    },
    {
      accessorKey: "requestedByDepartment",
      header: "Departamento",
    },
    {
      accessorKey: "totalValue",
      header: "Valor Total",
      cell: ({ row }: any) => formatCurrency(row.getValue("totalValue")),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => {
        const status = row.getValue("status") as string
        return (
          <Badge
            variant={
              status === "concluído"
                ? "default"
                : status === "pendente"
                  ? "outline"
                  : status === "cancelado"
                    ? "destructive"
                    : "secondary"
            }
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard de Pedidos</h1>
        <Button variant="outline" onClick={exportData}>
          <Download className="mr-2 h-4 w-4" />
          Exportar Dados
        </Button>
      </div>

      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
        <Card className="w-full md:w-1/4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Período</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Select
              value={periodFilter}
              onValueChange={(value) => {
                setPeriodFilter(value)
                setStartDate(undefined)
                setEndDate(undefined)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os períodos</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mês</SelectItem>
                <SelectItem value="year">Este ano</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>

            {periodFilter === "custom" && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Data inicial</span>
                  <DatePicker date={startDate} onDateChange={setStartDate} />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Data final</span>
                  <DatePicker date={endDate} onDateChange={setEndDate} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="w-full md:w-3/4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resumo</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Total de Pedidos</span>
                <span className="text-2xl font-bold">{metrics.totalOrders}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Valor Total</span>
                <span className="text-2xl font-bold">{formatCurrency(metrics.totalValue)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Valor Médio</span>
                <span className="text-2xl font-bold">{formatCurrency(metrics.averageValue)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Pendentes</span>
                <span className="text-2xl font-bold">{metrics.pendingOrders}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex h-96 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  {periodFilter === "all"
                    ? "Total de todos os pedidos"
                    : periodFilter === "today"
                      ? "Pedidos de hoje"
                      : periodFilter === "week"
                        ? "Pedidos desta semana"
                        : periodFilter === "month"
                          ? "Pedidos deste mês"
                          : periodFilter === "year"
                            ? "Pedidos deste ano"
                            : "Pedidos no período selecionado"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.totalValue)}</div>
                <p className="text-xs text-muted-foreground">Valor médio: {formatCurrency(metrics.averageValue)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status dos Pedidos</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <div className="mr-1 h-2 w-2 rounded-full bg-yellow-500"></div>
                      <span className="text-xs">Pendentes: {metrics.pendingOrders}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-1 h-2 w-2 rounded-full bg-blue-500"></div>
                      <span className="text-xs">Em andamento: {metrics.inProgressOrders}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-1 h-2 w-2 rounded-full bg-green-500"></div>
                      <span className="text-xs">Concluídos: {metrics.completedOrders}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-1 h-2 w-2 rounded-full bg-red-500"></div>
                      <span className="text-xs">Cancelados: {metrics.canceledOrders}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Prioridade</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <div className="mr-1 h-2 w-2 rounded-full bg-red-500"></div>
                      <span className="text-xs">Alta: {metrics.highPriorityOrders}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-1 h-2 w-2 rounded-full bg-yellow-500"></div>
                      <span className="text-xs">Média: {metrics.mediumPriorityOrders}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-1 h-2 w-2 rounded-full bg-green-500"></div>
                      <span className="text-xs">Baixa: {metrics.lowPriorityOrders}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
              <TabsTrigger value="contracts">Contratos</TabsTrigger>
              <TabsTrigger value="departments">Departamentos</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Valor dos Pedidos por Mês</CardTitle>
                    <CardDescription>Evolução do valor total de pedidos ao longo do tempo</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    {monthlyData.length > 0 ? (
                      <LineChart
                        data={monthlyData}
                        xField="month"
                        yField="value"
                        yFormat={(value) => `R$ ${(value / 1000).toFixed(1)}k`}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <p className="text-muted-foreground">Sem dados para exibir</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição por Status</CardTitle>
                    <CardDescription>Quantidade de pedidos por status</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    {statusData.some((item) => item.value > 0) ? (
                      <PieChart
                        data={statusData}
                        nameKey="name"
                        dataKey="value"
                        colors={["#EAB308", "#3B82F6", "#22C55E", "#EF4444"]}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <p className="text-muted-foreground">Sem dados para exibir</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Pedidos Recentes</CardTitle>
                  <CardDescription>Lista dos últimos pedidos no período selecionado</CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredOrders.length > 0 ? (
                    <DataTable columns={columns} data={filteredOrders.slice(0, 10)} searchKey="number" />
                  ) : (
                    <div className="flex h-40 items-center justify-center">
                      <p className="text-muted-foreground">Nenhum pedido encontrado no período selecionado</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="suppliers" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Top Fornecedores</CardTitle>
                  <CardDescription>Fornecedores com maior volume de pedidos</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {supplierMetrics.length > 0 ? (
                    <BarChart
                      data={supplierMetrics}
                      xField="supplierName"
                      yField="totalValue"
                      yFormat={(value) => `R$ ${(value / 1000).toFixed(1)}k`}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">Sem dados para exibir</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Detalhes por Fornecedor</CardTitle>
                </CardHeader>
                <CardContent>
                  {supplierMetrics.length > 0 ? (
                    <div className="space-y-4">
                      {supplierMetrics.map((metric) => (
                        <div key={metric.supplierId} className="rounded-lg border p-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{metric.supplierName}</h3>
                            <Badge variant="outline">{metric.totalOrders} pedidos</Badge>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Valor total:</span>
                            <span className="font-medium">{formatCurrency(metric.totalValue)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Valor médio por pedido:</span>
                            <span className="font-medium">
                              {formatCurrency(metric.totalValue / metric.totalOrders)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-40 items-center justify-center">
                      <p className="text-muted-foreground">Nenhum fornecedor encontrado no período selecionado</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contracts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Top Contratos</CardTitle>
                  <CardDescription>Contratos com maior volume de pedidos</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {contractMetrics.length > 0 ? (
                    <BarChart
                      data={contractMetrics}
                      xField="contractNumber"
                      yField="totalValue"
                      yFormat={(value) => `R$ ${(value / 1000).toFixed(1)}k`}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">Sem dados para exibir</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Detalhes por Contrato</CardTitle>
                </CardHeader>
                <CardContent>
                  {contractMetrics.length > 0 ? (
                    <div className="space-y-4">
                      {contractMetrics.map((metric) => (
                        <div key={metric.contractId} className="rounded-lg border p-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">Contrato {metric.contractNumber}</h3>
                            <Badge
                              variant={
                                metric.percentageUsed >= 90
                                  ? "destructive"
                                  : metric.percentageUsed >= 70
                                    ? "default"
                                    : "outline"
                              }
                            >
                              {metric.percentageUsed.toFixed(1)}% utilizado
                            </Badge>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total de pedidos:</span>
                            <span className="font-medium">{metric.totalOrders}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Valor total:</span>
                            <span className="font-medium">{formatCurrency(metric.totalValue)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Valor médio por pedido:</span>
                            <span className="font-medium">
                              {formatCurrency(metric.totalValue / metric.totalOrders)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-40 items-center justify-center">
                      <p className="text-muted-foreground">Nenhum contrato encontrado no período selecionado</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="departments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pedidos por Departamento</CardTitle>
                  <CardDescription>Distribuição de pedidos por departamento solicitante</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {departmentMetrics.length > 0 ? (
                    <DonutChart data={departmentMetrics} nameKey="department" dataKey="totalValue" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">Sem dados para exibir</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Detalhes por Departamento</CardTitle>
                </CardHeader>
                <CardContent>
                  {departmentMetrics.length > 0 ? (
                    <div className="space-y-4">
                      {departmentMetrics.map((metric) => (
                        <div key={metric.department} className="rounded-lg border p-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{metric.department}</h3>
                            <Badge variant="outline">{metric.totalOrders} pedidos</Badge>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Valor total:</span>
                            <span className="font-medium">{formatCurrency(metric.totalValue)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Valor médio por pedido:</span>
                            <span className="font-medium">
                              {formatCurrency(metric.totalValue / metric.totalOrders)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-40 items-center justify-center">
                      <p className="text-muted-foreground">Nenhum departamento encontrado no período selecionado</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
