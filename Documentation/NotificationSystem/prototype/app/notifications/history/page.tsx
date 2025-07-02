"use client"

import { Label } from "@/components/ui/label"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Download,
  Eye,
  RefreshCw,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Mail,
  Users,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const notifications = [
  {
    id: 1,
    title: "Tank Level Critical Alert",
    message: "Diesel Tank #3 level has dropped to 8% - immediate attention required",
    policy: "Tank Level Monitoring",
    priority: "Critical",
    status: "Delivered",
    timestamp: "2024-01-28 14:30:25",
    recipients: [
      { name: "John Smith", email: "john@company.com", status: "Delivered", readAt: "2024-01-28 14:31:15" },
      { name: "Sarah Johnson", email: "sarah@company.com", status: "Delivered", readAt: "2024-01-28 14:32:45" },
      { name: "Operations Team", email: "ops@company.com", status: "Delivered", readAt: null },
    ],
    deliveryAttempts: 1,
    deliveryTime: "1.2s",
    category: "Tank Monitoring",
    acknowledged: true,
    acknowledgedBy: "John Smith",
    acknowledgedAt: "2024-01-28 14:35:00",
  },
  {
    id: 2,
    title: "Pump Maintenance Reminder",
    message: "Pump #7 scheduled maintenance is due tomorrow at 09:00",
    policy: "Maintenance Alerts",
    priority: "Medium",
    status: "Delivered",
    timestamp: "2024-01-28 13:15:10",
    recipients: [
      { name: "Mike Wilson", email: "mike@company.com", status: "Delivered", readAt: "2024-01-28 13:16:30" },
      {
        name: "Maintenance Team",
        email: "maintenance@company.com",
        status: "Delivered",
        readAt: "2024-01-28 13:20:15",
      },
    ],
    deliveryAttempts: 1,
    deliveryTime: "0.8s",
    category: "Maintenance",
    acknowledged: false,
    acknowledgedBy: null,
    acknowledgedAt: null,
  },
  {
    id: 3,
    title: "Device Connection Lost",
    message: "Sensor #15 has lost connection - last reading 45 minutes ago",
    policy: "Device Monitoring",
    priority: "High",
    status: "Failed",
    timestamp: "2024-01-28 12:45:33",
    recipients: [
      { name: "IT Support", email: "support@company.com", status: "Failed", readAt: null },
      { name: "John Smith", email: "john@company.com", status: "Delivered", readAt: "2024-01-28 12:50:15" },
    ],
    deliveryAttempts: 3,
    deliveryTime: "Failed",
    category: "Device Monitoring",
    acknowledged: false,
    acknowledgedBy: null,
    acknowledgedAt: null,
    errorMessage: "SMTP server timeout - recipient server not responding",
  },
  {
    id: 4,
    title: "Daily System Report",
    message: "System health report for January 28, 2024 - All systems operational",
    policy: "System Reports",
    priority: "Low",
    status: "Delivered",
    timestamp: "2024-01-28 08:00:00",
    recipients: [
      { name: "Management Team", email: "management@company.com", status: "Delivered", readAt: "2024-01-28 08:15:30" },
      { name: "Operations Team", email: "ops@company.com", status: "Delivered", readAt: "2024-01-28 08:30:45" },
    ],
    deliveryAttempts: 1,
    deliveryTime: "2.1s",
    category: "System Reports",
    acknowledged: true,
    acknowledgedBy: "Management Team",
    acknowledgedAt: "2024-01-28 08:45:00",
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
    case "delivered":
      return "bg-green-100 text-green-800 border-green-200"
    case "failed":
      return "bg-red-100 text-red-800 border-red-200"
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case "delivered":
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case "failed":
      return <XCircle className="h-4 w-4 text-red-600" />
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-600" />
    default:
      return <AlertTriangle className="h-4 w-4 text-gray-600" />
  }
}

