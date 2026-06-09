"use client"

import { useEffect, useRef } from "react"
import { useNotifications } from "@/lib/notifications-provider"

export default function NotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { notifications } = useNotifications()
  const prevCountRef = useRef(0)

  useEffect(() => {
    // Criar elemento de áudio
    if (!audioRef.current) {
      audioRef.current = new Audio("/notification-sound.mp3")
      audioRef.current.volume = 0.5
    }

    // Verificar se há novas notificações
    if (notifications.length > prevCountRef.current) {
      // Tocar som apenas se houver novas notificações
      try {
        audioRef.current.play().catch((error) => {
          // Lidar com erros de reprodução automática
          console.log("Reprodução automática bloqueada pelo navegador:", error)
        })
      } catch (error) {
        console.error("Erro ao reproduzir som de notificação:", error)
      }
    }

    // Atualizar contagem anterior
    prevCountRef.current = notifications.length

    // Limpar ao desmontar
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [notifications.length])

  // Este componente não renderiza nada visualmente
  return null
}
