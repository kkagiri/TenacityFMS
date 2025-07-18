"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TestTube,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Mail,
  Settings,
  Play,
  RefreshCw,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

const testResults = [
  {
    id: 1,
    type: "Email Configuration",
    description: "SMTP connection test",
    status: "success",
    timestamp: "2024-01-28 15:30:00",
    duration: "1.2s",
    details: "Successfully connected to smtp.company.com:587 with TLS encryption",
  },
  {
    id: 2,
    type: "Policy Trigger",
    description: "Tank Level Critical Alert test",
    status: "success",
    timestamp: "2024-01-28 15:28:00",
    duration: "0.8s",
    details: "Policy triggered successfully, 3 notifications sent",
  },
  {
    id: 3,
    type: "Template Rendering",
    description: "Critical Alert template test",
    status: "success",
    timestamp: "2024-01-28 15:25:00",
    duration: "0.3s",
    details: "Template rendered successfully with all variables populated",
  },
  {
    id: 4,
    type: "Delivery Test",
    description: "Test notification to john@company.com",
    status: "failed",
    timestamp: "2024-01-28 15:20:00",
    duration: "30.0s",
    details: "Delivery failed: Recipient mailbox full",
  },
]

function getStatusIcon(status: string) {
  switch (status) {
    case "success":
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case "failed":
      return <XCircle className="h-4 w-4 text-red-600" />
    case "running":
      return <Clock className="h-4 w-4 text-yellow-600 animate-spin" />
    default:
      return <AlertTriangle className="h-4 w-4 text-gray-600" />
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "success":
      return "bg-green-100 text-green-800 border-green-200"
    case "failed":
      return "bg-red-100 text-red-800 border-red-200"
    case "running":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

export default function TestingPage() {
  const [testEmail, setTestEmail] = useState("admin@company.com")
  const [testMessage, setTestMessage] = useState("This is a test notification from the FMS system.")
  const [selectedPolicy, setSelectedPolicy] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [isRunningTest, setIsRunningTest] = useState(false)

  const runSystemTest = async () => {
    setIsRunningTest(true)
    // Simulate running comprehensive system test
    setTimeout(() => {
      setIsRunningTest(false)
      alert("System test completed! Check the results below.")
    }, 3000)
  }

  const sendTestEmail = async () => {
    // Simulate sending test email
    alert("Test email sent successfully!")
  }

  const testPolicy = async () => {
    // Simulate testing policy
    alert("Policy test initiated!")
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Testing & Troubleshooting</h1>
          <p className="text-muted-foreground">Test notification system components and troubleshoot issues</p>
        </div>
        <Button onClick={runSystemTest} disabled={isRunningTest}>
          {isRunningTest ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <TestTube className="h-4 w-4 mr-2" />
              Run System Test
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="email" className="space-y-4">
        <TabsList>
          <TabsTrigger value="email">Email Testing</TabsTrigger>
          <TabsTrigger value="policies">Policy Testing</TabsTrigger>
          <TabsTrigger value="templates">Template Testing</TabsTrigger>
          <TabsTrigger value="results">Test Results</TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Delivery Test
                </CardTitle>
                <CardDescription>Send a test email to verify delivery configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="testEmail">Recipient Email</Label>
                  <Input
                    id="testEmail"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="testSubject">Subject</Label>
                  <Input
                    id="testSubject"
                    defaultValue="FMS Notification System - Test Email"
                    placeholder="Email subject"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="testMessage">Message</Label>
                  <Textarea
                    id="testMessage"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    rows={4}
                    placeholder="Test message content"
                  />
                </div>

                <Button onClick={sendTestEmail} className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Send Test Email
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  SMTP Configuration Test
                </CardTitle>
                <CardDescription>Test SMTP server connection and authentication</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span className="text-sm">SMTP Server Connection</span>
                    <Badge className="bg-green-100 text-green-800 border-green-200">Connected</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded">
                    <span className="text-sm">Authentication</span>
                    <Badge className="bg-green-100 text-green-800 border-green-200">Verified</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded">
                    <span className="text-sm">SSL/TLS Encryption</span>
                    <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded">
                    <span className="text-sm">Port Accessibility</span>
                    <Badge className="bg-green-100 text-green-800 border-green-200">Open</Badge>
                  </div>
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>All SMTP configuration tests passed. Email delivery is ready.</AlertDescription>
                </Alert>

                <Button variant="outline" className="w-full bg-transparent">
                  <TestTube className="h-4 w-4 mr-2" />
                  Re-test Configuration
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="policies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Policy Testing</CardTitle>
              <CardDescription>Test notification policies with simulated data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="policySelect">Select Policy to Test</Label>
                  <Select value={selectedPolicy} onValueChange={setSelectedPolicy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a policy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tank-critical">Tank Level Critical Alert</SelectItem>
                      <SelectItem value="maintenance">Pump Maintenance Reminder</SelectItem>
                      <SelectItem value="device-failure">Device Connection Failure</SelectItem>
                      <SelectItem value="daily-report">Daily System Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="testData">Test Data</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select test scenario" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical Level (5%)</SelectItem>
                      <SelectItem value="low">Low Level (15%)</SelectItem>
                      <SelectItem value="normal">Normal Level (75%)</SelectItem>
                      <SelectItem value="custom">Custom Values</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Test Parameters</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="tankName" className="text-xs">
                      Tank Name
                    </Label>
                    <Input id="tankName" defaultValue="Diesel Tank #3" className="text-sm" />
                  </div>
                  <div>
                    <Label htmlFor="currentLevel" className="text-xs">
                      Current Level (%)
                    </Label>
                    <Input id="currentLevel" defaultValue="8" type="number" className="text-sm" />
                  </div>
                  <div>
                    <Label htmlFor="threshold" className="text-xs">
                      Threshold (%)
                    </Label>
                    <Input id="threshold" defaultValue="10" type="number" className="text-sm" />
                  </div>
                  <div>
                    <Label htmlFor="location" className="text-xs">
                      Location
                    </Label>
                    <Input id="location" defaultValue="Main Facility" className="text-sm" />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={testPolicy} disabled={!selectedPolicy}>
                  <Play className="h-4 w-4 mr-2" />
                  Test Policy
                </Button>
                <Button variant="outline">
                  <TestTube className="h-4 w-4 mr-2" />
                  Dry Run (No Notifications)
                </Button>
              </div>

              {selectedPolicy && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Testing this policy will send actual notifications to configured recipients. Use "Dry Run" to test
                    logic without sending emails.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Testing</CardTitle>
              <CardDescription>Test email templates with sample data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="templateSelect">Select Template to Test</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical-alert">Critical Tank Alert</SelectItem>
                    <SelectItem value="maintenance">Maintenance Reminder</SelectItem>
                    <SelectItem value="device-alert">Device Connection Alert</SelectItem>
                    <SelectItem value="daily-report">Daily System Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedTemplate && (
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <h4 className="font-medium mb-2">Template Preview</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Subject:</span>
                        <p className="text-muted-foreground">CRITICAL: Diesel Tank #3 Level Alert - Critical</p>
                      </div>
                      <div>
                        <span className="font-medium">Content Preview:</span>
                        <div className="mt-1 p-3 bg-white border rounded text-xs">
                          <p>Dear John Smith,</p>
                          <p>This is a critical alert from the FMS Notification System.</p>
                          <p>
                            <strong>Alert Details:</strong>
                          </p>
                          <p>- Tank: Diesel Tank #3</p>
                          <p>- Current Level: 8%</p>
                          <p>- Threshold: 10%</p>
                          <p>- Location: Main Facility</p>
                          <p>- Timestamp: 2024-01-28 14:30:00</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button>
                      <Send className="h-4 w-4 mr-2" />
                      Send Test Email
                    </Button>
                    <Button variant="outline">
                      <TestTube className="h-4 w-4 mr-2" />
                      Validate Template
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Results History</CardTitle>
              <CardDescription>Recent test executions and their results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testResults.map((result) => (
                  <div key={result.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <h4 className="font-medium">{result.type}</h4>
                        <p className="text-sm text-muted-foreground">{result.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{result.details}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(result.status)}>{result.status}</Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        <p>{result.timestamp}</p>
                        <p>Duration: {result.duration}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Health Check</CardTitle>
              <CardDescription>Overall system status and component health</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium">Email Service</h4>
                  <p className="text-sm text-green-600">Operational</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium">Policy Engine</h4>
                  <p className="text-sm text-green-600">Operational</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium">Template System</h4>
                  <p className="text-sm text-green-600">Operational</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <AlertTriangle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <h4 className="font-medium">SMS Service</h4>
                  <p className="text-sm text-yellow-600">Not Configured</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
