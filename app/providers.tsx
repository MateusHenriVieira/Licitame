"use client"

import type React from "react"

import { AuthProvider } from "@/lib/auth-provider"
import { ContractsProvider } from "@/lib/contracts-provider"
import { OrdersProvider } from "@/lib/orders-provider"
import { SuppliersProvider } from "@/lib/suppliers-provider"
import { ProductsProvider } from "@/lib/products-provider"
import { UsersProvider } from "@/lib/users-provider"
import { NotificationsProvider } from "@/lib/notifications-provider"
import { CostBaseProvider } from "@/lib/cost-base-provider"
import { ReportsProvider } from "@/lib/reports-provider"
import { Toaster } from "@/components/ui/toaster"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <UsersProvider>
        <SuppliersProvider>
          <ProductsProvider>
            <CostBaseProvider>
              <ContractsProvider>
                <OrdersProvider>
                  <NotificationsProvider>
                    <ReportsProvider>
                      {children}
                      <Toaster />
                    </ReportsProvider>
                  </NotificationsProvider>
                </OrdersProvider>
              </ContractsProvider>
            </CostBaseProvider>
          </ProductsProvider>
        </SuppliersProvider>
      </UsersProvider>
    </AuthProvider>
  )
}
