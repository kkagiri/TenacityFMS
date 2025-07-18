"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Plus, Search, MoreHorizontal, Edit, Copy, Trash2, Shield, Users, Clock, AlertTriangle } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const policies = [
  {
    id: 1,
    name: "Tank Level Critical Alert",
    description: "Triggers when tank levels fall below critical thresholds",
    category: "Tank Monitoring",
    priority: "Critical",
    status: "Active",
    recipients: 8,
    lastTriggered: "2 hours ago",
    triggerCount: 15,
    rules: 3,
    createdBy: "John Smith",
    createdAt: "2024-01-15",
  },
  {
    id: 2,
    name: "Pump Maintenance Reminder",
    description: "Scheduled maintenance notifications for pump equipment",
    category: "Maintenance",
    priority: "Medium",
    status: "Active",
    recipients: 5,
    lastTriggered: "1 day ago",
    triggerCount: 8,
    rules: 2,
    createdBy: "Sarah Johnson",
    createdAt: "2024-01-10",
  },
  {
    id: 3,
    name: "Device Connection Failure",
    description: "Alerts when devices lose connection to the system",
    category: "Device Monitoring",
    priority: "High",
    status: "Active",
    recipients: 12,
    lastTriggered: "30 minutes ago",
    triggerCount: 42,
    rules: 4,
    createdBy: "Mike Wilson",
    createdAt: "2024-01-08",
  },
  {
    id: 4,
    name: "Daily System Report",
    description: "Automated daily system health and activity reports",
    category: "System Reports",
    priority: "Low",
    status: "Active",
    recipients: 3,
    lastTriggered: "6 hours ago",
    triggerCount: 30,
    rules: 1,
    createdBy: "Admin",
    createdAt: "2024-01-01",
  },
  {
    id: 5,
    name: "Emergency Shutdown Alert",
    description: "Critical alerts for emergency system shutdowns",
    category: "Emergency",
    priority: "Critical",
    status: "Inactive",
    recipients: 15,
    lastTriggered: "Never",
    triggerCount: 0,
    rules: 5,
    createdBy: "John Smith",
    createdAt: "2024-01-20",
  },
]

function getPriorityColor(priority: string) {
  switch (priority.toLowerCase()) {
    case "critical":
      return "bg-red-100 text-red-800 border-red-200"
    case "high":
      return "bg-orange-100 text-orange-800 border-orange-200"
    case "medium":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "low":
      return "bg-blue-100 text-blue-800 border-blue-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "active":
      return "bg-green-100 text-green-800 border-green-200"
    case "inactive":
      return "bg-gray-100 text-gray-800 border-gray-200"
    case "draft":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

export default function PoliciesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedPolicies, setSelectedPolicies] = useState<number[]>([])

  const filteredPolicies = policies.filter((policy) => {
    const matchesSearch =
      policy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || policy.category === categoryFilter
    const matchesStatus = statusFilter === "all" || policy.status.toLowerCase() === statusFilter

    return matchesSearch && matchesCategory && matchesStatus
  })

  const togglePolicyStatus = (policyId: number) => {
    // Simulate toggling policy status
    console.log(`Toggling policy ${policyId}`)
  }

  const handleBulkAction = (action: string) => {
    console.log(`Bulk action: ${action} on policies:`, selectedPolicies)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notification Policies</h1>
          <p className="text-muted-foreground">Manage and configure notification policies and rules</p>
        </div>
        <Button asChild>
          <Link href="/notifications/policies/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Policy
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Policies</p>
                <p className="text-2xl font-bold">{policies.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Active Policies</p>
                <p className="text-2xl font-bold">{policies.filter((p) => p.status === "Active").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Recipients</p>
                <p className="text-2xl font-bold">{policies.reduce((sum, p) => sum + p.recipients, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Recent Triggers</p>
                <p className="text-2xl font-bold">{policies.reduce((sum, p) => sum + p.triggerCount, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search policies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Tank Monitoring">Tank Monitoring</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Device Monitoring">Device Monitoring</SelectItem>
                <SelectItem value="System Reports">System Reports</SelectItem>
                <SelectItem value="Emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedPolicies.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{selectedPolicies.length} selected</span>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction("enable")}>
                Enable
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction("disable")}>
                Disable
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction("delete")}>
                Delete
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Policies List */}
      <div className="space-y-4">
        {filteredPolicies.map((policy) => (
          <Card key={policy.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{policy.name}</h3>
                    <Badge className={getPriorityColor(policy.priority)}>{policy.priority}</Badge>
                    <Badge className={getStatusColor(policy.status)}>{policy.status}</Badge>
                  </div>

                  <p className="text-muted-foreground mb-4">{policy.description}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Category:</span>
                      <p className="font-medium">{policy.category}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Recipients:</span>
                      <p className="font-medium flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {policy.recipients}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Triggered:</span>
                      <p className="font-medium">{policy.lastTriggered}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Trigger Count:</span>
                      <p className="font-medium">{policy.triggerCount}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                    <span>{policy.rules} rules configured</span>
                    <span>Created by {policy.createdBy}</span>
                    <span>Created on {policy.createdAt}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch checked={policy.status === "Active"} onCheckedChange={() => togglePolicyStatus(policy.id)} />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/notifications/policies/${policy.id}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Policy
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate Policy
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Policy
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPolicies.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No policies found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || categoryFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your search criteria or filters."
                : "Get started by creating your first notification policy."}
            </p>
            <Button asChild>
              <Link href="/notifications/policies/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Policy
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
