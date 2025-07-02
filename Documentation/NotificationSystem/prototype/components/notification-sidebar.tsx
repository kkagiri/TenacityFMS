"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bell,
  Settings,
  Users,
  History,
  BarChart3,
  FileText,
  TestTube,
  Mail,
  Shield,
  Home,
  Plus,
  Search,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

const navigationItems = [
  {
    title: "Dashboard",
    url: "/notifications/dashboard",
    icon: Home,
    badge: null,
  },
  {
    title: "Policies",
    url: "/notifications/policies",
    icon: Shield,
    badge: "12",
  },
  {
    title: "Recipients",
    url: "/notifications/recipients",
    icon: Users,
    badge: null,
  },
  {
    title: "History",
    url: "/notifications/history",
    icon: History,
    badge: "3",
  },
  {
    title: "Reports",
    url: "/notifications/reports",
    icon: BarChart3,
    badge: null,
  },
  {
    title: "Testing",
    url: "/notifications/testing",
    icon: TestTube,
    badge: null,
  },
]

const configurationItems = [
  {
    title: "Email Settings",
    url: "/notifications/configuration/email",
    icon: Mail,
  },
  {
    title: "Templates",
    url: "/notifications/configuration/templates",
    icon: FileText,
  },
  {
    title: "System Settings",
    url: "/notifications/configuration",
    icon: Settings,
  },
]

export function NotificationSidebar() {
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <Bell className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold">FMS Notifications</h2>
            <p className="text-sm text-muted-foreground">Management System</p>
          </div>
        </div>
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </div>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Configuration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {configurationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/notifications/policies/create">
                    <Plus className="h-4 w-4" />
                    <span>Create Policy</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="text-xs text-muted-foreground">
          <div>
            System Status: <span className="text-green-600 font-medium">Online</span>
          </div>
          <div>Last Update: 2 min ago</div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
