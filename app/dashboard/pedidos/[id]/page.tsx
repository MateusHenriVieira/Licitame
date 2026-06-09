import PedidoDetalhesPage from "./_client"

export const dynamicParams = true

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  return <PedidoDetalhesPage params={resolvedParams} />
}
