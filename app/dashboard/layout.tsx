"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
import Sidebar from "@/components/sidebar"
import Header from "@/components/header"
import NotificationsModal from "@/components/notifications-modal"
import { useNotifications } from "@/lib/notifications-provider"
import { NavigationProgress } from "@/components/navigation-progress"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <DashboardContent>{children}</DashboardContent>
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { pendingNotifications, markAllAsRead } = useNotifications()
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    if (pendingNotifications.length > 0) {
      setShowNotifications(true)
    }
  }, [pendingNotifications])

  const handleCloseNotifications = () => {
    markAllAsRead()
    setShowNotifications(false)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <NavigationProgress />
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto bg-gray-50 p-4">{children}</main>
      </div>

      {showNotifications && pendingNotifications.length > 0 && (
        <NotificationsModal notifications={pendingNotifications} onClose={handleCloseNotifications} />
      )}
    </div>
  )
}
