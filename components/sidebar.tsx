"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-provider"
import { LucideContrast as FileContract, Home, Package, ShoppingCart, Users, BarChart, Building, Bell, DollarSign, Database } from "lucide-react"
import { useNotifications } from "@/lib/notifications-provider"
import { isFirebaseConfigured } from "@/lib/firebase"

export default function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { pendingNotifications } = useNotifications()
  const firebaseConnected = isFirebaseConfigured()

  const routes = [
    {
      label: "Dashboard",
      icon: Home,
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      label: "Contratos",
      icon: FileContract,
      href: "/dashboard/contratos",
      active: pathname?.startsWith("/dashboard/contratos"),
    },
    {
      label: "Pedidos",
      icon: ShoppingCart,
      href: "/dashboard/pedidos",
      active: pathname?.startsWith("/dashboard/pedidos"),
    },
    {
      label: "Base de Custo",
      icon: DollarSign,
      href: "/dashboard/base-custo",
      active: pathname?.startsWith("/dashboard/base-custo"),
    },
    {
      label: "Fornecedores",
      icon: Building,
      href: "/dashboard/fornecedores",
      active: pathname?.startsWith("/dashboard/fornecedores"),
    },
    {
      label: "Produtos",
      icon: Package,
      href: "/dashboard/produtos",
      active: pathname?.startsWith("/dashboard/produtos"),
    },
    {
      label: "Relatórios",
      icon: BarChart,
      href: "/dashboard/relatorios",
      active: pathname?.startsWith("/dashboard/relatorios"),
    },
    {
      label: "Notificações",
      icon: Bell,
      href: "/dashboard/notificacoes",
      active: pathname?.startsWith("/dashboard/notificacoes"),
      badge: pendingNotifications.length > 0 ? pendingNotifications.length.toString() : undefined,
    },
  ]

  // Adicionar rota de usuários apenas para administradores
  if (user?.role === "admin") {
    routes.push({
      label: "Usuários",
      icon: Users,
      href: "/dashboard/usuarios",
      active: pathname?.startsWith("/dashboard/usuarios"),
    })
  }

  return (
    <div className="flex h-full w-[80px] flex-col border-r bg-muted/40 md:w-[240px]">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <FileContract className="h-6 w-6" />
          <span className="hidden md:inline-flex">Gestão de Contratos</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 py-2">
        <nav className="grid gap-1 px-2">
          {routes.map((route, i) => (
            <Link
              key={i}
              href={route.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                route.active ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              )}
            >
              <route.icon className="h-5 w-5" />
              <span className="hidden md:inline-flex">{route.label}</span>
              {route.badge && (
                <div className="ml-auto rounded-full bg-destructive px-2 text-xs font-semibold text-destructive-foreground">
                  {route.badge}
                </div>
              )}
            </Link>
          ))}
        </nav>
      </ScrollArea>

      {/* Firebase Status */}
      <div className="border-t p-2">
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
            firebaseConnected ? "text-green-600" : "text-amber-600"
          )}
        >
          <Database className="h-5 w-5" />
          <span className="hidden md:inline-flex">
            {firebaseConnected ? "Firebase Conectado" : "Firebase Desconectado"}
          </span>
        </div>
      </div>
    </div>
  )
}
