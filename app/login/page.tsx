"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-provider"
import { FileCodeIcon as FileContract, ArrowLeft } from "lucide-react"

type ViewMode = "login" | "register" | "reset"

export default function LoginPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState<"admin" | "compras" | "visualizador">("visualizador")
  const [department, setDepartment] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()
  const { login, register, resetPassword } = useAuth()

  const resetForm = () => {
    setEmail("")
    setPassword("")
    setConfirmPassword("")
    setName("")
    setRole("visualizador")
    setDepartment("")
    setError("")
    setSuccess("")
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      await login(email, password)
      router.push("/dashboard")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (password !== confirmPassword) {
      setError("As senhas nao coincidem.")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.")
      setIsLoading(false)
      return
    }

    try {
      await register(email, password, name, role, department)
      router.push("/dashboard")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      await resetPassword(email)
      setSuccess("Email de recuperacao enviado! Verifique sua caixa de entrada.")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao enviar email.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <FileContract className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center text-balance">
            {viewMode === "login" && "Sistema de Gestao de Contratos"}
            {viewMode === "register" && "Criar Nova Conta"}
            {viewMode === "reset" && "Recuperar Senha"}
          </CardTitle>
          <CardDescription className="text-center">
            {viewMode === "login" && "Entre com suas credenciais para acessar o sistema"}
            {viewMode === "register" && "Preencha os dados para criar sua conta"}
            {viewMode === "reset" && "Informe seu email para receber o link de recuperacao"}
          </CardDescription>
        </CardHeader>

        {/* LOGIN */}
        {viewMode === "login" && (
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {error && <div className="bg-destructive/10 p-3 rounded-md text-destructive text-sm">{error}</div>}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => { resetForm(); setViewMode("reset") }}
              >
                Esqueceu sua senha?
              </button>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => { resetForm(); setViewMode("register") }}
              >
                Nao tem uma conta? <span className="text-primary font-medium">Criar conta</span>
              </button>
            </CardFooter>
          </form>
        )}

        {/* REGISTER */}
        {viewMode === "register" && (
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
              {error && <div className="bg-destructive/10 p-3 rounded-md text-destructive text-sm">{error}</div>}
              <div className="space-y-2">
                <Label htmlFor="reg-name">Nome Completo</Label>
                <Input
                  id="reg-name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-email">Email</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">Senha</Label>
                <Input
                  id="reg-password"
                  type="password"
                  placeholder="Minimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-confirm">Confirmar Senha</Label>
                <Input
                  id="reg-confirm"
                  type="password"
                  placeholder="Repita a senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-role">Perfil</Label>
                <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                  <SelectTrigger id="reg-role">
                    <SelectValue placeholder="Selecione o perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="compras">Compras</SelectItem>
                    <SelectItem value="visualizador">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-department">Departamento</Label>
                <Input
                  id="reg-department"
                  type="text"
                  placeholder="Ex: Compras, Financeiro"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Criando conta..." : "Criar Conta"}
              </Button>
              <button
                type="button"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => { resetForm(); setViewMode("login") }}
              >
                <ArrowLeft className="h-3 w-3" />
                Voltar para o login
              </button>
            </CardFooter>
          </form>
        )}

        {/* RESET PASSWORD */}
        {viewMode === "reset" && (
          <form onSubmit={handleResetPassword}>
            <CardContent className="space-y-4">
              {error && <div className="bg-destructive/10 p-3 rounded-md text-destructive text-sm">{error}</div>}
              {success && <div className="bg-green-50 p-3 rounded-md text-green-700 text-sm">{success}</div>}
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Enviando..." : "Enviar Link de Recuperacao"}
              </Button>
              <button
                type="button"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => { resetForm(); setViewMode("login") }}
              >
                <ArrowLeft className="h-3 w-3" />
                Voltar para o login
              </button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}
