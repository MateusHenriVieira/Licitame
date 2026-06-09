"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.push("/login")
  }, [router])

  // Renderiza uma página de carregamento enquanto o redirecionamento acontece
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
        <h1 className="text-2xl font-semibold text-primary">Carregando...</h1>
        <p className="text-muted-foreground">Redirecionando para o login</p>
      </div>
    </div>
  )
}
