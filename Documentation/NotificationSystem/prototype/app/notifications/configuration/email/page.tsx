"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, XCircle, Loader2, Mail, Server, Shield, TestTube, AlertCircle, Settings } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SMTPConfig {
  server: string
  port: string
  security: string
  username: string
  password: string
  fromAddress: string
  fromName: string
  replyTo: string
}

export default function EmailConfiguration() {
  const [config, setConfig] = useState<SMTPConfig>({
    server: "smtp.company.com",
    port: "587",
    security: "tls",
    username: "notifications@company.com",
    password: "",
    fromAddress: "notifications@company.com",
    fromName: "FMS Notification System",
    replyTo: "support@company.com",
  })

  const [testEmail, setTestEmail] = useState("admin@company.com")
  const [testMessage, setTestMessage] = useState(
    "This is a test email from the FMS Notification System. If you receive this message, your email configuration is working correctly.",
  )

  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
  const [testEmailStatus, setTestEmailStatus] = useState<"idle" | "sending" | "success" | "error">("idle")
  const [lastTestResult, setLastTestResult] = useState<string>("")

  const handleConfigChange = (field: keyof SMTPConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }))
  }

  const testConnection = async () => {
    setConnectionStatus("testing")
    // Simulate API call
    setTimeout(() => {
      if (config.server && config.port && config.username) {
        setConnectionStatus("success")
        setLastTestResult("Connection successful! SMTP server is reachable and authentication passed.")
      } else {
        setConnectionStatus("error")
        setLastTestResult("Connection failed: Please check your server settings and credentials.")
      }
    }, 2000)
  }

  const sendTestEmail = async () => {
    setTestEmailStatus("sending")
    // Simulate API call
    setTimeout(() => {
      if (testEmail && connectionStatus === "success") {
        setTestEmailStatus("success")
      } else {
        setTestEmailStatus("error")
      }
    }, 1500)
  }

  const saveConfiguration = () => {
    // Simulate save operation
    alert("Configuration saved successfully!")
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Configuration</h1>
          <p className="text-muted-foreground">Configure SMTP settings and email delivery options</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={connectionStatus === "success" ? "default" : "secondary"} className="flex items-center gap-1">
            {connectionStatus === "success" ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            {connectionStatus === "success" ? "Connected" : "Not Connected"}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="smtp" className="space-y-4">
        <TabsList>
          <TabsTrigger value="smtp">SMTP Configuration</TabsTrigger>
          <TabsTrigger value="testing">Testing & Validation</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="smtp" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Server Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Server Configuration
                </CardTitle>
                <CardDescription>Configure your SMTP server connection settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="server">SMTP Server *</Label>
                  <Input
                    id="server"
                    value={config.server}
                    onChange={(e) => handleConfigChange("server", e.target.value)}
                    placeholder="smtp.example.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="port">Port *</Label>
                    <Select value={config.port} onValueChange={(value) => handleConfigChange("port", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25">25 (Standard SMTP)</SelectItem>
                        <SelectItem value="587">587 (SMTP with STARTTLS)</SelectItem>
                        <SelectItem value="465">465 (SMTP over SSL)</SelectItem>
                        <SelectItem value="custom">Custom Port</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="security">Security</Label>
                    <Select value={config.security} onValueChange={(value) => handleConfigChange("security", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="ssl">SSL</SelectItem>
                        <SelectItem value="tls">TLS/STARTTLS</SelectItem>
                        <SelectItem value="auto">Auto-detect</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={testConnection}
                    disabled={connectionStatus === "testing" || !config.server || !config.port}
                    className="w-full"
                  >
                    {connectionStatus === "testing" ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Testing Connection...
                      </>
                    ) : (
                      <>
                        <TestTube className="h-4 w-4 mr-2" />
                        Test Connection
                      </>
                    )}
                  </Button>
                </div>

                {lastTestResult && (
                  <Alert
                    className={
                      connectionStatus === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                    }
                  >
                    {connectionStatus === "success" ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription className={connectionStatus === "success" ? "text-green-800" : "text-red-800"}>
                      {lastTestResult}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Authentication */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Authentication
                </CardTitle>
                <CardDescription>Configure authentication credentials for your SMTP server</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={config.username}
                    onChange={(e) => handleConfigChange("username", e.target.value)}
                    placeholder="your-email@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={config.password}
                    onChange={(e) => handleConfigChange("password", e.target.value)}
                    placeholder="Enter your password"
                  />
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Passwords are encrypted and stored securely. We recommend using app-specific passwords when
                    available.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Email Settings */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Settings
                </CardTitle>
                <CardDescription>Configure default email addresses and display settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromAddress">From Address *</Label>
                    <Input
                      id="fromAddress"
                      value={config.fromAddress}
                      onChange={(e) => handleConfigChange("fromAddress", e.target.value)}
                      placeholder="notifications@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fromName">From Display Name</Label>
                    <Input
                      id="fromName"
                      value={config.fromName}
                      onChange={(e) => handleConfigChange("fromName", e.target.value)}
                      placeholder="FMS Notifications"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="replyTo">Reply-To Address</Label>
                    <Input
                      id="replyTo"
                      value={config.replyTo}
                      onChange={(e) => handleConfigChange("replyTo", e.target.value)}
                      placeholder="support@example.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline">Reset to Defaults</Button>
            <Button onClick={saveConfiguration}>Save Configuration</Button>
          </div>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Testing</CardTitle>
              <CardDescription>Send test emails to verify your configuration is working correctly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="testEmail">Test Recipient Email</Label>
                  <Input
                    id="testEmail"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Test Email Status</Label>
                  <div className="flex items-center gap-2 p-2 border rounded">
                    {testEmailStatus === "success" && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {testEmailStatus === "error" && <XCircle className="h-4 w-4 text-red-600" />}
                    {testEmailStatus === "sending" && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span className="text-sm">
                      {testEmailStatus === "idle" && "Ready to send"}
                      {testEmailStatus === "sending" && "Sending test email..."}
                      {testEmailStatus === "success" && "Test email sent successfully"}
                      {testEmailStatus === "error" && "Failed to send test email"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="testMessage">Test Message</Label>
                <Textarea
                  id="testMessage"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  rows={4}
                />
              </div>

              <Button
                onClick={sendTestEmail}
                disabled={testEmailStatus === "sending" || !testEmail || connectionStatus !== "success"}
                className="w-full"
              >
                {testEmailStatus === "sending" ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending Test Email...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Test Email
                  </>
                )}
              </Button>

              {connectionStatus !== "success" && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please test and confirm your SMTP connection before sending test emails.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Advanced Settings
              </CardTitle>
              <CardDescription>Configure advanced email delivery and performance settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Performance Settings</h4>

                  <div className="space-y-2">
                    <Label htmlFor="timeout">Connection Timeout (seconds)</Label>
                    <Input id="timeout" defaultValue="30" type="number" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="retries">Retry Attempts</Label>
                    <Input id="retries" defaultValue="3" type="number" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="batchSize">Batch Size</Label>
                    <Input id="batchSize" defaultValue="50" type="number" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Security & Validation</h4>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="validateCerts">Validate SSL Certificates</Label>
                    <Switch id="validateCerts" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="enableLogging">Enable Detailed Logging</Label>
                    <Switch id="enableLogging" />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="rateLimiting">Enable Rate Limiting</Label>
                    <Switch id="rateLimiting" defaultChecked />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-4">Email Format Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="encoding">Character Encoding</Label>
                    <Select defaultValue="utf8">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="utf8">UTF-8</SelectItem>
                        <SelectItem value="ascii">ASCII</SelectItem>
                        <SelectItem value="iso">ISO-8859-1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="format">Default Format</Label>
                    <Select defaultValue="html">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="html">HTML</SelectItem>
                        <SelectItem value="text">Plain Text</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Default Priority</Label>
                    <Select defaultValue="normal">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
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
