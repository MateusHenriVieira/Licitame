"use client"

import { useState } from "react"
import { useNotifications, type NotificationType } from "@/lib/notifications-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertTriangle,
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Info,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow, format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function NotificacoesPage() {
  const {
    notifications,
    pendingNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    getNotificationsByType,
  } = useNotifications()

  const router = useRouter()
  const [activeTab, setActiveTab] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterRead, setFilterRead] = useState<string>("all")

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case "expiration":
        return <Clock className="h-5 w-5 text-red-500" />
      case "order":
        return <ShoppingCart className="h-5 w-5 text-blue-500" />
      case "approval":
        return <FileText className="h-5 w-5 text-purple-500" />
      case "delivery":
        return <Calendar className="h-5 w-5 text-green-500" />
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return ""

    try {
      const date = new Date(dateString)
      return formatDistanceToNow(date, { addSuffix: true, locale: ptBR })
    } catch (error) {
      return ""
    }
  }

  const getFormattedDate = (dateString?: string) => {
    if (!dateString) return ""

    try {
      const date = new Date(dateString)
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    } catch (error) {
      return ""
    }
  }

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id)

    if (notification.link) {
      router.push(notification.link)
    }
  }

  // Filtrar notificações
  let filteredNotifications = activeTab === "all" ? notifications : notifications.filter((n) => n.type === activeTab)

  // Aplicar filtro de pesquisa
  if (searchTerm) {
    filteredNotifications = filteredNotifications.filter(
      (n) =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }

  // Aplicar filtro de tipo
  if (filterType !== "all") {
    filteredNotifications = filteredNotifications.filter((n) => n.type === filterType)
  }

  // Aplicar filtro de leitura
  if (filterRead === "read") {
    filteredNotifications = filteredNotifications.filter((n) => n.read)
  } else if (filterRead === "unread") {
    filteredNotifications = filteredNotifications.filter((n) => !n.read)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Notificações</h1>
          <p className="text-gray-500">Gerencie suas notificações e alertas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={markAllAsRead} disabled={pendingNotifications.length === 0}>
            <Check className="mr-2 h-4 w-4" />
            Marcar todas como lidas
          </Button>
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={clearAllNotifications}
            disabled={notifications.length === 0}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Limpar todas
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Todas as Notificações</CardTitle>
          <CardDescription>
            Você tem {notifications.length} notificações, sendo {pendingNotifications.length} não lidas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <TabsList>
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="order">Pedidos</TabsTrigger>
                <TabsTrigger value="approval">Aprovações</TabsTrigger>
                <TabsTrigger value="expiration">Contratos</TabsTrigger>
                <TabsTrigger value="warning">Alertas</TabsTrigger>
              </TabsList>

              <div className="flex flex-1 items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar notificações..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="order">Pedidos</SelectItem>
                    <SelectItem value="approval">Aprovações</SelectItem>
                    <SelectItem value="expiration">Contratos</SelectItem>
                    <SelectItem value="warning">Alertas</SelectItem>
                    <SelectItem value="delivery">Entregas</SelectItem>
                    <SelectItem value="success">Sucessos</SelectItem>
                    <SelectItem value="info">Informações</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterRead} onValueChange={setFilterRead}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status de leitura" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="read">Lidas</SelectItem>
                    <SelectItem value="unread">Não lidas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TabsContent value={activeTab} className="m-0">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="mb-2 h-12 w-12 text-gray-300" />
                  <h3 className="text-lg font-medium">Nenhuma notificação encontrada</h3>
                  <p className="text-sm text-gray-500">
                    Não há notificações que correspondam aos filtros selecionados.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex cursor-pointer gap-4 rounded-lg border p-4 transition-colors hover:bg-gray-50 ${
                        !notification.read ? "bg-blue-50 border-blue-200" : ""
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="mt-0.5 flex-shrink-0">{getIcon(notification.type)}</div>
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <h4 className="font-medium">{notification.title}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{getFormattedDate(notification.date)}</span>
                            <Badge variant={notification.read ? "outline" : "default"}>
                              {notification.read ? "Lida" : "Não lida"}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteNotification(notification.id)
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {notification.priority && (
                            <Badge
                              variant={
                                notification.priority === "high"
                                  ? "destructive"
                                  : notification.priority === "medium"
                                    ? "default"
                                    : "outline"
                              }
                            >
                              {notification.priority === "high"
                                ? "Alta Prioridade"
                                : notification.priority === "medium"
                                  ? "Média Prioridade"
                                  : "Baixa Prioridade"}
                            </Badge>
                          )}
                          <Badge variant="outline">{getTimeAgo(notification.date)}</Badge>
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsRead(notification.id)
                              }}
                            >
                              <Check className="mr-1 h-3 w-3" />
                              Marcar como lida
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
