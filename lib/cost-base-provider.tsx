"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { ValidationLogger } from "./validation/validation-logger"
import { validateObject, costBaseSchema } from "./validation/schemas"
import {
  isFirebaseConfigured,
  getAllDocuments,
  addDocument,
  updateDocument,
  deleteDocument,
  COLLECTIONS,
} from "@/lib/firebase"

export interface CostBase {
  id: string
  name: string
  company: string
  cnpj: string
  inscricaoEstadual?: string
  inscricaoMunicipal?: string
  address: string
  city: string
  state: string
  zipCode: string
  contactName: string
  contactEmail: string
  contactPhone: string
  category?: string
  observacoes?: string
  taxaAdministrativa?: number
  taxaImpostos?: number
  margemLucro?: number
  custoLogistica?: number
  custoOperacional?: number
  createdAt: Date
  updatedAt: Date
}

interface CostBaseContextType {
  costBases: CostBase[]
  isLoading: boolean
  addCostBase: (costBase: Omit<CostBase, "id" | "createdAt" | "updatedAt">) => Promise<boolean>
  updateCostBase: (id: string, costBase: Partial<CostBase>) => Promise<boolean>
  deleteCostBase: (id: string) => Promise<boolean>
  getCostBaseById: (id: string) => CostBase | undefined
  exportData: () => void
  importData: (data: CostBase[]) => Promise<boolean>
}

const CostBaseContext = createContext<CostBaseContextType | undefined>(undefined)

export function CostBaseProvider({ children }: { children: React.ReactNode }) {
  const [costBases, setCostBases] = useState<CostBase[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadFromFirestore()
  }, [])

  const loadFromFirestore = async () => {
    try {
      if (isFirebaseConfigured()) {
        const data = await getAllDocuments<CostBase>(COLLECTIONS.COST_BASES)
        const costBasesWithDates = data.map((cb) => ({
          ...cb,
          createdAt: cb.createdAt ? new Date(cb.createdAt) : new Date(),
          updatedAt: cb.updatedAt ? new Date(cb.updatedAt) : new Date(),
        }))
        setCostBases(costBasesWithDates)
        ValidationLogger.log({
          level: "success",
          dataType: "costBases",
          action: "load",
          message: `${costBasesWithDates.length} bases de custo carregadas do Firebase`,
          metadata: { count: costBasesWithDates.length },
        })
      }
    } catch (error) {
      ValidationLogger.log({
        level: "error",
        dataType: "costBases",
        action: "load",
        message: "Erro ao carregar dados do Firebase",
        metadata: { error: error instanceof Error ? error.message : String(error) },
      })
      setCostBases([])
    } finally {
      setIsLoading(false)
    }
  }

  const validateArray = (data: any[]): { valid: boolean; errors: string[] } => {
    const errors: string[] = []
    if (!Array.isArray(data)) return { valid: false, errors: ["Dados devem ser um array"] }
    data.forEach((item, index) => {
      const validation = validateObject(item, costBaseSchema)
      if (!validation.valid) {
        validation.errors.forEach((err) => errors.push(`Item ${index + 1} - ${err.field}: ${err.message}`))
      }
    })
    return { valid: errors.length === 0, errors }
  }

  const addCostBase = async (costBase: Omit<CostBase, "id" | "createdAt" | "updatedAt">): Promise<boolean> => {
    try {
      const newCostBase: CostBase = {
        ...costBase,
        id: `cb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const validation = validateObject(newCostBase, costBaseSchema)
      if (!validation.valid) return false

      if (isFirebaseConfigured()) {
        const { id, ...data } = newCostBase
        // Remove undefined fields to prevent Firebase errors
        const cleanedData = Object.fromEntries(
          Object.entries({
            ...data,
            createdAt: data.createdAt.toISOString(),
            updatedAt: data.updatedAt.toISOString(),
          }).filter(([, value]) => value !== undefined)
        )
        const firebaseId = await addDocument(COLLECTIONS.COST_BASES, cleanedData)
        if (firebaseId) {
          newCostBase.id = firebaseId
        } else {
          return false
        }
      }

      setCostBases((prev) => [...prev, newCostBase])
      return true
    } catch (error) {
      ValidationLogger.log({ level: "error", dataType: "costBases", action: "create", message: "Erro ao criar base de custo", metadata: { error: error instanceof Error ? error.message : String(error) } })
      return false
    }
  }

  const updateCostBase = async (id: string, updatedData: Partial<CostBase>): Promise<boolean> => {
    try {
      const index = costBases.findIndex((cb) => cb.id === id)
      if (index === -1) return false

      const updatedCostBase = { ...costBases[index], ...updatedData, updatedAt: new Date() }

      const validation = validateObject(updatedCostBase, costBaseSchema)
      if (!validation.valid) return false

      if (isFirebaseConfigured()) {
        // Remove undefined fields to prevent Firebase errors
        const cleanedData = Object.fromEntries(
          Object.entries({
            ...updatedData,
            updatedAt: new Date().toISOString(),
          }).filter(([, value]) => value !== undefined)
        )
        const success = await updateDocument(COLLECTIONS.COST_BASES, id, cleanedData)
        if (!success) return false
      }

      setCostBases((prev) => prev.map((cb) => (cb.id === id ? updatedCostBase : cb)))
      return true
    } catch (error) {
      ValidationLogger.log({ level: "error", dataType: "costBases", action: "update", message: "Erro ao atualizar base de custo", metadata: { error: error instanceof Error ? error.message : String(error), id } })
      return false
    }
  }

  const deleteCostBase = async (id: string): Promise<boolean> => {
    try {
      const costBase = costBases.find((cb) => cb.id === id)
      if (!costBase) return false

      if (isFirebaseConfigured()) {
        const success = await deleteDocument(COLLECTIONS.COST_BASES, id)
        if (!success) return false
      }

      setCostBases((prev) => prev.filter((cb) => cb.id !== id))
      return true
    } catch (error) {
      ValidationLogger.log({ level: "error", dataType: "costBases", action: "delete", message: "Erro ao excluir base de custo", metadata: { error: error instanceof Error ? error.message : String(error), id } })
      return false
    }
  }

  const getCostBaseById = (id: string) => costBases.find((cb) => cb.id === id)

  const exportData = () => {
    try {
      const dataStr = JSON.stringify(costBases, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `bases-custo-${new Date().toISOString().split("T")[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Erro ao exportar dados:", error)
    }
  }

  const importData = async (data: CostBase[]): Promise<boolean> => {
    try {
      const validationResult = validateArray(data)
      if (!validationResult.valid) return false

      const costBasesWithDates = data.map((cb) => ({
        ...cb,
        createdAt: new Date(cb.createdAt),
        updatedAt: new Date(cb.updatedAt),
      }))
      setCostBases(costBasesWithDates)
      return true
    } catch {
      return false
    }
  }

  return (
    <CostBaseContext.Provider
      value={{
        costBases,
        isLoading,
        addCostBase,
        updateCostBase,
        deleteCostBase,
        getCostBaseById,
        exportData,
        importData,
      }}
    >
      {children}
    </CostBaseContext.Provider>
  )
}

export function useCostBase() {
  const context = useContext(CostBaseContext)
  if (context === undefined) {
    throw new Error("useCostBase must be used within a CostBaseProvider")
  }
  return context
}
