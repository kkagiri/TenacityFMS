"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Save, TestTube, ArrowLeft, Shield, Users, Settings, Mail, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PolicyRule {
  id: string
  field: string
  operator: string
  value: string
  logicalOperator?: "AND" | "OR"
}

interface Recipient {
  id: string
  type: "user" | "group" | "role"
  name: string
  email?: string
  deliveryMethods: string[]
}

export default function CreatePolicyPage() {
  const router = useRouter()

  const [policyData, setPolicyData] = useState({
    name: "",
    description: "",
    category: "",
    priority: "Medium",
    isActive: true,
  })

  const [rules, setRules] = useState<PolicyRule[]>([
    { id: "1", field: "", operator: "", value: "", logicalOperator: "AND" },
  ])

  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState("")

  const addRule = () => {
    const newRule: PolicyRule = {
      id: Date.now().toString(),
      field: "",
      operator: "",
      value: "",
      logicalOperator: "AND",
    }
    setRules([...rules, newRule])
  }

  const removeRule = (ruleId: string) => {
    setRules(rules.filter((rule) => rule.id !== ruleId))
  }

  const updateRule = (ruleId: string, field: keyof PolicyRule, value: string) => {
    setRules(rules.map((rule) => (rule.id === ruleId ? { ...rule, [field]: value } : rule)))
  }

  const addRecipient = (recipient: Recipient) => {
    setRecipients([...recipients, recipient])
  }

  const removeRecipient = (recipientId: string) => {
    setRecipients(recipients.filter((r) => r.id !== recipientId))
  }

  const handleSave = (asDraft = false) => {
    // Simulate saving policy
    console.log("Saving policy:", { policyData, rules, recipients, asDraft })
    alert(`Policy ${asDraft ? "saved as draft" : "created"} successfully!`)
    router.push("/notifications/policies")
  }

  const handleTest = () => {
    // Simulate testing policy
    alert("Policy test initiated. Check your email for test notification.")
  }

  const availableFields = [
    { value: "tankLevel", label: "Tank Level (%)" },
    { value: "tankType", label: "Tank Type" },
    { value: "deviceStatus", label: "Device Status" },
    { value: "siteLocation", label: "Site Location" },
    { value: "timestamp", label: "Timestamp" },
    { value: "temperature", label: "Temperature" },
    { value: "pressure", label: "Pressure" },
  ]

  const operators = [
    { value: "equals", label: "Equals" },
    { value: "notEquals", label: "Not Equals" },
    { value: "greaterThan", label: "Greater Than" },
    { value: "lessThan", label: "Less Than" },
    { value: "contains", label: "Contains" },
    { value: "startsWith", label: "Starts With" },
  ]

  const availableUsers = [
    { id: "1", name: "John Smith", email: "john@company.com", type: "user" as const },
    { id: "2", name: "Sarah Johnson", email: "sarah@company.com", type: "user" as const },
    { id: "3", name: "Operations Team", email: "ops@company.com", type: "group" as const },
    { id: "4", name: "Maintenance Team", email: "maintenance@company.com", type: "group" as const },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create Notification Policy</h1>
            <p className="text-muted-foreground">Configure rules and recipients for automated notifications</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleSave(true)}>
            Save as Draft
          </Button>
          <Button onClick={handleTest} variant="outline">
            <TestTube className="h-4 w-4 mr-2" />
            Test Policy
          </Button>
          <Button onClick={() => handleSave(false)}>
            <Save className="h-4 w-4 mr-2" />
            Create Policy
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">Basic Information</TabsTrigger>
          <TabsTrigger value="rules">Rules & Conditions</TabsTrigger>
          <TabsTrigger value="recipients">Recipients</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Policy Information
              </CardTitle>
              <CardDescription>Basic configuration for your notification policy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Policy Name *</Label>
                  <Input
                    id="name"
                    value={policyData.name}
                    onChange={(e) => setPolicyData({ ...policyData, name: e.target.value })}
                    placeholder="Enter policy name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={policyData.category}
                    onValueChange={(value) => setPolicyData({ ...policyData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tank">Tank Monitoring</SelectItem>
                      <SelectItem value="pump">Pump Monitoring</SelectItem>
                      <SelectItem value="device">Device Monitoring</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="system">System Reports</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select
                    value={policyData.priority}
                    onValueChange={(value) => setPolicyData({ ...policyData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="status"
                      checked={policyData.isActive}
                      onCheckedChange={(checked) => setPolicyData({ ...policyData, isActive: checked })}
                    />
                    <Label htmlFor="status">{policyData.isActive ? "Active" : "Inactive"}</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={policyData.description}
                  onChange={(e) => setPolicyData({ ...policyData, description: e.target.value })}
                  placeholder="Describe what this policy does and when it should trigger"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Policy Templates</CardTitle>
              <CardDescription>Start with a pre-configured template or create from scratch</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  className="border rounded-lg p-4 cursor-pointer hover:bg-accent"
                  onClick={() => setSelectedTemplate("tank-alert")}
                >
                  <h4 className="font-medium mb-2">Tank Level Alert</h4>
                  <p className="text-sm text-muted-foreground">
                    Monitors tank levels and alerts when thresholds are exceeded
                  </p>
                  {selectedTemplate === "tank-alert" && <Badge className="mt-2">Selected</Badge>}
                </div>
                <div
                  className="border rounded-lg p-4 cursor-pointer hover:bg-accent"
                  onClick={() => setSelectedTemplate("device-failure")}
                >
                  <h4 className="font-medium mb-2">Device Failure</h4>
                  <p className="text-sm text-muted-foreground">Detects device malfunctions and connection issues</p>
                  {selectedTemplate === "device-failure" && <Badge className="mt-2">Selected</Badge>}
                </div>
                <div
                  className="border rounded-lg p-4 cursor-pointer hover:bg-accent"
                  onClick={() => setSelectedTemplate("maintenance")}
                >
                  <h4 className="font-medium mb-2">Maintenance Reminder</h4>
                  <p className="text-sm text-muted-foreground">Scheduled maintenance notifications and reminders</p>
                  {selectedTemplate === "maintenance" && <Badge className="mt-2">Selected</Badge>}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Policy Rules
              </CardTitle>
              <CardDescription>Define conditions that will trigger this notification policy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {rules.map((rule, index) => (
                <div key={rule.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Rule {index + 1}</h4>
                    {rules.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeRule(rule.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Field</Label>
                      <Select value={rule.field} onValueChange={(value) => updateRule(rule.id, "field", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableFields.map((field) => (
                            <SelectItem key={field.value} value={field.value}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Operator</Label>
                      <Select value={rule.operator} onValueChange={(value) => updateRule(rule.id, "operator", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select operator" />
                        </SelectTrigger>
                        <SelectContent>
                          {operators.map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Value</Label>
                      <Input
                        value={rule.value}
                        onChange={(e) => updateRule(rule.id, "value", e.target.value)}
                        placeholder="Enter value"
                      />
                    </div>

                    {index < rules.length - 1 && (
                      <div className="space-y-2">
                        <Label>Logic</Label>
                        <Select
                          value={rule.logicalOperator}
                          onValueChange={(value) => updateRule(rule.id, "logicalOperator", value as "AND" | "OR")}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AND">AND</SelectItem>
                            <SelectItem value="OR">OR</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <Button onClick={addRule} variant="outline" className="w-full bg-transparent">
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Rules are evaluated in order. Use AND for conditions that must all be true, OR for conditions where
                  any can be true.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recipients" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Notification Recipients
              </CardTitle>
              <CardDescription>Select who should receive notifications when this policy triggers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-base font-medium">Available Users & Groups</Label>
                  <div className="mt-2 space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2">
                    {availableUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-2 hover:bg-accent rounded">
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() =>
                            addRecipient({
                              ...user,
                              deliveryMethods: ["email"],
                            })
                          }
                          disabled={recipients.some((r) => r.id === user.id)}
                        >
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium">Selected Recipients ({recipients.length})</Label>
                  <div className="mt-2 space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2">
                    {recipients.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No recipients selected</p>
                    ) : (
                      recipients.map((recipient) => (
                        <div key={recipient.id} className="flex items-center justify-between p-2 bg-accent rounded">
                          <div>
                            <p className="font-medium">{recipient.name}</p>
                            <div className="flex gap-1 mt-1">
                              {recipient.deliveryMethods.map((method) => (
                                <Badge key={method} variant="secondary" className="text-xs">
                                  {method}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => removeRecipient(recipient.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  Recipients will receive notifications via their preferred delivery methods. You can configure
                  escalation chains in the Advanced Settings tab.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Templates</CardTitle>
              <CardDescription>Configure email and message templates for this policy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emailTemplate">Email Template</Label>
                <Select defaultValue="default-alert">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default-alert">Default Alert Template</SelectItem>
                    <SelectItem value="critical-alert">Critical Alert Template</SelectItem>
                    <SelectItem value="maintenance">Maintenance Template</SelectItem>
                    <SelectItem value="custom">Create Custom Template</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  defaultValue="FMS Alert: {{policyName}} - {{priority}}"
                  placeholder="Enter email subject with variables"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message Template</Label>
                <Textarea
                  id="message"
                  rows={6}
                  defaultValue={`Alert: {{policyName}}

Priority: {{priority}}
Triggered: {{timestamp}}
Location: {{siteLocation}}

Details:
{{ruleDetails}}

Please take appropriate action.

FMS Notification System`}
                  placeholder="Enter message template with variables"
                />
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Available Variables</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <code>{"{{policyName}}"}</code>
                  <code>{"{{priority}}"}</code>
                  <code>{"{{timestamp}}"}</code>
                  <code>{"{{siteLocation}}"}</code>
                  <code>{"{{tankName}}"}</code>
                  <code>{"{{deviceId}}"}</code>
                  <code>{"{{ruleDetails}}"}</code>
                  <code>{"{{recipientName}}"}</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Configure advanced policy behavior and escalation rules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Rate Limiting</h4>

                  <div className="space-y-2">
                    <Label htmlFor="maxPerHour">Max notifications per hour</Label>
                    <Input id="maxPerHour" type="number" defaultValue="10" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cooldown">Cooldown period (minutes)</Label>
                    <Input id="cooldown" type="number" defaultValue="15" />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="suppressDuplicates">Suppress duplicate notifications</Label>
                    <Switch id="suppressDuplicates" defaultChecked />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Escalation</h4>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="requireAck">Require acknowledgment</Label>
                    <Switch id="requireAck" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="escalationTime">Escalate after (minutes)</Label>
                    <Input id="escalationTime" type="number" defaultValue="30" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxEscalations">Max escalation levels</Label>
                    <Input id="maxEscalations" type="number" defaultValue="3" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Schedule & Timing</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="quietHours">Enable quiet hours</Label>
                    <Switch id="quietHours" />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="weekendsOnly">Weekends only</Label>
                    <Switch id="weekendsOnly" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quietStart">Quiet hours start</Label>
                    <Input id="quietStart" type="time" defaultValue="22:00" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quietEnd">Quiet hours end</Label>
                    <Input id="quietEnd" type="time" defaultValue="06:00" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
