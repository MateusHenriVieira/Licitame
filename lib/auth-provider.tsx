"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import {
  signIn,
  signUp,
  signOutUser,
  resetPassword as firebaseResetPassword,
  onAuthChange,
  isFirebaseConfigured,
  COLLECTIONS,
  addDocument,
  getDocumentById,
  queryDocuments,
} from "@/lib/firebase"

export type User = {
  id: string
  name: string
  email: string
  role: "admin" | "compras" | "visualizador"
  department: string
}

type AuthContextType = {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string, role: User["role"], department: string) => Promise<void>
  logout: () => void
  resetPassword: (email: string) => Promise<void>
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setIsLoading(false)
      return
    }

    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user profile from Firestore
        const profiles = await queryDocuments<User>(
          COLLECTIONS.USERS,
          "email",
          "==",
          firebaseUser.email
        )

        if (profiles.length > 0) {
          setUser(profiles[0])
        } else {
          // Fallback: create minimal user from Firebase Auth data
          setUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email || "Usuario",
            email: firebaseUser.email || "",
            role: firebaseUser.email === "admin@t.com" ? "admin" : "visualizador",
            department: "Geral",
          })
        }
      } else {
        setUser(null)
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    if (!isFirebaseConfigured()) {
      throw new Error("Firebase nao esta configurado. Adicione as variaveis de ambiente.")
    }

    try {
      await signIn(email, password)
      // onAuthChange will handle setting the user
    } catch (error: unknown) {
      const firebaseError = error as { code?: string }
      if (firebaseError.code === "auth/user-not-found" || firebaseError.code === "auth/wrong-password" || firebaseError.code === "auth/invalid-credential") {
        throw new Error("Credenciais invalidas. Verifique seu email e senha.")
      }
      if (firebaseError.code === "auth/too-many-requests") {
        throw new Error("Muitas tentativas. Tente novamente mais tarde.")
      }
      throw new Error("Erro ao fazer login. Tente novamente.")
    }
  }

  const register = async (
    email: string,
    password: string,
    name: string,
    role: User["role"],
    department: string
  ) => {
    if (!isFirebaseConfigured()) {
      throw new Error("Firebase nao esta configurado. Adicione as variaveis de ambiente.")
    }

    try {
      const credential = await signUp(email, password, name)

      // Save user profile in Firestore
      await addDocument(COLLECTIONS.USERS, {
        uid: credential.user.uid,
        name,
        email,
        role,
        department,
      })
      // onAuthChange will handle setting the user
    } catch (error: unknown) {
      const firebaseError = error as { code?: string }
      if (firebaseError.code === "auth/email-already-in-use") {
        throw new Error("Este email ja esta em uso.")
      }
      if (firebaseError.code === "auth/weak-password") {
        throw new Error("A senha deve ter pelo menos 6 caracteres.")
      }
      throw new Error("Erro ao criar conta. Tente novamente.")
    }
  }

  const logout = async () => {
    try {
      await signOutUser()
    } catch {
      // ignore
    }
    setUser(null)
    router.push("/login")
  }

  const resetPasswordHandler = async (email: string) => {
    if (!isFirebaseConfigured()) {
      throw new Error("Firebase nao esta configurado.")
    }
    try {
      await firebaseResetPassword(email)
    } catch (error: unknown) {
      const firebaseError = error as { code?: string }
      if (firebaseError.code === "auth/user-not-found") {
        throw new Error("Nenhuma conta encontrada com este email.")
      }
      throw new Error("Erro ao enviar email de recuperacao.")
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        resetPassword: resetPasswordHandler,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider")
  }
  return context
}
