"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import {
  isFirebaseConfigured,
  getAllDocuments,
  addDocument,
  updateDocument,
  deleteDocument,
  COLLECTIONS,
} from "@/lib/firebase"

export interface SupplierProduct {
  id: string
  name: string
  quantity: number
  unitPrice: number
}

export interface Supplier {
  id: string
  name: string
  cnpj: string
  address: string
  city: string
  state: string
  zipCode: string
  contactName: string
  contactPhone: string
  email: string
  website?: string
  category: string
  rating: number
  active: boolean
  products?: SupplierProduct[]
  contractIds?: string[]
  createdAt: string
  updatedAt: string
}

interface SuppliersContextType {
  suppliers: Supplier[]
  isLoading: boolean
  addSupplier: (supplier: Omit<Supplier, "id" | "createdAt" | "updatedAt">) => Promise<boolean>
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<boolean>
  deleteSupplier: (id: string) => Promise<boolean>
  getSupplierById: (id: string) => Supplier | undefined
  getSupplierByCNPJ: (cnpj: string) => Supplier | undefined
  linkContractToSupplier: (supplierId: string, contractId: string) => Promise<boolean>
  unlinkContractFromSupplier: (supplierId: string, contractId: string) => Promise<boolean>
  refreshSuppliers: () => void
}

const SuppliersContext = createContext<SuppliersContextType | undefined>(undefined)

export function SuppliersProvider({ children }: { children: React.ReactNode }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadFromFirestore()
  }, [])

  const loadFromFirestore = async () => {
    try {
      if (isFirebaseConfigured()) {
        const data = await getAllDocuments<Supplier>(COLLECTIONS.SUPPLIERS)
        setSuppliers(data)
      }
    } catch (error) {
      console.error("Erro ao carregar fornecedores:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const addSupplier = async (supplierData: Omit<Supplier, "id" | "createdAt" | "updatedAt">): Promise<boolean> => {
    try {
      if (!supplierData.name || !supplierData.cnpj) return false

      const existingSupplier = suppliers.find((s) => s.cnpj === supplierData.cnpj)
      if (existingSupplier) return false

      const now = new Date().toISOString()
      const dataToSave = {
        ...supplierData,
        products: supplierData.products || [],
        contractIds: supplierData.contractIds || [],
        createdAt: now,
        updatedAt: now,
      }

      if (isFirebaseConfigured()) {
        const firebaseId = await addDocument(COLLECTIONS.SUPPLIERS, dataToSave)
        if (firebaseId) {
          setSuppliers((prev) => [...prev, { ...dataToSave, id: firebaseId }])
          return true
        }
        return false
      }

      const localId = `supplier_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      setSuppliers((prev) => [...prev, { ...dataToSave, id: localId }])
      return true
    } catch (error) {
      console.error("Erro ao adicionar fornecedor:", error)
      return false
    }
  }

  const updateSupplier = async (id: string, supplierData: Partial<Supplier>): Promise<boolean> => {
    try {
      const supplier = suppliers.find((s) => s.id === id)
      if (!supplier) return false

      const updatedData = { ...supplierData, updatedAt: new Date().toISOString() }

      if (isFirebaseConfigured()) {
        const success = await updateDocument(COLLECTIONS.SUPPLIERS, id, updatedData)
        if (!success) return false
      }

      setSuppliers((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updatedData } : s))
      )
      return true
    } catch (error) {
      console.error("Erro ao atualizar fornecedor:", error)
      return false
    }
  }

  const deleteSupplier = async (id: string): Promise<boolean> => {
    try {
      const supplier = suppliers.find((s) => s.id === id)
      if (!supplier) return false

      if (isFirebaseConfigured()) {
        const success = await deleteDocument(COLLECTIONS.SUPPLIERS, id)
        if (!success) return false
      }

      setSuppliers((prev) => prev.filter((s) => s.id !== id))
      return true
    } catch (error) {
      console.error("Erro ao deletar fornecedor:", error)
      return false
    }
  }

  const linkContractToSupplier = async (supplierId: string, contractId: string): Promise<boolean> => {
    const supplier = suppliers.find((s) => s.id === supplierId)
    if (!supplier) return false

    const contractIds = supplier.contractIds || []
    if (contractIds.includes(contractId)) return true

    return updateSupplier(supplierId, { contractIds: [...contractIds, contractId] })
  }

  const unlinkContractFromSupplier = async (supplierId: string, contractId: string): Promise<boolean> => {
    const supplier = suppliers.find((s) => s.id === supplierId)
    if (!supplier) return false

    const contractIds = supplier.contractIds || []
    return updateSupplier(supplierId, { contractIds: contractIds.filter((id) => id !== contractId) })
  }

  const getSupplierById = (id: string) => suppliers.find((s) => s.id === id)
  const getSupplierByCNPJ = (cnpj: string) => suppliers.find((s) => s.cnpj === cnpj)

  const refreshSuppliers = () => {
    loadFromFirestore()
  }

  return (
    <SuppliersContext.Provider
      value={{
        suppliers,
        isLoading,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        getSupplierById,
        getSupplierByCNPJ,
        linkContractToSupplier,
        unlinkContractFromSupplier,
        refreshSuppliers,
      }}
    >
      {children}
    </SuppliersContext.Provider>
  )
}

export function useSuppliers() {
  const context = useContext(SuppliersContext)
  if (!context) {
    throw new Error("useSuppliers deve ser usado dentro de um SuppliersProvider")
  }
  return context
}
