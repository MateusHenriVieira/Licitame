"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { ValidationLogger } from "./validation/validation-logger"
import {
  isFirebaseConfigured,
  getAllDocuments,
  addDocument,
  updateDocument,
  deleteDocument,
  COLLECTIONS,
} from "@/lib/firebase"
import { onAuthChange } from "@/lib/firebase"

type User = {
  id: string
  name: string
  email: string
  role: "admin" | "manager" | "operator"
  status: "active" | "inactive"
  lastAccess: string
  avatar?: string
}

type UsersContextType = {
  users: User[]
  loading: boolean
  error: string | null
  getUser: (id: string) => User | undefined
  addUser: (user: Omit<User, "id">) => Promise<boolean>
  updateUser: (id: string, user: Partial<User>) => Promise<boolean>
  deleteUser: (id: string) => Promise<boolean>
  exportData: () => void
  importData: (data: User[]) => Promise<boolean>
}

const UsersContext = createContext<UsersContextType | undefined>(undefined)

export function UsersProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadFromFirestore()
  }, [])

  const loadFromFirestore = async () => {
    try {
      if (isFirebaseConfigured()) {
        const data = await getAllDocuments<User>(COLLECTIONS.USERS)
        setUsers(data)
        ValidationLogger.log(
          "info", // level
          "users", // dataType
          "load", // action
          { valid: true, errors: [], warnings: [] }, // report
          `${data.length} usuarios carregados do Firebase`, // message
          undefined, // userId
          { count: data.length } // metadata
        )
      }
    } catch (err) {
      setError("Erro ao carregar usuarios")
      ValidationLogger.log(
        "error", // level
        "users", // dataType
        "load", // action
        { valid: false, errors: [{ field: "unknown", message: err instanceof Error ? err.message : String(err) }], warnings: [] }, // report
        "Erro ao carregar usuarios", // message
        undefined, // userId
        { error: err instanceof Error ? err.message : String(err) } // metadata
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (user && user.email === "admin@t.com") {
        setUsers((prevUsers) => {
          const isAdminExists = prevUsers.some((u) => u.email === "admin@t.com")
          if (!isAdminExists) {
            return [
              ...prevUsers,
              {
                id: user.uid,
                name: "Admin",
                email: user.email || "",
                role: "admin",
                status: "active",
                lastAccess: new Date().toISOString(),
              } as User,
            ]
          }
          return prevUsers
        })
      }
    })

    return () => unsubscribe()
  }, [])

  const getUser = (id: string) => users.find((user) => user.id === id)

  const addUser = async (user: Omit<User, "id">): Promise<boolean> => {
    try {
      if (isFirebaseConfigured()) {
        const firebaseId = await addDocument(COLLECTIONS.USERS, user)
        if (firebaseId) {
          setUsers((prev) => [...prev, { ...user, id: firebaseId }])
          return true
        }
        return false
      }

      const localId = `user_${Date.now()}`
      setUsers((prev) => [...prev, { ...user, id: localId }])
      return true
    } catch (error) {
      ValidationLogger.log(
        "error", // level
        "users", // dataType
        "create", // action
        { valid: false, errors: [{ field: "unknown", message: error instanceof Error ? error.message : String(error) }], warnings: [] }, // report
        "Erro ao criar usuario", // message
        undefined, // userId
        { error: error instanceof Error ? error.message : String(error) } // metadata
      )
      return false
    }
  }

  const updateUser = async (id: string, updatedUser: Partial<User>): Promise<boolean> => {
    try {
      const index = users.findIndex((u) => u.id === id)
      if (index === -1) return false

      if (isFirebaseConfigured()) {
        await updateDocument(COLLECTIONS.USERS, id, updatedUser)
      }

      setUsers((prev) => prev.map((user) => (user.id === id ? { ...user, ...updatedUser } : user)))
      return true
    } catch (error) {
      ValidationLogger.log(
        "error", // level
        "users", // dataType
        "update", // action
        { valid: false, errors: [{ field: "unknown", message: error instanceof Error ? error.message : String(error) }], warnings: [] }, // report
        "Erro ao atualizar usuario", // message
        id, // userId
        { error: error instanceof Error ? error.message : String(error) } // metadata
      )
      return false
    }
  }

  const deleteUser = async (id: string): Promise<boolean> => {
    try {
      const user = users.find((u) => u.id === id)
      if (!user) return false

      if (isFirebaseConfigured()) {
        await deleteDocument(COLLECTIONS.USERS, id)
      }

      setUsers((prev) => prev.filter((u) => u.id !== id))
      return true
    } catch (error) {
      ValidationLogger.log(
        "error", // level
        "users", // dataType
        "delete", // action
        { valid: false, errors: [{ field: "unknown", message: error instanceof Error ? error.message : String(error) }], warnings: [] }, // report
        "Erro ao excluir usuario", // message
        id, // userId
        { error: error instanceof Error ? error.message : String(error) } // metadata
      )
      return false
    }
  }

  const exportData = () => {
    try {
      const dataStr = JSON.stringify(users, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `usuarios-${new Date().toISOString().split("T")[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Erro ao exportar usuarios:", error)
    }
  }

  const importData = async (data: User[]): Promise<boolean> => {
    try {
      setUsers(data)
      return true
    } catch {
      return false
    }
  }

  return (
    <UsersContext.Provider
      value={{
        users,
        loading,
        error,
        getUser,
        addUser,
        updateUser,
        deleteUser,
        exportData,
        importData,
      }}
    >
      {children}
    </UsersContext.Provider>
  )
}

export function useUsers() {
  const context = useContext(UsersContext)
  if (context === undefined) {
    throw new Error("useUsers must be used within a UsersProvider")
  }
  return context
}
