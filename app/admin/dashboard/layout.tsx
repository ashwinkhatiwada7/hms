import { SidebarProvider } from "@/components/ui/sidebar"
import React, { Suspense } from "react"
import { AdminShell } from "./_components/admin-shell"
import { AdminShellSkeleton } from "./_components/admin-shell-skeleton"

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <Suspense fallback={<AdminShellSkeleton />}>
        <AdminShell>{children}</AdminShell>
      </Suspense>
    </SidebarProvider>
  )
}
