"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, CheckCircle, XCircle, TrendingUp, AlertTriangle, Users, Activity, RefreshCw } from "lucide-react"

const stats = [
  {
    title: "Notifications Sent",
    value: "2,847",
    change: "+12%",
    changeType: "positive" as const,
    icon: Bell,
    period: "Last 24 hours",
  },
  {
    title: "Delivery Success Rate",
    value: "99.2%",
    change: "+0.3%",
    changeType: "positive" as const,
    icon: CheckCircle,
    period: "Last 24 hours",
  },
  {
    title: "Failed Deliveries",
    value: "23",
    change: "-8%",
    changeType: "positive" as const,
    icon: XCircle,
    period: "Last 24 hours",
  },
  {
    title: "Active Policies",
    value: "12",
    change: "+2",
    changeType: "neutral" as const,
    icon: Activity,
    period: "Current",
  },
]

const recentNotifications = [
  {
    id: 1,
    title: "Tank Level Critical Alert",
    message: "Diesel Tank #3 level below 10% threshold",
    priority: "Critical",
    timestamp: "2 minutes ago",
    status: "Delivered",
    recipients: 5,
    policy: "Tank Level Monitoring",
  },
  {
    id: 2,
    title: "Pump Maintenance Reminder",
    message: "Pump #7 scheduled maintenance due tomorrow",
    priority: "Medium",
    timestamp: "15 minutes ago",
    status: "Delivered",
    recipients: 3,
    policy: "Maintenance Alerts",
  },
  {
    id: 3,
    title: "System Health Check",
    message: "Daily system health report generated",
    priority: "Low",
    timestamp: "1 hour ago",
    status: "Delivered",
    recipients: 8,
    policy: "System Reports",
  },
  {
    id: 4,
    title: "Device Connection Lost",
    message: "Sensor #15 connection timeout detected",
    priority: "High",
    timestamp: "2 hours ago",
    status: "Failed",
    recipients: 4,
    policy: "Device Monitoring",
  },
]

const activeAlerts = [
  {
    id: 1,
    title: "SMTP Server Latency",
    description: "Email delivery experiencing delays",
    severity: "Warning",
    timestamp: "5 minutes ago",
    action: "Investigate",
  },
  {
    id: 2,
    title: "Policy Trigger Frequency",
    description: "Tank Alert policy triggered 15 times in last hour",
    severity: "Info",
    timestamp: "10 minutes ago",
    action: "Review",
  },
  {
    id: 3,
    title: "Recipient Acknowledgment",
    description: "3 critical alerts pending acknowledgment",
    severity: "Warning",
    timestamp: "20 minutes ago",
    action: "Escalate",
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

export default function NotificationDashboard() {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1000)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notification Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage your notification system</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <span
                  className={`mr-1 ${
                    stat.changeType === "positive"
                      ? "text-green-600"
                      : stat.changeType === "negative"
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {stat.change}
                </span>
                from {stat.period}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent">Recent Notifications</TabsTrigger>
          <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
              <CardDescription>Latest notification activity across all policies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentNotifications.map((notification) => (
                  <div key={notification.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{notification.title}</h4>
                        <Badge className={getPriorityColor(notification.priority)}>{notification.priority}</Badge>
                        <Badge className={getStatusColor(notification.status)}>{notification.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{notification.timestamp}</span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {notification.recipients} recipients
                        </span>
                        <span>Policy: {notification.policy}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active System Alerts</CardTitle>
              <CardDescription>Issues requiring attention or investigation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      <div>
                        <h4 className="font-medium">{alert.title}</h4>
                        <p className="text-sm text-muted-foreground">{alert.description}</p>
                        <span className="text-xs text-muted-foreground">{alert.timestamp}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{alert.severity}</Badge>
                      <Button size="sm">{alert.action}</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Performance</CardTitle>
                <CardDescription>Success rates over the last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-2" />
                    <p>Chart visualization would be implemented here</p>
                    <p className="text-sm">Showing 99.2% average success rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Policy Activity</CardTitle>
                <CardDescription>Most active notification policies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Tank Level Monitoring</span>
                    <span className="text-sm font-medium">847 notifications</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Device Health Checks</span>
                    <span className="text-sm font-medium">623 notifications</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Maintenance Alerts</span>
                    <span className="text-sm font-medium">412 notifications</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">System Reports</span>
                    <span className="text-sm font-medium">298 notifications</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
