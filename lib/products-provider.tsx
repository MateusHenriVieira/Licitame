"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useToast } from "@/components/ui/use-toast"
import { ValidationLogger } from "@/lib/validation/validation-logger"
import { validateObject, productSchema } from "./validation/schemas"
import {
  isFirebaseConfigured,
  getAllDocuments,
  addDocument,
  updateDocument,
  deleteDocument,
  COLLECTIONS,
} from "@/lib/firebase"

export type Product = {
  id: string
  name: string
  description: string
  category: string
  price: number
  unit: string
  sku: string
  barcode?: string
  minStock: number
  currentStock: number
  supplierId: string
  active: boolean
  createdAt: string
  updatedAt: string
}

type ProductsContextType = {
  products: Product[]
  isLoading: boolean
  addProduct: (product: Omit<Product, "id" | "createdAt" | "updatedAt">) => Promise<boolean>
  updateProduct: (id: string, product: Partial<Product>) => Promise<boolean>
  deleteProduct: (id: string) => Promise<boolean>
  getProductById: (id: string) => Product | undefined
  updateStock: (id: string, quantity: number) => void
  exportProducts: () => void
  validateAndLoadProducts: (data: any[]) => boolean
  importData: (data: Product[]) => Promise<boolean>
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined)

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadFromFirestore()
  }, [])

  const loadFromFirestore = async () => {
    try {
      if (isFirebaseConfigured()) {
        const data = await getAllDocuments<Product>(COLLECTIONS.PRODUCTS)
        setProducts(data)
        ValidationLogger.log({
          level: "success",
          dataType: "products",
          action: "load",
          message: `${data.length} produtos carregados do Firebase`,
          metadata: { count: data.length },
        })
      }
    } catch (error) {
      ValidationLogger.log({
        level: "error",
        dataType: "products",
        action: "load",
        message: "Erro ao carregar produtos",
        metadata: { error: error instanceof Error ? error.message : String(error) },
      })
    } finally {
      setIsLoading(false)
    }
  }

  const validateAndLoadProducts = (data: any[]): boolean => {
    try {
      if (!Array.isArray(data)) {
        toast({ title: "Erro na validacao", description: "Os dados devem ser um array de produtos.", variant: "destructive" })
        return false
      }
      setProducts(data)
      toast({ title: "Produtos carregados", description: `${data.length} produtos importados com sucesso.` })
      return true
    } catch {
      toast({ title: "Erro na validacao", description: "Nao foi possivel validar os dados.", variant: "destructive" })
      return false
    }
  }

  const addProduct = async (product: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<boolean> => {
    try {
      const now = new Date().toISOString()
      const newProduct: Product = {
        ...product,
        id: `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now,
      }

      const validation = validateObject(newProduct, productSchema)
      if (!validation.valid) {
        ValidationLogger.log({ level: "error", dataType: "products", action: "create", message: "Validacao falhou", metadata: { errors: validation.errors } })
        return false
      }

      if (isFirebaseConfigured()) {
        const { id, ...data } = newProduct
        // Remove undefined fields to prevent Firebase errors
        const cleanedData = Object.fromEntries(
          Object.entries(data).filter(([, value]) => value !== undefined)
        )
        const firebaseId = await addDocument(COLLECTIONS.PRODUCTS, cleanedData)
        if (firebaseId) {
          newProduct.id = firebaseId
        } else {
          ValidationLogger.log({ level: "error", dataType: "products", action: "create", message: "Falha ao salvar produto no Firebase", metadata: {} })
          return false
        }
      }

      setProducts((prev) => [...prev, newProduct])
      return true
    } catch (error) {
      ValidationLogger.log({ level: "error", dataType: "products", action: "create", message: "Erro ao criar produto", metadata: { error: error instanceof Error ? error.message : String(error) } })
      return false
    }
  }

  const updateProduct = async (id: string, productUpdate: Partial<Product>): Promise<boolean> => {
    try {
      const index = products.findIndex((p) => p.id === id)
      if (index === -1) return false

      const updatedData = { ...productUpdate, updatedAt: new Date().toISOString() }

      if (isFirebaseConfigured()) {
        const success = await updateDocument(COLLECTIONS.PRODUCTS, id, updatedData)
        if (!success) {
          ValidationLogger.log({ level: "error", dataType: "products", action: "update", message: "Falha ao atualizar produto no Firebase", metadata: { id } })
          return false
        }
      }

      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updatedData } : p)))
      return true
    } catch (error) {
      ValidationLogger.log({ level: "error", dataType: "products", action: "update", message: "Erro ao atualizar produto", metadata: { error: error instanceof Error ? error.message : String(error), id } })
      return false
    }
  }

  const deleteProduct = async (id: string): Promise<boolean> => {
    try {
      const product = products.find((p) => p.id === id)
      if (!product) return false

      if (isFirebaseConfigured()) {
        const success = await deleteDocument(COLLECTIONS.PRODUCTS, id)
        if (!success) {
          ValidationLogger.log({ level: "error", dataType: "products", action: "delete", message: "Falha ao excluir produto no Firebase", metadata: { id } })
          return false
        }
      }

      setProducts((prev) => prev.filter((p) => p.id !== id))
      return true
    } catch (error) {
      ValidationLogger.log({ level: "error", dataType: "products", action: "delete", message: "Erro ao excluir produto", metadata: { error: error instanceof Error ? error.message : String(error), id } })
      return false
    }
  }

  const getProductById = (id: string) => products.find((p) => p.id === id)

  const updateStock = async (id: string, quantity: number) => {
    const product = products.find((p) => p.id === id)
    if (!product) return

    const newStock = Math.max(0, product.currentStock + quantity)
    const update = { currentStock: newStock, updatedAt: new Date().toISOString() }

    if (isFirebaseConfigured()) {
      const success = await updateDocument(COLLECTIONS.PRODUCTS, id, update)
      if (!success) {
        ValidationLogger.log({ level: "error", dataType: "products", action: "update", message: "Falha ao atualizar estoque no Firebase", metadata: { id } })
        return
      }
    }

    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...update } : p)),
    )
  }

  const exportProducts = () => {
    try {
      const dataStr = JSON.stringify(products, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `produtos-${new Date().toISOString().split("T")[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Erro ao exportar produtos:", error)
    }
  }

  const importData = async (data: Product[]): Promise<boolean> => {
    try {
      setProducts(data)
      return true
    } catch {
      return false
    }
  }

  return (
    <ProductsContext.Provider
      value={{
        products,
        isLoading,
        addProduct,
        updateProduct,
        deleteProduct,
        getProductById,
        updateStock,
        exportProducts,
        validateAndLoadProducts,
        importData,
      }}
    >
      {children}
    </ProductsContext.Provider>
  )
}

export function useProducts() {
  const context = useContext(ProductsContext)
  if (context === undefined) {
    throw new Error("useProducts deve ser usado dentro de um ProductsProvider")
  }
  return context
}
