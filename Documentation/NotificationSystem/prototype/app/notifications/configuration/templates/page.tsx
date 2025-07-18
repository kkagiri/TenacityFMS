"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, FileText, Edit, Copy, Trash2, Eye, Mail, MessageSquare, MoreHorizontal } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const templates = [
  {
    id: 1,
    name: "Critical Tank Alert",
    description: "Template for critical tank level notifications",
    category: "Tank Monitoring",
    type: "Email",
    subject: "CRITICAL: {{tankName}} Level Alert - {{priority}}",
    content: `Dear {{recipientName}},

This is a critical alert from the FMS Notification System.

Alert Details:
- Tank: {{tankName}}
- Current Level: {{currentLevel}}%
- Threshold: {{threshold}}%
- Location: {{siteLocation}}
- Timestamp: {{timestamp}}

Immediate action is required. Please check the tank status and take appropriate measures.

Best regards,
FMS Notification System`,
    variables: ["tankName", "recipientName", "currentLevel", "threshold", "siteLocation", "timestamp", "priority"],
    usageCount: 45,
    lastUsed: "2024-01-28 14:30:00",
    status: "Active",
  },
  {
    id: 2,
    name: "Maintenance Reminder",
    description: "Template for scheduled maintenance notifications",
    category: "Maintenance",
    type: "Email",
    subject: "Maintenance Reminder: {{equipmentName}} - {{maintenanceType}}",
    content: `Hello {{recipientName}},

This is a reminder for scheduled maintenance on {{equipmentName}}.

Maintenance Details:
- Equipment: {{equipmentName}}
- Type: {{maintenanceType}}
- Scheduled Date: {{scheduledDate}}
- Location: {{location}}
- Estimated Duration: {{duration}}

Please ensure all necessary preparations are completed before the scheduled time.

Thank you,
FMS Maintenance System`,
    variables: ["recipientName", "equipmentName", "maintenanceType", "scheduledDate", "location", "duration"],
    usageCount: 23,
    lastUsed: "2024-01-28 13:15:00",
    status: "Active",
  },
  {
    id: 3,
    name: "Device Connection Alert",
    description: "Template for device connectivity issues",
    category: "Device Monitoring",
    type: "Email",
    subject: "Device Alert: {{deviceName}} Connection Issue",
    content: `Hi {{recipientName}},

We've detected a connection issue with one of your monitored devices.

Device Information:
- Device: {{deviceName}}
- Device ID: {{deviceId}}
- Last Communication: {{lastSeen}}
- Location: {{deviceLocation}}
- Status: {{deviceStatus}}

Please check the device connection and network status.

FMS Device Monitoring`,
    variables: ["recipientName", "deviceName", "deviceId", "lastSeen", "deviceLocation", "deviceStatus"],
    usageCount: 18,
    lastUsed: "2024-01-28 12:45:00",
    status: "Active",
  },
  {
    id: 4,
    name: "Daily System Report",
    description: "Template for daily system health reports",
    category: "System Reports",
    type: "Email",
    subject: "Daily System Report - {{reportDate}}",
    content: `Good morning {{recipientName}},

Here's your daily system health report for {{reportDate}}.

System Summary:
- Total Tanks Monitored: {{totalTanks}}
- Active Devices: {{activeDevices}}
- Notifications Sent: {{notificationCount}}
- System Uptime: {{uptime}}%
- Critical Alerts: {{criticalAlerts}}

{{#if criticalAlerts}}
Critical Issues Requiring Attention:
{{criticalIssuesList}}
{{/if}}

Have a great day!
FMS Reporting System`,
    variables: [
      "recipientName",
      "reportDate",
      "totalTanks",
      "activeDevices",
      "notificationCount",
      "uptime",
      "criticalAlerts",
      "criticalIssuesList",
    ],
    usageCount: 7,
    lastUsed: "2024-01-28 08:00:00",
    status: "Active",
  },
]

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<(typeof templates)[0] | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter
    const matchesType = typeFilter === "all" || template.type === typeFilter

    return matchesSearch && matchesCategory && matchesType
  })

  const previewTemplate = (template: (typeof templates)[0]) => {
    setSelectedTemplate(template)
    setIsPreviewOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground">Create and manage notification email templates</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Email Template</DialogTitle>
              <DialogDescription>Design a new email template for your notifications</DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList>
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="templateName">Template Name</Label>
                    <Input id="templateName" placeholder="Enter template name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="templateCategory">Category</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tank">Tank Monitoring</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="device">Device Monitoring</SelectItem>
                        <SelectItem value="system">System Reports</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="templateDescription">Description</Label>
                  <Input id="templateDescription" placeholder="Describe what this template is used for" />
                </div>
              </TabsContent>

              <TabsContent value="content" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emailSubject">Email Subject</Label>
                  <Input id="emailSubject" placeholder="Enter email subject with variables like {{variableName}}" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailContent">Email Content</Label>
                  <Textarea
                    id="emailContent"
                    rows={12}
                    placeholder="Enter your email template content here. Use {{variableName}} for dynamic content."
                  />
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Available Variables</h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <code>{"{{recipientName}}"}</code>
                    <code>{"{{timestamp}}"}</code>
                    <code>{"{{priority}}"}</code>
                    <code>{"{{tankName}}"}</code>
                    <code>{"{{deviceName}}"}</code>
                    <code>{"{{siteLocation}}"}</code>
                    <code>{"{{currentLevel}}"}</code>
                    <code>{"{{threshold}}"}</code>
                    <code>{"{{deviceStatus}}"}</code>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="space-y-4">
                <div className="border rounded-lg p-4 bg-white">
                  <div className="border-b pb-2 mb-4">
                    <p className="text-sm text-muted-foreground">Subject:</p>
                    <p className="font-medium">CRITICAL: Diesel Tank #3 Level Alert - Critical</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p>Dear John Smith,</p>
                    <p>This is a critical alert from the FMS Notification System.</p>
                    <p>
                      <strong>Alert Details:</strong>
                    </p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Tank: Diesel Tank #3</li>
                      <li>Current Level: 8%</li>
                      <li>Threshold: 10%</li>
                      <li>Location: Main Facility</li>
                      <li>Timestamp: 2024-01-28 14:30:00</li>
                    </ul>
                    <p>Immediate action is required. Please check the tank status and take appropriate measures.</p>
                    <p>
                      Best regards,
                      <br />
                      FMS Notification System
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsCreateOpen(false)}>Create Template</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Templates</p>
                <p className="text-2xl font-bold">{templates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Email Templates</p>
                <p className="text-2xl font-bold">{templates.filter((t) => t.type === "Email").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">SMS Templates</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Usage</p>
                <p className="text-2xl font-bold">{templates.reduce((sum, t) => sum + t.usageCount, 0)}</p>
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
                placeholder="Search templates..."
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
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Email">Email</SelectItem>
                <SelectItem value="SMS">SMS</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => previewTemplate(template)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Template
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{template.category}</Badge>
                  <Badge variant="secondary">{template.type}</Badge>
                  <Badge variant={template.status === "Active" ? "default" : "secondary"}>{template.status}</Badge>
                </div>

                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Subject:</span>
                    <p className="text-muted-foreground mt-1">{template.subject}</p>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Variables:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {template.variables.slice(0, 3).map((variable) => (
                        <code key={variable} className="text-xs bg-muted px-1 rounded">
                          {`{{${variable}}}`}
                        </code>
                      ))}
                      {template.variables.length > 3 && (
                        <span className="text-xs text-muted-foreground">+{template.variables.length - 3} more</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Used {template.usageCount} times</span>
                  <span>Last used: {template.lastUsed}</span>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => previewTemplate(template)}>
                    <Eye className="h-3 w-3 mr-1" />
                    Preview
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Preview: {selectedTemplate?.name}</DialogTitle>
            <DialogDescription>Preview how this template will appear in emails</DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-white">
                <div className="border-b pb-3 mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-muted-foreground">From:</p>
                      <p className="font-medium">FMS Notification System &lt;notifications@company.com&gt;</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">To:</p>
                      <p className="font-medium">john.smith@company.com</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm text-muted-foreground">Subject:</p>
                    <p className="font-medium">
                      {selectedTemplate.subject.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
                        const sampleData: Record<string, string> = {
                          tankName: "Diesel Tank #3",
                          priority: "Critical",
                          equipmentName: "Pump #7",
                          maintenanceType: "Scheduled Maintenance",
                          deviceName: "Sensor #15",
                          reportDate: "2024-01-28",
                        }
                        return sampleData[variable] || match
                      })}
                    </p>
                  </div>
                </div>

                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {selectedTemplate.content.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
                      const sampleData: Record<string, string> = {
                        recipientName: "John Smith",
                        tankName: "Diesel Tank #3",
                        currentLevel: "8",
                        threshold: "10",
                        siteLocation: "Main Facility",
                        timestamp: "2024-01-28 14:30:00",
                        priority: "Critical",
                        equipmentName: "Pump #7",
                        maintenanceType: "Scheduled Maintenance",
                        scheduledDate: "2024-01-29 09:00:00",
                        location: "Pump Station A",
                        duration: "2 hours",
                        deviceName: "Sensor #15",
                        deviceId: "SEN-015",
                        lastSeen: "45 minutes ago",
                        deviceLocation: "Tank Farm B",
                        deviceStatus: "Disconnected",
                        reportDate: "2024-01-28",
                        totalTanks: "12",
                        activeDevices: "45",
                        notificationCount: "23",
                        uptime: "99.2",
                        criticalAlerts: "2",
                      }
                      return sampleData[variable] || match
                    })}
                  </pre>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Template Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Category:</span>
                    <p className="font-medium">{selectedTemplate.category}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <p className="font-medium">{selectedTemplate.type}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Usage Count:</span>
                    <p className="font-medium">{selectedTemplate.usageCount}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last Used:</span>
                    <p className="font-medium">{selectedTemplate.lastUsed}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
