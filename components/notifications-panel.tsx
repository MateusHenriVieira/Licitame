"use client"

import { useState, useEffect } from "react"
import { useNotifications, type NotificationType } from "@/lib/notifications-provider"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  AlertTriangle,
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Info,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function NotificationsPanel() {
  const {
    notifications,
    pendingNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    isPanelOpen,
    toggleNotificationsPanel,
    getUnreadCountByType,
  } = useNotifications()

  const router = useRouter()
  const [activeTab, setActiveTab] = useState<string>("all")

  // Fechar o painel quando clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const panel = document.getElementById("notifications-panel")
      if (
        panel &&
        !panel.contains(event.target as Node) &&
        !(event.target as Element).closest("#notifications-toggle")
      ) {
        if (isPanelOpen) {
          toggleNotificationsPanel()
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isPanelOpen, toggleNotificationsPanel])

  // Impedir rolagem do body quando o painel estiver aberto
  useEffect(() => {
    if (isPanelOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isPanelOpen])

  if (!isPanelOpen) return null

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

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id)

    if (notification.link) {
      router.push(notification.link)
      toggleNotificationsPanel()
    }
  }

  const filteredNotifications = activeTab === "all" ? notifications : notifications.filter((n) => n.type === activeTab)

  return (
    <div className="fixed inset-0 z-50 bg-black/50">
      <div
        id="notifications-panel"
        className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-lg animate-in slide-in-from-right"
      >
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Notificações</h2>
            {pendingNotifications.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingNotifications.length} não lidas
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={toggleNotificationsPanel}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b px-4">
            <TabsList className="w-full justify-start gap-4 rounded-none border-b-0 bg-transparent p-0">
              <TabsTrigger
                value="all"
                className="relative rounded-none border-b-2 border-transparent px-2 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Todas
                {getUnreadCountByType("warning") +
                  getUnreadCountByType("expiration") +
                  getUnreadCountByType("info") +
                  getUnreadCountByType("order") +
                  getUnreadCountByType("approval") +
                  getUnreadCountByType("delivery") +
                  getUnreadCountByType("success") >
                  0 && (
                  <Badge variant="destructive" className="ml-2">
                    {getUnreadCountByType("warning") +
                      getUnreadCountByType("expiration") +
                      getUnreadCountByType("info") +
                      getUnreadCountByType("order") +
                      getUnreadCountByType("approval") +
                      getUnreadCountByType("delivery") +
                      getUnreadCountByType("success")}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="order"
                className="relative rounded-none border-b-2 border-transparent px-2 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Pedidos
                {getUnreadCountByType("order") > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {getUnreadCountByType("order")}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="approval"
                className="relative rounded-none border-b-2 border-transparent px-2 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Aprovações
                {getUnreadCountByType("approval") > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {getUnreadCountByType("approval")}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="expiration"
                className="relative rounded-none border-b-2 border-transparent px-2 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Contratos
                {getUnreadCountByType("expiration") > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {getUnreadCountByType("expiration")}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex items-center justify-between border-b p-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={markAllAsRead}
              disabled={pendingNotifications.length === 0}
            >
              <Check className="mr-1 h-3 w-3" />
              Marcar todas como lidas
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-destructive hover:text-destructive"
              onClick={clearAllNotifications}
              disabled={notifications.length === 0}
            >
              <Trash2 className="mr-1 h-3 w-3" />
              Limpar todas
            </Button>
          </div>

          <TabsContent value={activeTab} className="m-0">
            <ScrollArea className="h-[calc(100vh-10rem)]">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="mb-2 h-12 w-12 text-gray-300" />
                  <h3 className="text-lg font-medium">Nenhuma notificação</h3>
                  <p className="text-sm text-gray-500">
                    Você não tem notificações {activeTab !== "all" ? "deste tipo" : ""} no momento.
                  </p>
                </div>
              ) : (
                <div className="space-y-1 p-1">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex cursor-pointer gap-3 rounded-lg p-3 transition-colors hover:bg-gray-100 ${
                        !notification.read ? "bg-blue-50" : ""
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="mt-0.5 flex-shrink-0">{getIcon(notification.type)}</div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium">{notification.title}</h4>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">{getTimeAgo(notification.date)}</span>
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
                        {notification.priority && (
                          <Badge
                            variant={
                              notification.priority === "high"
                                ? "destructive"
                                : notification.priority === "medium"
                                  ? "default"
                                  : "outline"
                            }
                            className="mt-1"
                          >
                            {notification.priority === "high"
                              ? "Alta Prioridade"
                              : notification.priority === "medium"
                                ? "Média Prioridade"
                                : "Baixa Prioridade"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
