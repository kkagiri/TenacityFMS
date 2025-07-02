import type React from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { NotificationSidebar } from "@/components/notification-sidebar"

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <NotificationSidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </SidebarProvider>
  )
}
