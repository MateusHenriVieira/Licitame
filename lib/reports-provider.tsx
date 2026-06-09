"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useContracts } from "@/lib/contracts-provider"
import { useOrders } from "@/lib/orders-provider"
import { useSuppliers } from "@/lib/suppliers-provider"
import { useProducts } from "@/lib/products-provider"
import { useCostBase } from "@/lib/cost-base-provider"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export type ReportType = "contracts" | "orders" | "suppliers" | "products" | "costbase" | "backup"
export type ReportFormat = "pdf" | "excel" | "csv"

export type ReportFilter = {
  startDate?: string
  endDate?: string
  status?: string
  category?: string
  type?: string
}

type ReportsContextType = {
  generateReport: (type: ReportType, format: ReportFormat, filters?: ReportFilter) => void
  generateBackup: () => void
}

const ReportsContext = createContext<ReportsContextType | undefined>(undefined)

export function ReportsProvider({ children }: { children: ReactNode }) {
  const { contracts } = useContracts()
  const { orders } = useOrders()
  const { suppliers } = useSuppliers()
  const { products } = useProducts()
  const { costBases } = useCostBase()

  const generateReport = (type: ReportType, format: ReportFormat, filters?: ReportFilter) => {
    switch (type) {
      case "contracts":
        generateContractsReport(format, filters)
        break
      case "orders":
        generateOrdersReport(format, filters)
        break
      case "suppliers":
        generateSuppliersReport(format, filters)
        break
      case "products":
        generateProductsReport(format, filters)
        break
      case "costbase":
        generateCostBaseReport(format, filters)
        break
      case "backup":
        generateBackup()
        break
    }
  }

  const generateContractsReport = (format: ReportFormat, filters?: ReportFilter) => {
    let filteredContracts = [...contracts]

    if (filters?.startDate) {
      filteredContracts = filteredContracts.filter((c) => new Date(c.startDate) >= new Date(filters.startDate!))
    }
    if (filters?.endDate) {
      filteredContracts = filteredContracts.filter((c) => new Date(c.expirationDate) <= new Date(filters.endDate!))
    }
    if (filters?.status) {
      filteredContracts = filteredContracts.filter((c) => c.status === filters.status)
    }

    if (format === "pdf") {
      const doc = new jsPDF()

      doc.setFontSize(18)
      doc.text("Relatório de Contratos", 14, 22)

      doc.setFontSize(11)
      doc.text(`Data de geração: ${new Date().toLocaleDateString("pt-BR")}`, 14, 32)
      doc.text(`Total de contratos: ${filteredContracts.length}`, 14, 38)

      const tableData = filteredContracts.map((contract) => [
        contract.number,
        contract.company,
        new Date(contract.startDate).toLocaleDateString("pt-BR"),
        new Date(contract.expirationDate).toLocaleDateString("pt-BR"),
        `R$ ${contract.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        contract.status,
      ])

      autoTable(doc, {
        head: [["Número", "Empresa", "Início", "Vencimento", "Valor Total", "Status"]],
        body: tableData,
        startY: 45,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      })

      doc.save(`relatorio-contratos-${new Date().toISOString().split("T")[0]}.pdf`)
    } else if (format === "csv" || format === "excel") {
      const csvContent = [
        ["Número", "Empresa", "Início", "Vencimento", "Valor Total", "Usado", "Status"].join(";"),
        ...filteredContracts.map((contract) =>
          [
            contract.number,
            contract.company,
            new Date(contract.startDate).toLocaleDateString("pt-BR"),
            new Date(contract.expirationDate).toLocaleDateString("pt-BR"),
            contract.totalValue.toFixed(2),
            contract.usedValue.toFixed(2),
            contract.status,
          ].join(";"),
        ),
      ].join("\n")

      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `relatorio-contratos-${new Date().toISOString().split("T")[0]}.csv`
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  const generateOrdersReport = (format: ReportFormat, filters?: ReportFilter) => {
    let filteredOrders = [...orders]

    if (filters?.startDate) {
      filteredOrders = filteredOrders.filter((o) => new Date(o.date) >= new Date(filters.startDate!))
    }
    if (filters?.endDate) {
      filteredOrders = filteredOrders.filter((o) => new Date(o.date) <= new Date(filters.endDate!))
    }
    if (filters?.status) {
      filteredOrders = filteredOrders.filter((o) => o.status === filters.status)
    }

    if (format === "pdf") {
      const doc = new jsPDF()

      doc.setFontSize(18)
      doc.text("Relatório de Pedidos", 14, 22)

      doc.setFontSize(11)
      doc.text(`Data de geração: ${new Date().toLocaleDateString("pt-BR")}`, 14, 32)
      doc.text(`Total de pedidos: ${filteredOrders.length}`, 14, 38)

      const tableData = filteredOrders.map((order) => [
        order.number,
        order.contractNumber,
        new Date(order.date).toLocaleDateString("pt-BR"),
        `R$ ${order.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        order.status,
      ])

      autoTable(doc, {
        head: [["Número", "Contrato", "Data", "Valor Total", "Status"]],
        body: tableData,
        startY: 45,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      })

      doc.save(`relatorio-pedidos-${new Date().toISOString().split("T")[0]}.pdf`)
    } else if (format === "csv" || format === "excel") {
      const csvContent = [
        ["Número", "Contrato", "Data", "Valor Total", "Status", "Solicitante"].join(";"),
        ...filteredOrders.map((order) =>
          [
            order.number,
            order.contractNumber,
            new Date(order.date).toLocaleDateString("pt-BR"),
            order.totalValue.toFixed(2),
            order.status,
            order.requestedBy,
          ].join(";"),
        ),
      ].join("\n")

      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `relatorio-pedidos-${new Date().toISOString().split("T")[0]}.csv`
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  const generateSuppliersReport = (format: ReportFormat, filters?: ReportFilter) => {
    let filteredSuppliers = [...suppliers]

    if (filters?.status) {
      const isActive = filters.status === "ativo"
      filteredSuppliers = filteredSuppliers.filter((s) => s.active === isActive)
    }

    if (format === "pdf") {
      const doc = new jsPDF()

      doc.setFontSize(18)
      doc.text("Relatório de Fornecedores", 14, 22)

      doc.setFontSize(11)
      doc.text(`Data de geração: ${new Date().toLocaleDateString("pt-BR")}`, 14, 32)
      doc.text(`Total de fornecedores: ${filteredSuppliers.length}`, 14, 38)

      const tableData = filteredSuppliers.map((supplier) => [
        supplier.name,
        supplier.cnpj,
        supplier.email,
        supplier.phone,
        supplier.active ? "Ativo" : "Inativo",
      ])

      autoTable(doc, {
        head: [["Nome", "CNPJ", "Email", "Telefone", "Status"]],
        body: tableData,
        startY: 45,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      })

      doc.save(`relatorio-fornecedores-${new Date().toISOString().split("T")[0]}.pdf`)
    } else if (format === "csv" || format === "excel") {
      const csvContent = [
        ["Nome", "CNPJ", "Email", "Telefone", "Cidade", "Estado", "Status"].join(";"),
        ...filteredSuppliers.map((supplier) =>
          [
            supplier.name,
            supplier.cnpj,
            supplier.email,
            supplier.phone,
            supplier.city,
            supplier.state,
            supplier.active ? "Ativo" : "Inativo",
          ].join(";"),
        ),
      ].join("\n")

      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `relatorio-fornecedores-${new Date().toISOString().split("T")[0]}.csv`
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  const generateProductsReport = (format: ReportFormat, filters?: ReportFilter) => {
    let filteredProducts = [...products]

    if (filters?.status) {
      const isActive = filters.status === "ativo"
      filteredProducts = filteredProducts.filter((p) => p.active === isActive)
    }
    if (filters?.category) {
      filteredProducts = filteredProducts.filter((p) => p.category === filters.category)
    }

    if (format === "pdf") {
      const doc = new jsPDF()

      doc.setFontSize(18)
      doc.text("Relatório de Produtos", 14, 22)

      doc.setFontSize(11)
      doc.text(`Data de geração: ${new Date().toLocaleDateString("pt-BR")}`, 14, 32)
      doc.text(`Total de produtos: ${filteredProducts.length}`, 14, 38)

      const tableData = filteredProducts.map((product) => [
        product.name,
        product.code,
        product.category,
        `${product.currentStock} ${product.unit}`,
        `${product.minStock} ${product.unit}`,
        product.active ? "Ativo" : "Inativo",
      ])

      autoTable(doc, {
        head: [["Nome", "Código", "Categoria", "Estoque Atual", "Estoque Mínimo", "Status"]],
        body: tableData,
        startY: 45,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      })

      doc.save(`relatorio-produtos-${new Date().toISOString().split("T")[0]}.pdf`)
    } else if (format === "csv" || format === "excel") {
      const csvContent = [
        ["Nome", "Código", "Categoria", "Estoque Atual", "Estoque Mínimo", "Unidade", "Status"].join(";"),
        ...filteredProducts.map((product) =>
          [
            product.name,
            product.code,
            product.category,
            product.currentStock,
            product.minStock,
            product.unit,
            product.active ? "Ativo" : "Inativo",
          ].join(";"),
        ),
      ].join("\n")

      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `relatorio-produtos-${new Date().toISOString().split("T")[0]}.csv`
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  const generateCostBaseReport = (format: ReportFormat, filters?: ReportFilter) => {
    let filteredCostBases = [...costBases]

    if (filters?.startDate) {
      filteredCostBases = filteredCostBases.filter((cb) => new Date(cb.validFrom) >= new Date(filters.startDate!))
    }
    if (filters?.endDate) {
      filteredCostBases = filteredCostBases.filter((cb) => {
        if (!cb.validUntil) return true
        return new Date(cb.validUntil) <= new Date(filters.endDate!)
      })
    }

    if (format === "pdf") {
      const doc = new jsPDF()

      doc.setFontSize(18)
      doc.text("Relatório de Bases de Custo", 14, 22)

      doc.setFontSize(11)
      doc.text(`Data de geração: ${new Date().toLocaleDateString("pt-BR")}`, 14, 32)
      doc.text(`Total de bases de custo: ${filteredCostBases.length}`, 14, 38)

      const tableData = filteredCostBases.map((costBase) => [
        costBase.name,
        costBase.supplierName,
        costBase.productName,
        `R$ ${costBase.unitPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        new Date(costBase.validFrom).toLocaleDateString("pt-BR"),
        costBase.validUntil ? new Date(costBase.validUntil).toLocaleDateString("pt-BR") : "Indefinido",
      ])

      autoTable(doc, {
        head: [["Nome", "Fornecedor", "Produto", "Preço", "Válido De", "Válido Até"]],
        body: tableData,
        startY: 45,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      })

      doc.save(`relatorio-bases-custo-${new Date().toISOString().split("T")[0]}.pdf`)
    } else if (format === "csv" || format === "excel") {
      const csvContent = [
        ["Nome", "Fornecedor", "Produto", "Preço Unitário", "Válido De", "Válido Até"].join(";"),
        ...filteredCostBases.map((costBase) =>
          [
            costBase.name,
            costBase.supplierName,
            costBase.productName,
            costBase.unitPrice.toFixed(2),
            new Date(costBase.validFrom).toLocaleDateString("pt-BR"),
            costBase.validUntil ? new Date(costBase.validUntil).toLocaleDateString("pt-BR") : "Indefinido",
          ].join(";"),
        ),
      ].join("\n")

      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `relatorio-bases-custo-${new Date().toISOString().split("T")[0]}.csv`
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  const generateBackup = () => {
    const backupData = {
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      data: {
        contracts,
        orders,
        suppliers,
        products,
        costBases,
      },
    }

    const dataStr = JSON.stringify(backupData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `backup-completo-${new Date().toISOString().split("T")[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <ReportsContext.Provider
      value={{
        generateReport,
        generateBackup,
      }}
    >
      {children}
    </ReportsContext.Provider>
  )
}

export function useReports() {
  const context = useContext(ReportsContext)
  if (context === undefined) {
    throw new Error("useReports deve ser usado dentro de um ReportsProvider")
  }
  return context
}
