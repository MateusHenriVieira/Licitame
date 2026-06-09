import { EditarProdutoClient } from "./_client"

export default function EditarProdutoPage({ params }: { params: { id: string } }) {
  return <EditarProdutoClient params={params} />
}
