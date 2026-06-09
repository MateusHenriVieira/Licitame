"use client"

import { useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertTriangle, Clock, Info } from "lucide-react"
import type { Notification } from "@/lib/notifications-provider"

interface NotificationsModalProps {
  notifications: Notification[]
  onClose: () => void
}

export default function NotificationsModal({ notifications, onClose }: NotificationsModalProps) {
  // Impedir rolagem do body quando o modal estiver aberto
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [])

  const getIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case "expiration":
        return <Clock className="h-5 w-5 text-red-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Notificações Importantes</DialogTitle>
          <DialogDescription>
            Você precisa confirmar que visualizou estas notificações para continuar.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] mt-4">
          <div className="space-y-4 pr-4">
            {notifications.map((notification) => (
              <div key={notification.id} className="flex gap-3 rounded-lg border p-4">
                <div className="mt-0.5">{getIcon(notification.type)}</div>
                <div className="space-y-1">
                  <h4 className="font-medium">{notification.title}</h4>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  {notification.date && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.date).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            Confirmar visualização
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