export default function NotificationHistory() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [dateRange, setDateRange] = useState("today")
  const [selectedNotification, setSelectedNotification] = useState<(typeof notifications)[0] | null>(null)

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.policy.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || notification.status.toLowerCase() === statusFilter
    const matchesPriority = priorityFilter === "all" || notification.priority.toLowerCase() === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  const exportData = () => {
    // Simulate export functionality
    alert("Exporting notification history data...")
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notification History</h1>
          <p className="text-muted-foreground">View and analyze past notification activity</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Sent</p>
                <p className="text-2xl font-bold">{notifications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Delivered</p>
                <p className="text-2xl font-bold">{notifications.filter((n) => n.status === "Delivered").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold">{notifications.filter((n) => n.status === "Failed").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Acknowledged</p>
                <p className="text-2xl font-bold">{notifications.filter((n) => n.acknowledged).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 days</SelectItem>
                <SelectItem value="month">Last 30 days</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Notification History</CardTitle>
          <CardDescription>
            Showing {filteredNotifications.length} of {notifications.length} notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div key={notification.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(notification.status)}
                      <h4 className="font-medium">{notification.title}</h4>
                      <Badge className={getPriorityColor(notification.priority)}>{notification.priority}</Badge>
                      <Badge className={getStatusColor(notification.status)}>{notification.status}</Badge>
                      {notification.acknowledged && (
                        <Badge variant="outline" className="text-green-600 border-green-200">
                          Acknowledged
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">{notification.message}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-muted-foreground">
                      <div>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {notification.timestamp}
                        </span>
                      </div>
                      <div>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {notification.recipients.length} recipients
                        </span>
                      </div>
                      <div>
                        <span>Policy: {notification.policy}</span>
                      </div>
                      <div>
                        <span>Delivery: {notification.deliveryTime}</span>
                      </div>
                    </div>

                    {notification.errorMessage && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                        <strong>Error:</strong> {notification.errorMessage}
                      </div>
                    )}
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setSelectedNotification(notification)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Notification Details</DialogTitle>
                        <DialogDescription>Complete information about this notification</DialogDescription>
                      </DialogHeader>

                      {selectedNotification && (
                        <Tabs defaultValue="overview" className="w-full">
                          <TabsList>
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="recipients">Recipients</TabsTrigger>
                            <TabsTrigger value="content">Content</TabsTrigger>
                            <TabsTrigger value="delivery">Delivery Log</TabsTrigger>
                          </TabsList>

                          <TabsContent value="overview" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">Title</Label>
                                <p className="text-sm">{selectedNotification.title}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Policy</Label>
                                <p className="text-sm">{selectedNotification.policy}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Priority</Label>
                                <Badge className={getPriorityColor(selectedNotification.priority)}>
                                  {selectedNotification.priority}
                                </Badge>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Status</Label>
                                <Badge className={getStatusColor(selectedNotification.status)}>
                                  {selectedNotification.status}
                                </Badge>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Timestamp</Label>
                                <p className="text-sm">{selectedNotification.timestamp}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Delivery Time</Label>
                                <p className="text-sm">{selectedNotification.deliveryTime}</p>
                              </div>
                            </div>

                            {selectedNotification.acknowledged && (
                              <div className="p-3 bg-green-50 border border-green-200 rounded">
                                <p className="text-sm text-green-800">
                                  <strong>Acknowledged by:</strong> {selectedNotification.acknowledgedBy} at{" "}
                                  {selectedNotification.acknowledgedAt}
                                </p>
                              </div>
                            )}
                          </TabsContent>

                          <TabsContent value="recipients" className="space-y-4">
                            <div className="space-y-3">
                              {selectedNotification.recipients.map((recipient, index) => (
                                <div key={index} className="flex items-center justify-between p-3 border rounded">
                                  <div>
                                    <p className="font-medium">{recipient.name}</p>
                                    <p className="text-sm text-muted-foreground">{recipient.email}</p>
                                  </div>
                                  <div className="text-right">
                                    <Badge className={getStatusColor(recipient.status)}>{recipient.status}</Badge>
                                    {recipient.readAt && (
                                      <p className="text-xs text-muted-foreground mt-1">Read: {recipient.readAt}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </TabsContent>

                          <TabsContent value="content" className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium">Message Content</Label>
                              <div className="mt-2 p-3 bg-muted rounded text-sm">{selectedNotification.message}</div>
                            </div>
                          </TabsContent>

                          <TabsContent value="delivery" className="space-y-4">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm">
                                  Notification triggered at {selectedNotification.timestamp}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm">Template processed successfully</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {selectedNotification.status === "Delivered" ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-600" />
                                )}
                                <span className="text-sm">
                                  Email delivery {selectedNotification.status.toLowerCase()} in{" "}
                                  {selectedNotification.deliveryTime}
                                </span>
                              </div>
                              {selectedNotification.deliveryAttempts > 1 && (
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                  <span className="text-sm">
                                    {selectedNotification.deliveryAttempts} delivery attempts made
                                  </span>
                                </div>
                              )}
                            </div>
                          </TabsContent>
                        </Tabs>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
