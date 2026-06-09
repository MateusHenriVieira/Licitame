"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useOrders } from "@/lib/orders-provider"
import { useContracts } from "@/lib/contracts-provider"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Printer, ArrowLeft } from "lucide-react"

export default function ImprimirPedidoPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const { getOrderById, orders } = useOrders()
  const { getContractById } = useContracts()
  const [isLoading, setIsLoading] = useState(true)
  const [order, setOrder] = useState<any>(null)
  const [contract, setContract] = useState<any>(null)

  useEffect(() => {
    if (orders.length === 0) return

    const foundOrder = getOrderById(params.id) || orders.find((o) => o.id === params.id)

    if (!foundOrder) {
      toast({
        title: "Pedido não encontrado",
        description: "O pedido que você está tentando imprimir não existe.",
        variant: "destructive",
      })
      router.push("/dashboard/pedidos")
      return
    }

    const foundContract = getContractById(foundOrder.contractId)
    setOrder(foundOrder)
    setContract(foundContract)
    setIsLoading(false)

    // Auto-print quando a página carregar
    const timer = setTimeout(() => {
      window.print()
    }, 1000)

    return () => clearTimeout(timer)
  }, [params.id, getOrderById, getContractById, orders, toast, router])

  const handlePrint = () => {
    window.print()
  }

  const handleBack = () => {
    router.back()
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    )
  }

  if (!order) {
    return null
  }

  return (
    <>
      {/* Botões de controle - não aparecem na impressão */}
      <div className="print:hidden mb-6 flex gap-2">
        <Button onClick={handleBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Imprimir
        </Button>
      </div>

      {/* Conteúdo para impressão */}
      <div className="print:p-6 p-6 bg-white">
        {/* Cabeçalho do Documento */}
        <div className="border-b-2 border-gray-800 pb-4 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold">COMPROVANTE DE PEDIDO</h1>
              <p className="text-sm text-gray-600 mt-1">Sistema de Gerenciamento de Pedidos</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">Data de Impressão:</p>
              <p className="text-sm">{new Date().toLocaleDateString("pt-BR")}</p>
              <p className="text-sm font-medium mt-2">Hora:</p>
              <p className="text-sm">{new Date().toLocaleTimeString("pt-BR")}</p>
            </div>
          </div>
        </div>

        {/* Informações do Pedido */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3 border-b border-gray-300 pb-2">Informações do Pedido</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Número do Pedido</p>
              <p className="text-lg font-bold">{order.number}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Data do Pedido</p>
              <p className="text-lg font-bold">
                {new Date(order.date).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Status</p>
              <p className="text-lg font-bold capitalize">{order.status}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Valor Total</p>
              <p className="text-lg font-bold">
                R$ {order.totalValue?.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>
        </div>

        {/* Informações do Solicitante */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3 border-b border-gray-300 pb-2">Informações do Solicitante</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Solicitado Por</p>
              <p className="text-base">{order.requestedBy || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Departamento</p>
              <p className="text-base">{order.requestedByDepartment || "N/A"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-medium text-gray-600">Solicitado Para</p>
              <p className="text-base">{order.requestedFor || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* Informações do Contrato */}
        {contract && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3 border-b border-gray-300 pb-2">Informações do Contrato</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Número do Contrato</p>
                <p className="text-base font-medium">{contract.number}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Empresa/Fornecedor</p>
                <p className="text-base font-medium">{contract.company}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">CNPJ</p>
                <p className="text-base">{contract.cnpj || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Base de Custo</p>
                <p className="text-base">{contract.costBase}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-gray-600">Período de Vigência</p>
                <p className="text-base">
                  {new Date(contract.startDate).toLocaleDateString("pt-BR")} a{" "}
                  {new Date(contract.expirationDate).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Itens do Pedido */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3 border-b border-gray-300 pb-2">Itens do Pedido</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-800">
                <th className="text-left py-2 px-2 font-bold">Produto</th>
                <th className="text-center py-2 px-2 font-bold">Quantidade</th>
                <th className="text-right py-2 px-2 font-bold">Valor Unitário</th>
                <th className="text-right py-2 px-2 font-bold">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items && order.items.length > 0 ? (
                order.items.map((item: any, index: number) => (
                  <tr key={item.id || index} className="border-b border-gray-200">
                    <td className="py-2 px-2">{item.name}</td>
                    <td className="text-center py-2 px-2">{item.quantity}</td>
                    <td className="text-right py-2 px-2">R$ {item.unitPrice?.toFixed(2) || "0.00"}</td>
                    <td className="text-right py-2 px-2 font-medium">
                      R$ {item.totalPrice?.toFixed(2) || "0.00"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-gray-500">
                    Nenhum item encontrado
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-800">
                <td colSpan={3} className="text-right py-3 px-2 font-bold text-lg">
                  VALOR TOTAL:
                </td>
                <td className="text-right py-3 px-2 font-bold text-lg border-t-2 border-gray-800">
                  R$ {order.totalValue?.toFixed(2) || "0.00"}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Observações */}
        {order.notes && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3 border-b border-gray-300 pb-2">Observações</h2>
            <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
          </div>
        )}

        {/* Rodapé */}
        <div className="border-t-2 border-gray-800 pt-4 mt-8 text-center text-sm text-gray-600">
          <p>Documento gerado automaticamente pelo Sistema de Gerenciamento de Pedidos</p>
          <p className="text-xs mt-2">Este documento é válido apenas como comprovante de pedido</p>
        </div>
      </div>

      {/* Estilos de impressão */}
      <style jsx>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            background-color: white;
          }

          div.print\\:hidden {
            display: none !important;
          }

          div.print\\:p-6 {
            padding: 0.75rem;
          }

          @page {
            size: A4;
            margin: 1cm;
          }

          table {
            border-collapse: collapse;
          }

          tr {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </>
  )
}
