
//Page


"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EnhancedOperatorDashboard } from "../components/enhanced-operator-dashboard"
import { EnhancedManagerDashboard } from "../components/enhanced-manager-dashboard"
import { EnhancedExecutiveDashboard } from "../components/enhanced-executive-dashboard"
import { PolicyManagement } from "../components/policy-management"
import { ExecutionMonitoring } from "../components/execution-monitoring"
import { DiscrepancyAnalysis } from "../components/discrepancy-analysis"
import { Settings, Users, BarChart3, AlertTriangle, Play, FileText } from "lucide-react"
import { SettingsPopup } from "../components/settings-popup"

export default function AutomatedReconciliationSystem() {
  const [userRole, setUserRole] = useState<"operator" | "manager" | "executive">("operator")
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Automated Reconciliation System</h1>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              System Healthy
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={userRole} onValueChange={(value: any) => setUserRole(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="operator">Operator View</SelectItem>
                <SelectItem value="manager">Manager View</SelectItem>
                <SelectItem value="executive">Executive View</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-transparent h-12">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="policies" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Policies</span>
            </TabsTrigger>
            <TabsTrigger value="executions" className="flex items-center space-x-2">
              <Play className="h-4 w-4" />
              <span>Executions</span>
            </TabsTrigger>
            <TabsTrigger value="discrepancies" className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Discrepancies</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          <div className="py-6">
            <TabsContent value="dashboard" className="mt-0">
              {userRole === "operator" && <EnhancedOperatorDashboard />}
              {userRole === "manager" && <EnhancedManagerDashboard />}
              {userRole === "executive" && <EnhancedExecutiveDashboard />}
            </TabsContent>

            <TabsContent value="policies" className="mt-0">
              <PolicyManagement />
            </TabsContent>

            <TabsContent value="executions" className="mt-0">
              <ExecutionMonitoring />
            </TabsContent>

            <TabsContent value="discrepancies" className="mt-0">
              <DiscrepancyAnalysis />
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <EnhancedExecutiveDashboard />
            </TabsContent>
          </div>
        </Tabs>
      </nav>
      <SettingsPopup isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  )
}
//
"use client"
//DiscrepancyAnalysis
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, TrendingUp, TrendingDown, Search, Filter, Eye, CheckCircle, RotateCcw } from "lucide-react"

export function DiscrepancyAnalysis() {
  const [searchTerm, setSearchTerm] = useState("")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const discrepancies = [
    {
      id: 5001,
      executionId: 1001,
      tankId: 101,
      tankName: "Fuel Tank A-1",
      siteId: 1,
      siteName: "Main Distribution Center",
      detectedDate: "2025-06-12T02:05:15Z",
      expectedVolume: 15750.0,
      actualVolume: 15625.5,
      varianceAmount: -124.5,
      variancePercentage: -0.79,
      severity: "Medium",
      trendAnalysis: {
        isRecurring: false,
        historicalPattern: "Stable",
        lastSimilarDiscrepancy: "2025-05-28T02:00:00Z",
        averageVariance: -15.2,
        varianceTrend: "Decreasing",
      },
      businessImpact: {
        estimatedCostImpact: 245.8,
        operationalRisk: "Low",
        complianceRisk: "None",
      },
      resolutionDetails: {
        isResolved: true,
        resolutionMethod: "AutomatedReconciliation",
        resolutionDate: "2025-06-12T02:06:45Z",
        newVolumeHistoryId: 98765,
      },
    },
    {
      id: 5002,
      executionId: 1002,
      tankId: 203,
      tankName: "Chemical Tank B-3",
      siteId: 2,
      siteName: "North Facility",
      detectedDate: "2025-06-12T01:45:22Z",
      expectedVolume: 8500.0,
      actualVolume: 8745.8,
      varianceAmount: 245.8,
      variancePercentage: 2.89,
      severity: "High",
      trendAnalysis: {
        isRecurring: true,
        historicalPattern: "Increasing",
        lastSimilarDiscrepancy: "2025-06-10T01:45:00Z",
        averageVariance: 185.3,
        varianceTrend: "Increasing",
      },
      businessImpact: {
        estimatedCostImpact: 1245.6,
        operationalRisk: "Medium",
        complianceRisk: "Low",
      },
      resolutionDetails: {
        isResolved: false,
        resolutionMethod: null,
        resolutionDate: null,
        newVolumeHistoryId: null,
      },
    },
    {
      id: 5003,
      executionId: 1001,
      tankId: 305,
      tankName: "Fuel Tank C-2",
      siteId: 3,
      siteName: "South Distribution",
      detectedDate: "2025-06-12T01:30:10Z",
      expectedVolume: 12000.0,
      actualVolume: 12045.2,
      varianceAmount: 45.2,
      variancePercentage: 0.38,
      severity: "Low",
      trendAnalysis: {
        isRecurring: false,
        historicalPattern: "Stable",
        lastSimilarDiscrepancy: "2025-06-05T02:00:00Z",
        averageVariance: 32.1,
        varianceTrend: "Stable",
      },
      businessImpact: {
        estimatedCostImpact: 89.4,
        operationalRisk: "Low",
        complianceRisk: "None",
      },
      resolutionDetails: {
        isResolved: true,
        resolutionMethod: "AutomatedReconciliation",
        resolutionDate: "2025-06-12T01:31:25Z",
        newVolumeHistoryId: 98766,
      },
    },
  ]

  const analytics = {
    totalDiscrepancies: 156,
    resolvedDiscrepancies: 152,
    averageResolutionTime: "00:01:45",
    severityDistribution: {
      Low: 89,
      Medium: 52,
      High: 13,
      Critical: 2,
    },
    trendSummary: {
      increasingTrend: 12,
      stableTrend: 134,
      decreasingTrend: 10,
    },
  }

  const filteredDiscrepancies = discrepancies.filter((discrepancy) => {
    const matchesSearch =
      discrepancy.tankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      discrepancy.siteName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSeverity =
      severityFilter === "all" || discrepancy.severity.toLowerCase() === severityFilter.toLowerCase()
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "resolved" && discrepancy.resolutionDetails.isResolved) ||
      (statusFilter === "unresolved" && !discrepancy.resolutionDetails.isResolved)

    return matchesSearch && matchesSeverity && matchesStatus
  })

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "Critical":
        return <Badge className="bg-red-100 text-red-800 border-red-200">{severity}</Badge>
      case "High":
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">{severity}</Badge>
      case "Medium":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">{severity}</Badge>
      case "Low":
        return <Badge className="bg-green-100 text-green-800 border-green-200">{severity}</Badge>
      default:
        return <Badge variant="secondary">{severity}</Badge>
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "Increasing":
        return <TrendingUp className="h-4 w-4 text-red-600" />
      case "Decreasing":
        return <TrendingDown className="h-4 w-4 text-green-600" />
      default:
        return <div className="h-4 w-4 bg-blue-600 rounded-full" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Discrepancy Analysis</h2>
          <p className="text-gray-600">Analyze and resolve tank volume discrepancies</p>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Discrepancies</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalDiscrepancies}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {((analytics.resolvedDiscrepancies / analytics.totalDiscrepancies) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.resolvedDiscrepancies} of {analytics.totalDiscrepancies} resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
            <RotateCcw className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{analytics.averageResolutionTime}</div>
            <p className="text-xs text-muted-foreground">Minutes:seconds</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Severity</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {analytics.severityDistribution.High + analytics.severityDistribution.Critical}
            </div>
            <p className="text-xs text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Severity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Severity Distribution</CardTitle>
            <CardDescription>Breakdown by discrepancy severity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(analytics.severityDistribution).map(([severity, count]) => (
              <div key={severity} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center space-x-2">
                    {getSeverityBadge(severity)}
                    <span>{severity}</span>
                  </span>
                  <span className="font-medium">{count}</span>
                </div>
                <Progress value={(count / analytics.totalDiscrepancies) * 100} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Trend Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Trend Analysis</CardTitle>
            <CardDescription>Discrepancy patterns over time</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">Increasing</p>
                  <p className="text-sm text-red-700">Worsening trends</p>
                </div>
              </div>
              <span className="text-lg font-bold text-red-600">{analytics.trendSummary.increasingTrend}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="h-5 w-5 bg-blue-600 rounded-full" />
                <div>
                  <p className="font-medium text-blue-900">Stable</p>
                  <p className="text-sm text-blue-700">Consistent patterns</p>
                </div>
              </div>
              <span className="text-lg font-bold text-blue-600">{analytics.trendSummary.stableTrend}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <TrendingDown className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Decreasing</p>
                  <p className="text-sm text-green-700">Improving trends</p>
                </div>
              </div>
              <span className="text-lg font-bold text-green-600">{analytics.trendSummary.decreasingTrend}</span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common analysis tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <AlertTriangle className="h-4 w-4 mr-2" />
              View Critical Discrepancies
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <TrendingUp className="h-4 w-4 mr-2" />
              Trend Analysis Report
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <RotateCcw className="h-4 w-4 mr-2" />
              Bulk Reconciliation
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Eye className="h-4 w-4 mr-2" />
              Export Analysis
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by tank or site..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="unresolved">Unresolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Discrepancy List */}
      <div className="space-y-4">
        {filteredDiscrepancies.map((discrepancy) => (
          <Card key={discrepancy.id}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                  <div className="flex items-center space-x-4">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <div>
                      <h3 className="text-lg font-semibold">{discrepancy.tankName}</h3>
                      <p className="text-sm text-gray-600">{discrepancy.siteName}</p>
                    </div>
                    {getSeverityBadge(discrepancy.severity)}
                    {discrepancy.resolutionDetails.isResolved ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Resolved
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        Unresolved
                      </Badge>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-3 w-3 mr-1" />
                      Details
                    </Button>
                    {!discrepancy.resolutionDetails.isResolved && (
                      <Button size="sm" variant="outline" className="text-blue-600">
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Reconcile
                      </Button>
                    )}
                  </div>
                </div>

                {/* Variance Information */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Expected Volume</p>
                    <p className="font-medium">{discrepancy.expectedVolume.toLocaleString()}L</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Actual Volume</p>
                    <p className="font-medium">{discrepancy.actualVolume.toLocaleString()}L</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Variance</p>
                    <p className={`font-medium ${discrepancy.varianceAmount < 0 ? "text-red-600" : "text-orange-600"}`}>
                      {discrepancy.varianceAmount > 0 ? "+" : ""}
                      {discrepancy.varianceAmount}L ({discrepancy.variancePercentage > 0 ? "+" : ""}
                      {discrepancy.variancePercentage}%)
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Cost Impact</p>
                    <p className="font-medium text-red-600">
                      ${discrepancy.businessImpact.estimatedCostImpact.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Trend Analysis */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getTrendIcon(discrepancy.trendAnalysis.varianceTrend)}
                    <div>
                      <p className="font-medium">Trend: {discrepancy.trendAnalysis.varianceTrend}</p>
                      <p className="text-sm text-gray-600">
                        {discrepancy.trendAnalysis.isRecurring ? "Recurring pattern detected" : "Isolated incident"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-gray-500">Avg Variance</p>
                    <p className="font-medium">{discrepancy.trendAnalysis.averageVariance}L</p>
                  </div>
                </div>

                {/* Resolution Details */}
                {discrepancy.resolutionDetails.isResolved && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-900">Resolution Details</span>
                    </div>
                    <div className="text-sm text-green-700">
                      <p>Method: {discrepancy.resolutionDetails.resolutionMethod}</p>
                      <p>Resolved: {new Date(discrepancy.resolutionDetails.resolutionDate!).toLocaleString()}</p>
                    </div>
                  </div>
                )}

                {/* Timestamp */}
                <div className="text-xs text-gray-500 pt-2 border-t">
                  Detected: {new Date(discrepancy.detectedDate).toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDiscrepancies.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No discrepancies found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
//
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, CheckCircle, Clock, Play, Pause, RotateCcw, XCircle } from "lucide-react"
import {
  type PolicyExecutionDTO,
  type ReconciliationDiscrepancyDTO,
  ReconciliationExecutionStatus,
  DiscrepancySeverity,
} from "../types/reconciliation-types"
import {
  getStatusDisplayName,
  getSeverityDisplayName,
  getStatusColor,
  getSeverityColor,
  formatDuration,
  formatDateTime,
} from "../utils/reconciliation-utils"

export function EnhancedOperatorDashboard() {
  // Sample data using the new DTOs
  const currentExecutions: PolicyExecutionDTO[] = [
    {
      id: 1001,
      policyId: 1,
      policyName: "Daily Tank Reconciliation",
      executionStartTime: "2025-06-12T02:00:00Z",
      executionEndTime: undefined,
      status: ReconciliationExecutionStatus.Running,
      tanksEvaluated: 35,
      discrepanciesDetected: 2,
      tanksReconciled: 2,
      reconciliationFailures: 0,
      totalVolumeVariance: -79.3,
      averagePercentageVariance: 0.8,
      executionDurationMs: 900000,
      errorMessage: undefined,
      executionResults: undefined,
      executionLog: undefined,
      discrepancies: [],
    },
    {
      id: 1002,
      policyId: 2,
      policyName: "Critical Tank Monitoring",
      executionStartTime: "2025-06-12T01:45:00Z",
      executionEndTime: undefined,
      status: ReconciliationExecutionStatus.Running,
      tanksEvaluated: 12,
      discrepanciesDetected: 1,
      tanksReconciled: 1,
      reconciliationFailures: 0,
      totalVolumeVariance: 45.2,
      averagePercentageVariance: 1.2,
      executionDurationMs: 420000,
      errorMessage: undefined,
      executionResults: undefined,
      executionLog: undefined,
      discrepancies: [],
    },
  ]

  const recentDiscrepancies: ReconciliationDiscrepancyDTO[] = [
    {
      id: 5001,
      policyExecutionId: 1001,
      tankId: 101,
      tankName: "Fuel Tank A-1",
      siteName: "Main Distribution Center",
      detectedAt: "2025-06-12T02:05:15Z",
      currentStock: 15625.5,
      expectedStock: 15750.0,
      absoluteVariance: -124.5,
      percentageVariance: -0.79,
      severity: DiscrepancySeverity.Medium,
      isResolved: false,
      resolvedAt: undefined,
      resolutionMethod: undefined,
      analysisNotes: undefined,
      trendAnalysis: "Stable pattern, within normal variance range",
      businessImpactScore: 245.8,
    },
    {
      id: 5002,
      policyExecutionId: 1002,
      tankId: 203,
      tankName: "Chemical Tank B-3",
      siteName: "North Facility",
      detectedAt: "2025-06-12T01:45:22Z",
      currentStock: 8745.8,
      expectedStock: 8500.0,
      absoluteVariance: 245.8,
      percentageVariance: 2.89,
      severity: DiscrepancySeverity.High,
      isResolved: false,
      resolvedAt: undefined,
      resolutionMethod: undefined,
      analysisNotes: undefined,
      trendAnalysis: "Increasing trend detected, requires investigation",
      businessImpactScore: 1245.6,
    },
    {
      id: 5003,
      policyExecutionId: 1000,
      tankId: 305,
      tankName: "Fuel Tank C-2",
      siteName: "South Distribution",
      detectedAt: "2025-06-12T01:30:10Z",
      currentStock: 12045.2,
      expectedStock: 12000.0,
      absoluteVariance: 45.2,
      percentageVariance: 0.38,
      severity: DiscrepancySeverity.Low,
      isResolved: true,
      resolvedAt: "2025-06-12T01:31:25Z",
      resolutionMethod: "AutomatedReconciliation",
      analysisNotes: "Minor variance within acceptable limits",
      trendAnalysis: "Stable",
      businessImpactScore: 89.4,
    },
  ]

  const completedExecutions: PolicyExecutionDTO[] = [
    {
      id: 1000,
      policyId: 1,
      policyName: "Daily Tank Reconciliation",
      executionStartTime: "2025-06-11T02:00:00Z",
      executionEndTime: "2025-06-11T02:15:32Z",
      status: ReconciliationExecutionStatus.Completed,
      tanksEvaluated: 47,
      discrepanciesDetected: 3,
      tanksReconciled: 3,
      reconciliationFailures: 0,
      totalVolumeVariance: 125.5,
      averagePercentageVariance: 1.2,
      executionDurationMs: 932000,
      errorMessage: undefined,
      executionResults: "Successfully reconciled all detected discrepancies",
      executionLog: undefined,
      discrepancies: [],
    },
    {
      id: 999,
      policyId: 3,
      policyName: "Weekend Emergency Monitoring",
      executionStartTime: "2025-06-10T18:00:00Z",
      executionEndTime: "2025-06-10T18:00:15Z",
      status: ReconciliationExecutionStatus.Failed,
      tanksEvaluated: 0,
      discrepanciesDetected: 0,
      tanksReconciled: 0,
      reconciliationFailures: 1,
      totalVolumeVariance: undefined,
      averagePercentageVariance: undefined,
      executionDurationMs: 15000,
      errorMessage: "Database connection timeout after 30 seconds",
      executionResults: undefined,
      executionLog: undefined,
      discrepancies: [],
    },
  ]

  const getStatusIcon = (status: ReconciliationExecutionStatus) => {
    switch (status) {
      case ReconciliationExecutionStatus.Completed:
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case ReconciliationExecutionStatus.Running:
        return <Play className="h-4 w-4 text-blue-600" />
      case ReconciliationExecutionStatus.Failed:
        return <XCircle className="h-4 w-4 text-red-600" />
      case ReconciliationExecutionStatus.Pending:
        return <Clock className="h-4 w-4 text-orange-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: ReconciliationExecutionStatus) => {
    const statusName = getStatusDisplayName(status)
    const colorClass = getStatusColor(status)

    return (
      <Badge
        className={`${colorClass.replace("text-", "bg-").replace("-600", "-100")} ${colorClass.replace("-600", "-800")} border-${colorClass.split("-")[1]}-200`}
      >
        {statusName}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently Running</CardTitle>
            <Play className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{currentExecutions.length}</div>
            <p className="text-xs text-muted-foreground">Active executions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {recentDiscrepancies.filter((d) => !d.isResolved).length}
            </div>
            <p className="text-xs text-muted-foreground">Unresolved discrepancies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {completedExecutions.filter((e) => e.status === ReconciliationExecutionStatus.Completed).length}
            </div>
            <p className="text-xs text-muted-foreground">Successful executions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Healthy</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Executions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Play className="h-5 w-5 text-blue-600" />
              <span>Current Executions</span>
            </CardTitle>
            <CardDescription>Real-time monitoring of active policy executions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentExecutions.map((execution) => {
              const progress =
                execution.tanksEvaluated > 0
                  ? Math.round((execution.tanksEvaluated / (execution.tanksEvaluated + 10)) * 100)
                  : 0

              return (
                <div key={execution.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{execution.policyName}</h4>
                    {getStatusBadge(execution.status)}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Tanks Evaluated: {execution.tanksEvaluated}</span>
                      <span>Discrepancies: {execution.discrepanciesDetected}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Reconciled: {execution.tanksReconciled}</span>
                      <span>Duration: {formatDuration(execution.executionDurationMs)}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Started: {formatDateTime(execution.executionStartTime)}</span>
                    {execution.totalVolumeVariance && (
                      <span>Volume Variance: {execution.totalVolumeVariance.toFixed(1)}L</span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Pause className="h-3 w-3 mr-1" />
                      Pause
                    </Button>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Recent Discrepancy Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span>Recent Discrepancy Alerts</span>
            </CardTitle>
            <CardDescription>Newly discovered discrepancies requiring attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentDiscrepancies.map((discrepancy) => (
              <div key={discrepancy.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{discrepancy.tankName}</h4>
                  <div className="flex space-x-2">
                    <Badge className={getSeverityColor(discrepancy.severity)}>
                      {getSeverityDisplayName(discrepancy.severity)}
                    </Badge>
                    {discrepancy.isResolved && (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Resolved
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600">{discrepancy.siteName}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Expected: </span>
                    <span className="font-medium">{discrepancy.expectedStock.toLocaleString()}L</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Actual: </span>
                    <span className="font-medium">{discrepancy.currentStock.toLocaleString()}L</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Variance: </span>
                    <span
                      className={`font-medium ${discrepancy.absoluteVariance < 0 ? "text-red-600" : "text-orange-600"}`}
                    >
                      {discrepancy.absoluteVariance > 0 ? "+" : ""}
                      {discrepancy.absoluteVariance}L ({discrepancy.percentageVariance > 0 ? "+" : ""}
                      {discrepancy.percentageVariance.toFixed(2)}%)
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Impact: </span>
                    <span className="font-medium text-red-600">
                      ${discrepancy.businessImpactScore?.toFixed(2) || "N/A"}
                    </span>
                  </div>
                </div>
                {discrepancy.trendAnalysis && (
                  <p className="text-xs text-gray-500 italic">{discrepancy.trendAnalysis}</p>
                )}
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Detected: {formatDateTime(discrepancy.detectedAt)}</span>
                  {discrepancy.resolvedAt && <span>Resolved: {formatDateTime(discrepancy.resolvedAt)}</span>}
                </div>
                {!discrepancy.isResolved && (
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      Investigate
                    </Button>
                    <Button size="sm" variant="outline">
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Reconcile
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Execution History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Execution History</CardTitle>
          <CardDescription>Latest policy execution results and performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {completedExecutions.map((execution) => (
              <div key={execution.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(execution.status)}
                  <div>
                    <h4 className="font-medium">{execution.policyName}</h4>
                    <p className="text-sm text-gray-600">
                      {execution.tanksEvaluated} tanks evaluated • {execution.discrepanciesDetected} discrepancies •{" "}
                      {execution.tanksReconciled} reconciled
                    </p>
                    {execution.errorMessage && <p className="text-sm text-red-600 mt-1">{execution.errorMessage}</p>}
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(execution.status)}
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDuration(execution.executionDurationMs)} • {formatDateTime(execution.executionStartTime)}
                  </p>
                  {execution.totalVolumeVariance && (
                    <p className="text-xs text-gray-500">
                      Volume Variance: {execution.totalVolumeVariance.toFixed(1)}L
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

//
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Settings,
  TrendingUp,
  TrendingDown,
  Activity,
  Plus,
  Edit,
  BarChart3,
  Clock,
  Target,
  Zap,
  Calendar,
} from "lucide-react"
import {
  type ReconciliationPolicyDTO,
  type PerformanceMetricsDTO,
  ReconciliationPolicyType,
} from "../types/reconciliation-types"
import {
  getPolicyTypeDisplayName,
  formatDateTime,
  formatDuration,
  calculateSuccessRate,
} from "../utils/reconciliation-utils"

export function EnhancedManagerDashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState("30days")
  const [selectedMetric, setSelectedMetric] = useState("success-rate")

  // Sample data using the new DTOs
  const policies: ReconciliationPolicyDTO[] = [
    {
      id: 1,
      name: "Daily Tank Reconciliation",
      description: "Automated reconciliation for all tanks daily at 2 AM",
      isActive: true,
      policyType: ReconciliationPolicyType.Scheduled,
      scheduleConfiguration: '{"type":"daily","time":"02:00:00"}',
      discrepancyThreshold: 5.0,
      discrepancyPercentageThreshold: 2.0,
      siteId: undefined,
      siteName: "All Sites",
      tankScopeConfiguration: '{"siteIds":[1,2,3],"minimumTankVolume":1000}',
      priority: 100,
      maxTanksPerExecution: 50,
      notificationConfiguration: '{"emailAddresses":["ops@company.com"],"enableSlackNotifications":true}',
      createdBy: "admin",
      createdOn: "2025-05-01T10:00:00Z",
      modifiedBy: "manager",
      modifiedOn: "2025-06-01T15:30:00Z",
      lastExecuted: "2025-06-12T02:00:00Z",
      nextExecution: "2025-06-13T02:00:00Z",
      totalExecutions: 45,
      successfulExecutions: 44,
      averageExecutionDurationMs: 932000,
      totalTanksReconciled: 2115,
    },
    {
      id: 2,
      name: "Critical Tank Monitoring",
      description: "High-frequency monitoring for critical tanks",
      isActive: true,
      policyType: ReconciliationPolicyType.Threshold,
      scheduleConfiguration: undefined,
      discrepancyThreshold: 25.0,
      discrepancyPercentageThreshold: 1.5,
      siteId: 1,
      siteName: "Main Distribution Center",
      tankScopeConfiguration: '{"siteIds":[1,3],"minimumTankVolume":5000,"criticalTanksOnly":true}',
      priority: 150,
      maxTanksPerExecution: 20,
      notificationConfiguration:
        '{"emailAddresses":["critical@company.com"],"enableSlackNotifications":true,"severityThreshold":"Medium"}',
      createdBy: "admin",
      createdOn: "2025-04-15T14:30:00Z",
      modifiedBy: "manager",
      modifiedOn: "2025-06-10T09:15:00Z",
      lastExecuted: "2025-06-12T01:45:00Z",
      nextExecution: undefined,
      totalExecutions: 156,
      successfulExecutions: 147,
      averageExecutionDurationMs: 420000,
      totalTanksReconciled: 1872,
    },
    {
      id: 3,
      name: "Weekend Emergency Monitoring",
      description: "Emergency monitoring during weekends",
      isActive: false,
      policyType: ReconciliationPolicyType.Hybrid,
      scheduleConfiguration: '{"type":"weekly","daysOfWeek":["Saturday","Sunday"],"time":"06:00:00"}',
      discrepancyThreshold: 15.0,
      discrepancyPercentageThreshold: 3.0,
      siteId: 2,
      siteName: "North Facility",
      tankScopeConfiguration: '{"siteIds":[2],"minimumTankVolume":2000}',
      priority: 200,
      maxTanksPerExecution: 15,
      notificationConfiguration: '{"emailAddresses":["weekend@company.com"]}',
      createdBy: "manager",
      createdOn: "2025-03-20T09:15:00Z",
      modifiedBy: "manager",
      modifiedOn: "2025-05-15T11:20:00Z",
      lastExecuted: "2025-06-10T06:00:00Z",
      nextExecution: undefined,
      totalExecutions: 12,
      successfulExecutions: 10,
      averageExecutionDurationMs: 285000,
      totalTanksReconciled: 156,
    },
  ]

  const performanceMetrics: PerformanceMetricsDTO = {
    executionsLast24Hours: 8,
    executionsLast7Days: 52,
    executionsLast30Days: 213,
    averageDiscrepanciesPerExecution: 2.3,
    averageResolutionTime: 1.75,
    peakExecutionTime: "2025-06-12T02:00:00Z",
    mostActivePolicy: "Daily Tank Reconciliation",
  }

  const systemMetrics = {
    totalPolicies: policies.length,
    activePolicies: policies.filter((p) => p.isActive).length,
    averageSuccessRate:
      policies.reduce((acc, p) => acc + calculateSuccessRate(p.successfulExecutions, p.totalExecutions), 0) /
      policies.length,
    totalExecutions: policies.reduce((acc, p) => acc + p.totalExecutions, 0),
    systemEfficiency: 94.2,
    trendsImproving: 3,
    trendsStable: 7,
    trendsDecreasing: 2,
  }

  const optimizationRecommendations = [
    {
      id: 1,
      type: "Schedule Optimization",
      priority: "High",
      description: "Consider adjusting execution times for better resource utilization",
      impact: "15% performance improvement",
      affectedPolicies: ["Daily Tank Reconciliation"],
      estimatedSavings: "$2,400/month",
    },
    {
      id: 2,
      type: "Threshold Review",
      priority: "Medium",
      description: "Review discrepancy thresholds for policies showing declining performance",
      impact: "Reduce false positives by 25%",
      affectedPolicies: ["Weekend Emergency Monitoring"],
      estimatedSavings: "$800/month",
    },
    {
      id: 3,
      type: "Scope Optimization",
      priority: "Low",
      description: "Optimize tank scope configuration to reduce processing overhead",
      impact: "8% faster execution",
      affectedPolicies: ["Critical Tank Monitoring"],
      estimatedSavings: "$400/month",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Manager Dashboard</h2>
          <p className="text-gray-600">Policy configuration, performance analysis, and strategic oversight</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">7 Days</SelectItem>
              <SelectItem value="30days">30 Days</SelectItem>
              <SelectItem value="90days">90 Days</SelectItem>
              <SelectItem value="1year">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Policy
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Create New Reconciliation Policy</DialogTitle>
                <DialogDescription>
                  Configure a new automated reconciliation policy with advanced settings
                </DialogDescription>
              </DialogHeader>
              <PolicyConfigurationWizard />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
            <Settings className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.activePolicies}</div>
            <p className="text-xs text-muted-foreground">of {systemMetrics.totalPolicies} total policies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{systemMetrics.averageSuccessRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">+2.3% from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Executions</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceMetrics.executionsLast30Days}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
            <Zap className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{systemMetrics.systemEfficiency}%</div>
            <p className="text-xs text-muted-foreground">Processing efficiency</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="policies" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="policies">Policy Management</TabsTrigger>
          <TabsTrigger value="performance">Performance Analytics</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="strategic">Strategic Overview</TabsTrigger>
        </TabsList>

        {/* Policy Management Tab */}
        <TabsContent value="policies" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Policy Configuration & Monitoring</CardTitle>
                  <CardDescription>Manage and monitor reconciliation policies</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {policies.map((policy) => (
                    <PolicyCard key={policy.id} policy={policy} />
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Policy Distribution</CardTitle>
                  <CardDescription>Breakdown by policy type</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.values(ReconciliationPolicyType)
                    .filter((type) => typeof type === "number")
                    .map((type) => {
                      const count = policies.filter((p) => p.policyType === type).length
                      const percentage = (count / policies.length) * 100
                      return (
                        <div key={type} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{getPolicyTypeDisplayName(type as ReconciliationPolicyType)}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      )
                    })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common management tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Policy Template
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Bulk Policy Update
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Maintenance
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Export Policy Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Performance Analytics Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Execution Performance Trends</CardTitle>
                <CardDescription>Policy execution metrics over time</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{performanceMetrics.executionsLast24Hours}</div>
                    <div className="text-sm text-blue-700">Last 24 Hours</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{performanceMetrics.executionsLast7Days}</div>
                    <div className="text-sm text-green-700">Last 7 Days</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Discrepancies per Execution</span>
                    <span className="text-sm font-bold">{performanceMetrics.averageDiscrepanciesPerExecution}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Resolution Time</span>
                    <span className="text-sm font-bold">{performanceMetrics.averageResolutionTime} minutes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Most Active Policy</span>
                    <span className="text-sm font-bold">{performanceMetrics.mostActivePolicy}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Policy Effectiveness Analysis</CardTitle>
                <CardDescription>Success rates and performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {policies.map((policy) => {
                  const successRate = calculateSuccessRate(policy.successfulExecutions, policy.totalExecutions)
                  return (
                    <div key={policy.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{policy.name}</span>
                        <span className="text-green-600">{successRate}%</span>
                      </div>
                      <Progress value={successRate} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>
                          {policy.successfulExecutions}/{policy.totalExecutions} executions
                        </span>
                        <span>{policy.totalTanksReconciled} tanks reconciled</span>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>System performance indicators and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Improving Trends</p>
                      <p className="text-sm text-green-700">{systemMetrics.trendsImproving} policies</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-200">Excellent</Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Activity className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">Stable Performance</p>
                      <p className="text-sm text-blue-700">{systemMetrics.trendsStable} policies</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">Good</Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <TrendingDown className="h-8 w-8 text-orange-600" />
                    <div>
                      <p className="font-medium text-orange-900">Needs Attention</p>
                      <p className="text-sm text-orange-700">{systemMetrics.trendsDecreasing} policies</p>
                    </div>
                  </div>
                  <Badge className="bg-orange-100 text-orange-800 border-orange-200">Review</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Recommendations</CardTitle>
              <CardDescription>AI-powered suggestions to improve system performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {optimizationRecommendations.map((recommendation) => (
                <div key={recommendation.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Target className="h-5 w-5 text-blue-600" />
                      <h4 className="font-medium">{recommendation.type}</h4>
                      <Badge
                        variant={
                          recommendation.priority === "High"
                            ? "destructive"
                            : recommendation.priority === "Medium"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {recommendation.priority} Priority
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">{recommendation.estimatedSavings}</p>
                      <p className="text-xs text-gray-500">Estimated savings</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600">{recommendation.description}</p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Expected Impact</p>
                      <p className="font-medium text-blue-600">{recommendation.impact}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Affected Policies</p>
                      <p className="font-medium">{recommendation.affectedPolicies.join(", ")}</p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button size="sm">Apply Recommendation</Button>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                    <Button size="sm" variant="outline">
                      Schedule Implementation
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Strategic Overview Tab */}
        <TabsContent value="strategic" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Health Indicators</CardTitle>
                <CardDescription>Overall system performance and health metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">System Efficiency</span>
                    <span className="text-sm font-bold text-green-600">{systemMetrics.systemEfficiency}%</span>
                  </div>
                  <Progress value={systemMetrics.systemEfficiency} className="h-2" />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Policy Success Rate</span>
                    <span className="text-sm font-bold text-blue-600">
                      {systemMetrics.averageSuccessRate.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={systemMetrics.averageSuccessRate} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{systemMetrics.totalExecutions}</p>
                    <p className="text-xs text-muted-foreground">Total Executions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {policies.reduce((acc, p) => acc + p.totalTanksReconciled, 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Tanks Reconciled</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Business Impact Metrics</CardTitle>
                <CardDescription>Strategic value and operational impact</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-xl font-bold text-green-600">$24.5K</div>
                    <div className="text-sm text-green-700">Monthly Savings</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-xl font-bold text-blue-600">156h</div>
                    <div className="text-sm text-blue-700">Time Saved</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Data Quality Improvement</span>
                    <span className="text-sm font-medium text-green-600">+12.8%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Compliance Score</span>
                    <span className="text-sm font-medium text-blue-600">98.9%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Operational Risk Reduction</span>
                    <span className="text-sm font-medium text-purple-600">-34%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Long-term Strategic Trends</CardTitle>
              <CardDescription>Performance evolution and strategic insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Performance Evolution</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Success Rate Trend</span>
                      </div>
                      <span className="text-sm font-bold text-green-600">+5.2% YoY</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Resolution Time</span>
                      </div>
                      <span className="text-sm font-bold text-blue-600">-18% YoY</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Strategic Initiatives</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm font-medium text-purple-900">AI Enhancement Project</p>
                      <p className="text-xs text-purple-700">Q3 2025 - Predictive analytics integration</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="text-sm font-medium text-orange-900">Multi-site Expansion</p>
                      <p className="text-xs text-orange-700">Q4 2025 - 5 additional facilities</p>
                    </div>
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

// Policy Card Component
function PolicyCard({ policy }: { policy: ReconciliationPolicyDTO }) {
  const successRate = calculateSuccessRate(policy.successfulExecutions, policy.totalExecutions)

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h4 className="font-medium">{policy.name}</h4>
          <Badge variant="outline">{getPolicyTypeDisplayName(policy.policyType)}</Badge>
          <Badge variant={policy.isActive ? "default" : "secondary"}>{policy.isActive ? "Active" : "Inactive"}</Badge>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            Priority: {policy.priority}
          </Badge>
        </div>
        <Button size="sm" variant="outline">
          <Edit className="h-3 w-3 mr-1" />
          Configure
        </Button>
      </div>

      {policy.description && <p className="text-sm text-gray-600">{policy.description}</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Success Rate</p>
          <p className="font-medium text-green-600">{successRate}%</p>
        </div>
        <div>
          <p className="text-gray-500">Executions</p>
          <p className="font-medium">{policy.totalExecutions}</p>
        </div>
        <div>
          <p className="text-gray-500">Avg Duration</p>
          <p className="font-medium">{formatDuration(policy.averageExecutionDurationMs)}</p>
        </div>
        <div>
          <p className="text-gray-500">Tanks Reconciled</p>
          <p className="font-medium">{policy.totalTanksReconciled}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Threshold</p>
          <p className="font-medium">
            {policy.discrepancyThreshold}L / {policy.discrepancyPercentageThreshold}%
          </p>
        </div>
        <div>
          <p className="text-gray-500">Site</p>
          <p className="font-medium">{policy.siteName || "All Sites"}</p>
        </div>
        <div>
          <p className="text-gray-500">Last Executed</p>
          <p className="font-medium">{policy.lastExecuted ? formatDateTime(policy.lastExecuted) : "Never"}</p>
        </div>
        <div>
          <p className="text-gray-500">Next Execution</p>
          <p className="font-medium">
            {policy.nextExecution
              ? formatDateTime(policy.nextExecution)
              : policy.isActive
                ? "On Threshold"
                : "Inactive"}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Performance</span>
          <span>{successRate}%</span>
        </div>
        <Progress value={successRate} className="h-2" />
      </div>
    </div>
  )
}

// Policy Configuration Wizard Component
function PolicyConfigurationWizard() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium">Policy Configuration Wizard</h3>
        <p className="text-sm text-gray-600">Step-by-step policy creation with advanced configuration options</p>
      </div>

      <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
        <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h4 className="text-lg font-medium text-gray-900 mb-2">Advanced Policy Wizard</h4>
        <p className="text-gray-600 mb-4">
          This would contain a multi-step wizard for creating complex reconciliation policies with:
        </p>
        <ul className="text-sm text-gray-600 text-left max-w-md mx-auto space-y-1">
          <li>• Basic policy information and naming</li>
          <li>• Schedule configuration with visual calendar</li>
          <li>• Tank scope selection with site/tank filters</li>
          <li>• Threshold settings with impact analysis</li>
          <li>• Notification configuration</li>
          <li>• Review and validation</li>
        </ul>
        <Button className="mt-4">Start Configuration Wizard</Button>
      </div>
    </div>
  )
}


"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Play, Pause, Clock, CheckCircle, XCircle, AlertTriangle, Search, Filter, Eye } from "lucide-react"

export function ExecutionMonitoring() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("today")

  const executions = [
    {
      id: 1001,
      policyId: 1,
      policyName: "Daily Tank Reconciliation",
      executionStartTime: "2025-06-12T02:00:00Z",
      executionEndTime: "2025-06-12T02:15:32Z",
      status: "Completed",
      tanksEvaluated: 47,
      discrepanciesFound: 3,
      reconciliationsPerformed: 2,
      performanceMetrics: {
        totalProcessingTimeMs: 932000,
        averageProcessingTimePerTank: 19800,
        databaseQueryCount: 156,
        memoryUsageMB: 45.2,
      },
      results: {
        successfulReconciliations: 2,
        failedReconciliations: 0,
        skippedTanks: 1,
        totalVolumeReconciled: 125.5,
        significantDiscrepancies: 1,
      },
      errorDetails: null,
    },
    {
      id: 1002,
      policyId: 2,
      policyName: "Critical Tank Monitoring",
      executionStartTime: "2025-06-12T01:45:00Z",
      executionEndTime: null,
      status: "Running",
      tanksEvaluated: 12,
      discrepanciesFound: 1,
      reconciliationsPerformed: 1,
      progress: 60,
      totalTanks: 20,
      performanceMetrics: {
        totalProcessingTimeMs: 420000,
        averageProcessingTimePerTank: 35000,
        databaseQueryCount: 89,
        memoryUsageMB: 32.1,
      },
      results: {
        successfulReconciliations: 1,
        failedReconciliations: 0,
        skippedTanks: 0,
        totalVolumeReconciled: 67.3,
        significantDiscrepancies: 0,
      },
      errorDetails: null,
    },
    {
      id: 1000,
      policyId: 3,
      policyName: "Weekend Emergency Monitoring",
      executionStartTime: "2025-06-11T18:00:00Z",
      executionEndTime: "2025-06-11T18:00:15Z",
      status: "Failed",
      tanksEvaluated: 0,
      discrepanciesFound: 0,
      reconciliationsPerformed: 0,
      performanceMetrics: {
        totalProcessingTimeMs: 15000,
        averageProcessingTimePerTank: 0,
        databaseQueryCount: 5,
        memoryUsageMB: 12.3,
      },
      results: {
        successfulReconciliations: 0,
        failedReconciliations: 0,
        skippedTanks: 0,
        totalVolumeReconciled: 0,
        significantDiscrepancies: 0,
      },
      errorDetails: "Database connection timeout after 30 seconds",
    },
  ]

  const filteredExecutions = executions.filter((execution) => {
    const matchesSearch = execution.policyName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || execution.status.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "Running":
        return <Play className="h-4 w-4 text-blue-600" />
      case "Failed":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "Pending":
        return <Clock className="h-4 w-4 text-orange-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <Badge className="bg-green-100 text-green-800 border-green-200">{status}</Badge>
      case "Running":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">{status}</Badge>
      case "Failed":
        return <Badge variant="destructive">{status}</Badge>
      case "Pending":
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">{status}</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Execution Monitoring</h2>
          <p className="text-gray-600">Monitor policy executions and system performance</p>
        </div>
        <Button>
          <Play className="h-4 w-4 mr-2" />
          Manual Trigger
        </Button>
      </div>

      {/* Real-time Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently Running</CardTitle>
            <Play className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">1</div>
            <p className="text-xs text-muted-foreground">Active executions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">12</div>
            <p className="text-xs text-muted-foreground">Successful executions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Today</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">1</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">12:34</div>
            <p className="text-xs text-muted-foreground">Minutes:seconds</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search executions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Execution List */}
      <div className="space-y-4">
        {filteredExecutions.map((execution) => (
          <Card key={execution.id}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(execution.status)}
                    <div>
                      <h3 className="text-lg font-semibold">{execution.policyName}</h3>
                      <p className="text-sm text-gray-600">Execution ID: {execution.id}</p>
                    </div>
                    {getStatusBadge(execution.status)}
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-3 w-3 mr-1" />
                      View Details
                    </Button>
                    {execution.status === "Running" && (
                      <Button size="sm" variant="outline" className="text-orange-600">
                        <Pause className="h-3 w-3 mr-1" />
                        Pause
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress for Running Executions */}
                {execution.status === "Running" && execution.progress && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>
                        Progress: {execution.tanksEvaluated}/{execution.totalTanks} tanks
                      </span>
                      <span>{execution.progress}%</span>
                    </div>
                    <Progress value={execution.progress} className="h-2" />
                  </div>
                )}

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Tanks Evaluated</p>
                    <p className="font-medium">{execution.tanksEvaluated}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Discrepancies</p>
                    <p className="font-medium text-orange-600">{execution.discrepanciesFound}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Reconciliations</p>
                    <p className="font-medium text-green-600">{execution.reconciliationsPerformed}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Volume Reconciled</p>
                    <p className="font-medium">{execution.results.totalVolumeReconciled}L</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Processing Time</p>
                    <p className="font-medium">
                      {Math.floor(execution.performanceMetrics.totalProcessingTimeMs / 60000)}:
                      {Math.floor((execution.performanceMetrics.totalProcessingTimeMs % 60000) / 1000)
                        .toString()
                        .padStart(2, "0")}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Memory Usage</p>
                    <p className="font-medium">{execution.performanceMetrics.memoryUsageMB.toFixed(1)}MB</p>
                  </div>
                </div>

                {/* Timing Information */}
                <div className="flex flex-col sm:flex-row sm:justify-between text-xs text-gray-500 pt-2 border-t">
                  <span>Started: {new Date(execution.executionStartTime).toLocaleString()}</span>
                  {execution.executionEndTime && (
                    <span>Completed: {new Date(execution.executionEndTime).toLocaleString()}</span>
                  )}
                </div>

                {/* Error Details */}
                {execution.errorDetails && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-red-900">Error Details</span>
                    </div>
                    <p className="text-sm text-red-700">{execution.errorDetails}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredExecutions.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No executions found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, DollarSign, Clock, Shield, Target } from "lucide-react"

export function ExecutiveDashboard() {
  const businessMetrics = {
    totalReconciliationsPerformed: 2891,
    totalVolumeReconciled: 45632.8,
    estimatedManualHoursSaved: 287.5,
    estimatedCostSavings: 14375.0,
    dataQualityImprovement: 12.8,
    complianceScore: 98.9,
    systemUptime: 99.7,
    processingEfficiency: 94.2,
  }

  const trends = {
    discrepancyTrend: "Decreasing",
    systemPerformanceTrend: "Improving",
    policyEffectivenessTrend: "Stable",
    resourceUtilizationTrend: "Optimizing",
  }

  const kpiData = [
    {
      title: "Cost Savings",
      value: `$${businessMetrics.estimatedCostSavings.toLocaleString()}`,
      change: "+18.5%",
      trend: "up",
      description: "Monthly operational savings",
      icon: DollarSign,
    },
    {
      title: "Time Saved",
      value: `${businessMetrics.estimatedManualHoursSaved.toFixed(1)}h`,
      change: "+22.3%",
      trend: "up",
      description: "Manual hours eliminated",
      icon: Clock,
    },
    {
      title: "Compliance Score",
      value: `${businessMetrics.complianceScore}%`,
      change: "+2.1%",
      trend: "up",
      description: "Regulatory compliance",
      icon: Shield,
    },
    {
      title: "Data Quality",
      value: `+${businessMetrics.dataQualityImprovement}%`,
      change: "+5.2%",
      trend: "up",
      description: "Improvement in accuracy",
      icon: Target,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Executive KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, index) => {
          const Icon = kpi.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <Icon className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className={`flex items-center ${kpi.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                    {kpi.trend === "up" ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {kpi.change}
                  </span>
                  <span className="text-muted-foreground">vs last month</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Impact Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Business Impact Summary</CardTitle>
            <CardDescription>Key performance indicators and ROI metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">System Uptime</span>
                <span className="text-sm font-bold text-green-600">{businessMetrics.systemUptime}%</span>
              </div>
              <Progress value={businessMetrics.systemUptime} className="h-2" />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Processing Efficiency</span>
                <span className="text-sm font-bold text-blue-600">{businessMetrics.processingEfficiency}%</span>
              </div>
              <Progress value={businessMetrics.processingEfficiency} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {businessMetrics.totalReconciliationsPerformed.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Total Reconciliations</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {businessMetrics.totalVolumeReconciled.toLocaleString()}L
                </p>
                <p className="text-xs text-muted-foreground">Volume Reconciled</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Strategic Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Strategic Trends</CardTitle>
            <CardDescription>Long-term performance and optimization trends</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <TrendingDown className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Discrepancy Trend</p>
                    <p className="text-sm text-green-700">{trends.discrepancyTrend}</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  Excellent
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">System Performance</p>
                    <p className="text-sm text-blue-700">{trends.systemPerformanceTrend}</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                  Good
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Target className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">Policy Effectiveness</p>
                    <p className="text-sm text-gray-700">{trends.policyEffectivenessTrend}</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                  Stable
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-purple-900">Resource Utilization</p>
                    <p className="text-sm text-purple-700">{trends.resourceUtilizationTrend}</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                  Optimizing
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROI Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Return on Investment Analysis</CardTitle>
          <CardDescription>Financial impact and operational efficiency gains</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">
                ${businessMetrics.estimatedCostSavings.toLocaleString()}
              </p>
              <p className="text-sm text-green-700 font-medium">Monthly Savings</p>
              <p className="text-xs text-green-600 mt-1">18.5% increase from last month</p>
            </div>

            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">
                {businessMetrics.estimatedManualHoursSaved.toFixed(0)}h
              </p>
              <p className="text-sm text-blue-700 font-medium">Time Saved</p>
              <p className="text-xs text-blue-600 mt-1">Equivalent to 1.8 FTE positions</p>
            </div>

            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">+{businessMetrics.dataQualityImprovement}%</p>
              <p className="text-sm text-purple-700 font-medium">Quality Improvement</p>
              <p className="text-xs text-purple-600 mt-1">Data accuracy enhancement</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
//"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Settings, TrendingUp, TrendingDown, Activity, Plus, Edit } from "lucide-react"

export function ManagerDashboard() {
  const policyMetrics = [
    {
      id: 1,
      name: "Daily Tank Reconciliation",
      type: "Scheduled",
      isActive: true,
      successRate: 98.5,
      executionCount: 45,
      lastExecution: "2025-06-12T02:00:00Z",
      nextExecution: "2025-06-13T02:00:00Z",
      tanksInScope: 47,
    },
    {
      id: 2,
      name: "Critical Tank Monitoring",
      type: "Threshold",
      isActive: true,
      successRate: 94.2,
      executionCount: 156,
      lastExecution: "2025-06-12T01:45:00Z",
      nextExecution: "On Threshold",
      tanksInScope: 20,
    },
    {
      id: 3,
      name: "Weekend Emergency Monitoring",
      type: "Hybrid",
      isActive: false,
      successRate: 87.3,
      executionCount: 12,
      lastExecution: "2025-06-10T18:00:00Z",
      nextExecution: "Inactive",
      tanksInScope: 15,
    },
  ]

  const performanceMetrics = {
    totalPolicies: 12,
    activePolicies: 8,
    averageSuccessRate: 95.7,
    totalExecutions: 1456,
    systemEfficiency: 94.2,
    trendsImproving: 3,
    trendsStable: 7,
    trendsDecreasing: 2,
  }

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
            <Settings className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceMetrics.totalPolicies}</div>
            <p className="text-xs text-muted-foreground">{performanceMetrics.activePolicies} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{performanceMetrics.averageSuccessRate}%</div>
            <p className="text-xs text-muted-foreground">+2.3% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceMetrics.totalExecutions}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{performanceMetrics.systemEfficiency}%</div>
            <p className="text-xs text-muted-foreground">Processing efficiency</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Policy Management */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Policy Management</CardTitle>
                  <CardDescription>Configure and monitor reconciliation policies</CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Policy
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {policyMetrics.map((policy) => (
                <div key={policy.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium">{policy.name}</h4>
                      <Badge variant="outline">{policy.type}</Badge>
                      <Badge variant={policy.isActive ? "default" : "secondary"}>
                        {policy.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <Button size="sm" variant="outline">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Success Rate</p>
                      <p className="font-medium text-green-600">{policy.successRate}%</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Executions</p>
                      <p className="font-medium">{policy.executionCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Tanks in Scope</p>
                      <p className="font-medium">{policy.tanksInScope}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Next Execution</p>
                      <p className="font-medium">
                        {policy.nextExecution === "On Threshold"
                          ? "On Threshold"
                          : policy.nextExecution === "Inactive"
                            ? "Inactive"
                            : "Tomorrow 2:00 AM"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Performance</span>
                      <span>{policy.successRate}%</span>
                    </div>
                    <Progress value={policy.successRate} className="h-2" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Performance Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>Policy effectiveness analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Improving</span>
                </div>
                <span className="text-sm font-medium">{performanceMetrics.trendsImproving} policies</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Stable</span>
                </div>
                <span className="text-sm font-medium">{performanceMetrics.trendsStable} policies</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Needs Attention</span>
                </div>
                <span className="text-sm font-medium">{performanceMetrics.trendsDecreasing} policies</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-3">Optimization Recommendations</h4>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="font-medium text-blue-900">Schedule Optimization</p>
                  <p className="text-blue-700">Consider adjusting execution times for better resource utilization</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="font-medium text-yellow-900">Threshold Review</p>
                  <p className="text-yellow-700">
                    Review discrepancy thresholds for 2 policies showing declining performance
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common management tasks and system operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Plus className="h-6 w-6" />
              <span>Create Policy</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Settings className="h-6 w-6" />
              <span>System Config</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Activity className="h-6 w-6" />
              <span>Performance Report</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <TrendingUp className="h-6 w-6" />
              <span>Optimization Analysis</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

//
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, CheckCircle, Clock, Play, Pause, RotateCcw } from "lucide-react"

export function OperatorDashboard() {
  const currentExecutions = [
    {
      id: 1001,
      policyName: "Daily Tank Reconciliation",
      progress: 75,
      tanksProcessed: 35,
      totalTanks: 47,
      startTime: "02:00:00",
      estimatedCompletion: "02:15:00",
    },
    {
      id: 1002,
      policyName: "Critical Tank Monitoring",
      progress: 45,
      tanksProcessed: 9,
      totalTanks: 20,
      startTime: "02:05:00",
      estimatedCompletion: "02:12:00",
    },
  ]

  const recentAlerts = [
    {
      id: 5001,
      tankName: "Fuel Tank A-1",
      siteName: "Main Distribution Center",
      severity: "Medium",
      variance: -124.5,
      detectedTime: "02:05:15",
    },
    {
      id: 5002,
      tankName: "Chemical Tank B-3",
      siteName: "North Facility",
      severity: "High",
      variance: 245.8,
      detectedTime: "01:45:22",
    },
    {
      id: 5003,
      tankName: "Fuel Tank C-2",
      siteName: "South Distribution",
      severity: "Low",
      variance: 45.2,
      detectedTime: "01:30:10",
    },
  ]

  const recentExecutions = [
    {
      id: 1000,
      policyName: "Hourly Critical Monitoring",
      status: "Completed",
      tanksEvaluated: 20,
      discrepanciesFound: 1,
      duration: "00:03:45",
      completedTime: "01:00:00",
    },
    {
      id: 999,
      policyName: "Daily Tank Reconciliation",
      status: "Completed",
      tanksEvaluated: 47,
      discrepanciesFound: 2,
      duration: "00:15:32",
      completedTime: "Yesterday 02:00",
    },
    {
      id: 998,
      policyName: "Weekend Emergency Monitoring",
      status: "Failed",
      tanksEvaluated: 0,
      discrepanciesFound: 0,
      duration: "00:00:15",
      completedTime: "Yesterday 18:00",
    },
  ]

  return (
    <div className="space-y-6">
      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently Running</CardTitle>
            <Play className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">2</div>
            <p className="text-xs text-muted-foreground">Active executions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queued</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">0</div>
            <p className="text-xs text-muted-foreground">Pending executions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">3</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">99.7%</div>
            <p className="text-xs text-muted-foreground">Uptime</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Executions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Play className="h-5 w-5 text-blue-600" />
              <span>Current Executions</span>
            </CardTitle>
            <CardDescription>Real-time monitoring of active policy executions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentExecutions.map((execution) => (
              <div key={execution.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{execution.policyName}</h4>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    Running
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>
                      Progress: {execution.tanksProcessed}/{execution.totalTanks} tanks
                    </span>
                    <span>{execution.progress}%</span>
                  </div>
                  <Progress value={execution.progress} className="h-2" />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Started: {execution.startTime}</span>
                  <span>ETA: {execution.estimatedCompletion}</span>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <Pause className="h-3 w-3 mr-1" />
                    Pause
                  </Button>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span>Recent Discrepancy Alerts</span>
            </CardTitle>
            <CardDescription>Newly discovered discrepancies requiring attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{alert.tankName}</h4>
                  <Badge
                    variant={
                      alert.severity === "High" ? "destructive" : alert.severity === "Medium" ? "default" : "secondary"
                    }
                  >
                    {alert.severity}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{alert.siteName}</p>
                <div className="flex justify-between text-sm">
                  <span className={`font-medium ${alert.variance < 0 ? "text-red-600" : "text-orange-600"}`}>
                    Variance: {alert.variance > 0 ? "+" : ""}
                    {alert.variance} L
                  </span>
                  <span className="text-gray-500">{alert.detectedTime}</span>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    Investigate
                  </Button>
                  <Button size="sm" variant="outline">
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Reconcile
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Execution History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Execution History</CardTitle>
          <CardDescription>Latest policy execution results and performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentExecutions.map((execution) => (
              <div key={execution.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      execution.status === "Completed"
                        ? "bg-green-500"
                        : execution.status === "Failed"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                    }`}
                  />
                  <div>
                    <h4 className="font-medium">{execution.policyName}</h4>
                    <p className="text-sm text-gray-600">
                      {execution.tanksEvaluated} tanks evaluated • {execution.discrepanciesFound} discrepancies found
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    variant={
                      execution.status === "Completed"
                        ? "default"
                        : execution.status === "Failed"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {execution.status}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    {execution.duration} • {execution.completedTime}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Search, Filter, Play, Pause, Trash2 } from "lucide-react"

export function PolicyManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  const policies = [
    {
      id: 1,
      name: "Daily Tank Reconciliation",
      description: "Automated reconciliation for all tanks daily at 2 AM",
      policyType: "Scheduled",
      isActive: true,
      priority: 100,
      scheduleConfiguration: {
        type: "daily",
        time: "02:00:00",
      },
      discrepancyThreshold: 5.0,
      discrepancyPercentageThreshold: 2.0,
      tankScopeConfiguration: {
        siteIds: [1, 2, 3],
        minimumTankVolume: 1000,
      },
      lastExecutionDate: "2025-06-12T02:00:00Z",
      nextExecutionDate: "2025-06-13T02:00:00Z",
      executionCount: 45,
      successRate: 98.5,
      createdDate: "2025-05-01T10:00:00Z",
    },
    {
      id: 2,
      name: "Critical Tank Monitoring",
      description: "High-frequency monitoring for critical tanks",
      policyType: "Threshold",
      isActive: true,
      priority: 150,
      discrepancyThreshold: 25.0,
      discrepancyPercentageThreshold: 1.5,
      tankScopeConfiguration: {
        siteIds: [1, 3],
        minimumTankVolume: 5000,
        criticalTanksOnly: true,
      },
      lastExecutionDate: "2025-06-12T01:45:00Z",
      nextExecutionDate: "On Threshold",
      executionCount: 156,
      successRate: 94.2,
      createdDate: "2025-04-15T14:30:00Z",
    },
    {
      id: 3,
      name: "Weekend Emergency Monitoring",
      description: "Emergency monitoring during weekends",
      policyType: "Hybrid",
      isActive: false,
      priority: 200,
      scheduleConfiguration: {
        type: "weekly",
        daysOfWeek: ["Saturday", "Sunday"],
        time: "06:00:00",
      },
      discrepancyThreshold: 15.0,
      discrepancyPercentageThreshold: 3.0,
      tankScopeConfiguration: {
        siteIds: [2],
        minimumTankVolume: 2000,
      },
      lastExecutionDate: "2025-06-10T06:00:00Z",
      nextExecutionDate: "Inactive",
      executionCount: 12,
      successRate: 87.3,
      createdDate: "2025-03-20T09:15:00Z",
    },
  ]

  const filteredPolicies = policies.filter((policy) => {
    const matchesSearch =
      policy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || policy.policyType.toLowerCase() === filterType.toLowerCase()
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && policy.isActive) ||
      (filterStatus === "inactive" && !policy.isActive)

    return matchesSearch && matchesType && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Policy Management</h2>
          <p className="text-gray-600">Configure and monitor automated reconciliation policies</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Policy
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Policy</DialogTitle>
              <DialogDescription>Configure a new automated reconciliation policy</DialogDescription>
            </DialogHeader>
            <PolicyForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search policies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Policy Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="threshold">Threshold</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="eventdriven">Event Driven</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Policy List */}
      <div className="space-y-4">
        {filteredPolicies.map((policy) => (
          <Card key={policy.id}>
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold">{policy.name}</h3>
                    <Badge variant="outline">{policy.policyType}</Badge>
                    <Badge variant={policy.isActive ? "default" : "secondary"}>
                      {policy.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      Priority: {policy.priority}
                    </Badge>
                  </div>

                  <p className="text-gray-600">{policy.description}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Success Rate</p>
                      <p className="font-medium text-green-600">{policy.successRate}%</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Executions</p>
                      <p className="font-medium">{policy.executionCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Threshold</p>
                      <p className="font-medium">
                        {policy.discrepancyThreshold}L / {policy.discrepancyPercentageThreshold}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Next Execution</p>
                      <p className="font-medium">
                        {policy.nextExecutionDate === "On Threshold"
                          ? "On Threshold"
                          : policy.nextExecutionDate === "Inactive"
                            ? "Inactive"
                            : "Tomorrow 2:00 AM"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <Button size="sm" variant="outline">
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className={
                      policy.isActive ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"
                    }
                  >
                    {policy.isActive ? (
                      <>
                        <Pause className="h-3 w-3 mr-1" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3 mr-1" />
                        Activate
                      </>
                    )}
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPolicies.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No policies found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function PolicyForm() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Policy Name</Label>
          <Input id="name" placeholder="Enter policy name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Policy Type</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="threshold">Threshold</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
              <SelectItem value="eventdriven">Event Driven</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" placeholder="Enter policy description" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="threshold">Discrepancy Threshold (L)</Label>
          <Input id="threshold" type="number" placeholder="25.0" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="percentage">Percentage Threshold (%)</Label>
          <Input id="percentage" type="number" placeholder="2.0" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Input id="priority" type="number" placeholder="100" />
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="active" />
          <Label htmlFor="active">Active</Label>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline">Cancel</Button>
        <Button>Create Policy</Button>
      </div>
    </div>
  )
}
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Clock,
  Target,
  Bell,
  Database,
  AlertTriangle,
  Filter,
} from "lucide-react"
import { type ReconciliationPolicyDTO, ReconciliationPolicyType } from "../types/reconciliation-types"
import { getPolicyTypeDisplayName, formatDateTime } from "../utils/reconciliation-utils"

interface SettingsPopupProps {
  isOpen: boolean
  onClose: () => void
}

interface CreatePolicyRequest {
  name: string
  description?: string
  policyType: string
  scheduleConfiguration?: string
  discrepancyThreshold?: number
  discrepancyPercentageThreshold?: number
  siteId?: number
  tankScopeConfiguration?: string
  priority: number
  maxTanksPerExecution?: number
  notificationConfiguration?: string
  isActive: boolean
}

interface UpdatePolicyRequest extends CreatePolicyRequest {
  id: number
}

interface ScheduleConfig {
  type: "daily" | "weekly" | "monthly" | "custom"
  time?: string
  daysOfWeek?: string[]
  dayOfMonth?: number
  interval?: number
}

interface TankScopeConfig {
  siteIds?: number[]
  specificTankIds?: number[]
  minimumTankVolume?: number
  maximumTankVolume?: number
  criticalTanksOnly?: boolean
  tankTypes?: string[]
}

interface NotificationConfig {
  emailAddresses?: string[]
  enableSlackNotifications?: boolean
  enableSmsNotifications?: boolean
  severityThreshold?: string
  escalationRules?: {
    timeoutMinutes: number
    escalateToEmails: string[]
  }
}

export function SettingsPopup({ isOpen, onClose }: SettingsPopupProps) {
  const [activeTab, setActiveTab] = useState("policies")
  const [policies, setPolicies] = useState<ReconciliationPolicyDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<ReconciliationPolicyDTO | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  // Sample data - replace with actual API calls
  const samplePolicies: ReconciliationPolicyDTO[] = [
    {
      id: 1,
      name: "Daily Tank Reconciliation",
      description: "Automated reconciliation for all tanks daily at 2 AM",
      isActive: true,
      policyType: ReconciliationPolicyType.Scheduled,
      scheduleConfiguration: '{"type":"daily","time":"02:00:00"}',
      discrepancyThreshold: 5.0,
      discrepancyPercentageThreshold: 2.0,
      siteId: undefined,
      siteName: "All Sites",
      tankScopeConfiguration: '{"siteIds":[1,2,3],"minimumTankVolume":1000}',
      priority: 100,
      maxTanksPerExecution: 50,
      notificationConfiguration: '{"emailAddresses":["ops@company.com"],"enableSlackNotifications":true}',
      createdBy: "admin",
      createdOn: "2025-05-01T10:00:00Z",
      modifiedBy: "manager",
      modifiedOn: "2025-06-01T15:30:00Z",
      lastExecuted: "2025-06-12T02:00:00Z",
      nextExecution: "2025-06-13T02:00:00Z",
      totalExecutions: 45,
      successfulExecutions: 44,
      averageExecutionDurationMs: 932000,
      totalTanksReconciled: 2115,
    },
    {
      id: 2,
      name: "Critical Tank Monitoring",
      description: "High-frequency monitoring for critical tanks",
      isActive: true,
      policyType: ReconciliationPolicyType.Threshold,
      scheduleConfiguration: undefined,
      discrepancyThreshold: 25.0,
      discrepancyPercentageThreshold: 1.5,
      siteId: 1,
      siteName: "Main Distribution Center",
      tankScopeConfiguration: '{"siteIds":[1,3],"minimumTankVolume":5000,"criticalTanksOnly":true}',
      priority: 150,
      maxTanksPerExecution: 20,
      notificationConfiguration:
        '{"emailAddresses":["critical@company.com"],"enableSlackNotifications":true,"severityThreshold":"Medium"}',
      createdBy: "admin",
      createdOn: "2025-04-15T14:30:00Z",
      modifiedBy: "manager",
      modifiedOn: "2025-06-10T09:15:00Z",
      lastExecuted: "2025-06-12T01:45:00Z",
      nextExecution: undefined,
      totalExecutions: 156,
      successfulExecutions: 147,
      averageExecutionDurationMs: 420000,
      totalTanksReconciled: 1872,
    },
  ]

  useEffect(() => {
    if (isOpen) {
      loadPolicies()
    }
  }, [isOpen])

  const loadPolicies = async () => {
    setLoading(true)
    try {
      // Replace with actual API call
      // const response = await ReconciliationApiService.getPolicies()
      // setPolicies(response.data)
      setPolicies(samplePolicies)
    } catch (error) {
      console.error("Failed to load policies:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePolicy = () => {
    setEditingPolicy(null)
    setIsCreateDialogOpen(true)
  }

  const handleEditPolicy = (policy: ReconciliationPolicyDTO) => {
    setEditingPolicy(policy)
    setIsEditDialogOpen(true)
  }

  const handleDeletePolicy = async (policyId: number) => {
    try {
      // Replace with actual API call
      // await ReconciliationApiService.deletePolicy(policyId)
      setPolicies(policies.filter((p) => p.id !== policyId))
    } catch (error) {
      console.error("Failed to delete policy:", error)
    }
  }

  const filteredPolicies = policies.filter((policy) => {
    const matchesSearch =
      policy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (policy.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    const matchesType =
      filterType === "all" || getPolicyTypeDisplayName(policy.policyType).toLowerCase() === filterType.toLowerCase()
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && policy.isActive) ||
      (filterStatus === "inactive" && !policy.isActive)

    return matchesSearch && matchesType && matchesStatus
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>System Settings</span>
          </DialogTitle>
          <DialogDescription>
            Configure automated reconciliation policies, system parameters, and notification settings
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="policies">Policies</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[600px] mt-4">
            <TabsContent value="policies" className="space-y-4">
              <PolicyManagementTab
                policies={filteredPolicies}
                loading={loading}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterType={filterType}
                setFilterType={setFilterType}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                onCreatePolicy={handleCreatePolicy}
                onEditPolicy={handleEditPolicy}
                onDeletePolicy={handleDeletePolicy}
              />
            </TabsContent>

            <TabsContent value="system" className="space-y-4">
              <SystemConfigurationTab />
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <NotificationSettingsTab />
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <SecuritySettingsTab />
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>

        {/* Create Policy Dialog */}
        <PolicyFormDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          onSave={(policy) => {
            // Handle create
            setPolicies([...policies, { ...policy, id: Date.now() } as ReconciliationPolicyDTO])
            setIsCreateDialogOpen(false)
          }}
          title="Create New Policy"
          mode="create"
        />

        {/* Edit Policy Dialog */}
        <PolicyFormDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onSave={(policy) => {
            // Handle update
            setPolicies(
              policies.map((p) =>
                p.id === editingPolicy?.id ? ({ ...policy, id: editingPolicy.id } as ReconciliationPolicyDTO) : p,
              ),
            )
            setIsEditDialogOpen(false)
          }}
          title="Edit Policy"
          mode="edit"
          initialData={editingPolicy}
        />
      </DialogContent>
    </Dialog>
  )
}

// Policy Management Tab Component
function PolicyManagementTab({
  policies,
  loading,
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  filterStatus,
  setFilterStatus,
  onCreatePolicy,
  onEditPolicy,
  onDeletePolicy,
}: {
  policies: ReconciliationPolicyDTO[]
  loading: boolean
  searchTerm: string
  setSearchTerm: (term: string) => void
  filterType: string
  setFilterType: (type: string) => void
  filterStatus: string
  setFilterStatus: (status: string) => void
  onCreatePolicy: () => void
  onEditPolicy: (policy: ReconciliationPolicyDTO) => void
  onDeletePolicy: (id: number) => void
}) {
  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h3 className="text-lg font-semibold">Policy Management</h3>
          <p className="text-sm text-gray-600">Create, edit, and manage reconciliation policies</p>
        </div>
        <Button onClick={onCreatePolicy}>
          <Plus className="h-4 w-4 mr-2" />
          Create Policy
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search policies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Policy Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="threshold">Threshold</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="event driven">Event Driven</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Policy List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">Loading policies...</div>
        ) : policies.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No policies found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          policies.map((policy) => (
            <PolicyCard
              key={policy.id}
              policy={policy}
              onEdit={() => onEditPolicy(policy)}
              onDelete={() => onDeletePolicy(policy.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

// Policy Card Component
function PolicyCard({
  policy,
  onEdit,
  onDelete,
}: {
  policy: ReconciliationPolicyDTO
  onEdit: () => void
  onDelete: () => void
}) {
  const successRate =
    policy.totalExecutions > 0 ? Math.round((policy.successfulExecutions / policy.totalExecutions) * 100 * 10) / 10 : 0

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
          <div className="flex-1 space-y-3">
            <div className="flex items-center space-x-3">
              <h4 className="text-lg font-semibold">{policy.name}</h4>
              <Badge variant="outline">{getPolicyTypeDisplayName(policy.policyType)}</Badge>
              <Badge variant={policy.isActive ? "default" : "secondary"}>
                {policy.isActive ? "Active" : "Inactive"}
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Priority: {policy.priority}
              </Badge>
            </div>

            {policy.description && <p className="text-gray-600">{policy.description}</p>}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Success Rate</p>
                <p className="font-medium text-green-600">{successRate}%</p>
              </div>
              <div>
                <p className="text-gray-500">Executions</p>
                <p className="font-medium">{policy.totalExecutions}</p>
              </div>
              <div>
                <p className="text-gray-500">Site</p>
                <p className="font-medium">{policy.siteName || "All Sites"}</p>
              </div>
              <div>
                <p className="text-gray-500">Last Modified</p>
                <p className="font-medium">{formatDateTime(policy.modifiedOn || policy.createdOn)}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Policy</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{policy.name}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Policy Form Dialog Component
function PolicyFormDialog({
  isOpen,
  onClose,
  onSave,
  title,
  mode,
  initialData,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (policy: CreatePolicyRequest | UpdatePolicyRequest) => void
  title: string
  mode: "create" | "edit"
  initialData?: ReconciliationPolicyDTO | null
}) {
  const [formData, setFormData] = useState<CreatePolicyRequest>({
    name: "",
    description: "",
    policyType: "Scheduled",
    scheduleConfiguration: "",
    discrepancyThreshold: 5.0,
    discrepancyPercentageThreshold: 2.0,
    siteId: undefined,
    tankScopeConfiguration: "",
    priority: 100,
    maxTanksPerExecution: 50,
    notificationConfiguration: "",
    isActive: true,
  })

  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
    type: "daily",
    time: "02:00",
  })

  const [tankScopeConfig, setTankScopeConfig] = useState<TankScopeConfig>({
    siteIds: [],
    minimumTankVolume: 1000,
  })

  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig>({
    emailAddresses: [],
    enableSlackNotifications: false,
  })

  useEffect(() => {
    if (initialData && mode === "edit") {
      setFormData({
        name: initialData.name,
        description: initialData.description || "",
        policyType: getPolicyTypeDisplayName(initialData.policyType),
        scheduleConfiguration: initialData.scheduleConfiguration || "",
        discrepancyThreshold: initialData.discrepancyThreshold || 5.0,
        discrepancyPercentageThreshold: initialData.discrepancyPercentageThreshold || 2.0,
        siteId: initialData.siteId,
        tankScopeConfiguration: initialData.tankScopeConfiguration || "",
        priority: initialData.priority,
        maxTanksPerExecution: initialData.maxTanksPerExecution || 50,
        notificationConfiguration: initialData.notificationConfiguration || "",
        isActive: initialData.isActive,
      })

      // Parse configurations
      if (initialData.scheduleConfiguration) {
        try {
          setScheduleConfig(JSON.parse(initialData.scheduleConfiguration))
        } catch (e) {
          console.error("Failed to parse schedule configuration")
        }
      }

      if (initialData.tankScopeConfiguration) {
        try {
          setTankScopeConfig(JSON.parse(initialData.tankScopeConfiguration))
        } catch (e) {
          console.error("Failed to parse tank scope configuration")
        }
      }

      if (initialData.notificationConfiguration) {
        try {
          setNotificationConfig(JSON.parse(initialData.notificationConfiguration))
        } catch (e) {
          console.error("Failed to parse notification configuration")
        }
      }
    }
  }, [initialData, mode])

  const handleSave = () => {
    const policy: CreatePolicyRequest | UpdatePolicyRequest = {
      ...formData,
      scheduleConfiguration: JSON.stringify(scheduleConfig),
      tankScopeConfiguration: JSON.stringify(tankScopeConfig),
      notificationConfiguration: JSON.stringify(notificationConfig),
      ...(mode === "edit" && initialData ? { id: initialData.id } : {}),
    }

    onSave(policy)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Configure policy settings, schedule, thresholds, and notifications</DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[600px]">
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="scope">Tank Scope</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <BasicInfoForm formData={formData} setFormData={setFormData} />
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4">
              <ScheduleConfigForm
                config={scheduleConfig}
                setConfig={setScheduleConfig}
                policyType={formData.policyType}
              />
            </TabsContent>

            <TabsContent value="scope" className="space-y-4">
              <TankScopeForm config={tankScopeConfig} setConfig={setTankScopeConfig} />
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <NotificationConfigForm config={notificationConfig} setConfig={setNotificationConfig} />
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            {mode === "create" ? "Create Policy" : "Update Policy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Basic Info Form Component
function BasicInfoForm({
  formData,
  setFormData,
}: {
  formData: CreatePolicyRequest
  setFormData: (data: CreatePolicyRequest) => void
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Policy Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter policy name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="policyType">Policy Type *</Label>
          <Select
            value={formData.policyType}
            onValueChange={(value) => setFormData({ ...formData, policyType: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Scheduled">Scheduled</SelectItem>
              <SelectItem value="Threshold">Threshold</SelectItem>
              <SelectItem value="Hybrid">Hybrid</SelectItem>
              <SelectItem value="EventDriven">Event Driven</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter policy description"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Input
            id="priority"
            type="number"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: Number.parseInt(e.target.value) || 100 })}
            min="1"
            max="1000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="discrepancyThreshold">Threshold (L)</Label>
          <Input
            id="discrepancyThreshold"
            type="number"
            step="0.1"
            value={formData.discrepancyThreshold}
            onChange={(e) =>
              setFormData({ ...formData, discrepancyThreshold: Number.parseFloat(e.target.value) || 5.0 })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="discrepancyPercentageThreshold">Threshold (%)</Label>
          <Input
            id="discrepancyPercentageThreshold"
            type="number"
            step="0.1"
            value={formData.discrepancyPercentageThreshold}
            onChange={(e) =>
              setFormData({ ...formData, discrepancyPercentageThreshold: Number.parseFloat(e.target.value) || 2.0 })
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="maxTanksPerExecution">Max Tanks per Execution</Label>
          <Input
            id="maxTanksPerExecution"
            type="number"
            value={formData.maxTanksPerExecution}
            onChange={(e) => setFormData({ ...formData, maxTanksPerExecution: Number.parseInt(e.target.value) || 50 })}
            min="1"
          />
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
          <Label htmlFor="isActive">Active Policy</Label>
        </div>
      </div>
    </div>
  )
}

// Schedule Config Form Component
function ScheduleConfigForm({
  config,
  setConfig,
  policyType,
}: {
  config: ScheduleConfig
  setConfig: (config: ScheduleConfig) => void
  policyType: string
}) {
  if (policyType === "Threshold") {
    return (
      <div className="text-center py-8">
        <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Threshold-Based Policy</h3>
        <p className="text-gray-600">
          This policy executes when discrepancy thresholds are exceeded. No schedule configuration required.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Schedule Type</Label>
        <Select value={config.type} onValueChange={(value: any) => setConfig({ ...config, type: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="custom">Custom Interval</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="time">Execution Time</Label>
        <Input
          id="time"
          type="time"
          value={config.time}
          onChange={(e) => setConfig({ ...config, time: e.target.value })}
        />
      </div>

      {config.type === "weekly" && (
        <div className="space-y-2">
          <Label>Days of Week</Label>
          <div className="grid grid-cols-7 gap-2">
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
              <div key={day} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={day}
                  checked={config.daysOfWeek?.includes(day) || false}
                  onChange={(e) => {
                    const days = config.daysOfWeek || []
                    if (e.target.checked) {
                      setConfig({ ...config, daysOfWeek: [...days, day] })
                    } else {
                      setConfig({ ...config, daysOfWeek: days.filter((d) => d !== day) })
                    }
                  }}
                />
                <Label htmlFor={day} className="text-xs">
                  {day.slice(0, 3)}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {config.type === "monthly" && (
        <div className="space-y-2">
          <Label htmlFor="dayOfMonth">Day of Month</Label>
          <Input
            id="dayOfMonth"
            type="number"
            min="1"
            max="31"
            value={config.dayOfMonth}
            onChange={(e) => setConfig({ ...config, dayOfMonth: Number.parseInt(e.target.value) || 1 })}
          />
        </div>
      )}

      {config.type === "custom" && (
        <div className="space-y-2">
          <Label htmlFor="interval">Interval (minutes)</Label>
          <Input
            id="interval"
            type="number"
            min="1"
            value={config.interval}
            onChange={(e) => setConfig({ ...config, interval: Number.parseInt(e.target.value) || 60 })}
          />
        </div>
      )}
    </div>
  )
}

// Tank Scope Form Component
function TankScopeForm({
  config,
  setConfig,
}: {
  config: TankScopeConfig
  setConfig: (config: TankScopeConfig) => void
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="minVolume">Minimum Tank Volume (L)</Label>
          <Input
            id="minVolume"
            type="number"
            value={config.minimumTankVolume}
            onChange={(e) => setConfig({ ...config, minimumTankVolume: Number.parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxVolume">Maximum Tank Volume (L)</Label>
          <Input
            id="maxVolume"
            type="number"
            value={config.maximumTankVolume}
            onChange={(e) => setConfig({ ...config, maximumTankVolume: Number.parseInt(e.target.value) || undefined })}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="criticalOnly"
          checked={config.criticalTanksOnly || false}
          onCheckedChange={(checked) => setConfig({ ...config, criticalTanksOnly: checked })}
        />
        <Label htmlFor="criticalOnly">Critical Tanks Only</Label>
      </div>

      <div className="space-y-2">
        <Label>Site Selection</Label>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6].map((siteId) => (
            <div key={siteId} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`site-${siteId}`}
                checked={config.siteIds?.includes(siteId) || false}
                onChange={(e) => {
                  const sites = config.siteIds || []
                  if (e.target.checked) {
                    setConfig({ ...config, siteIds: [...sites, siteId] })
                  } else {
                    setConfig({ ...config, siteIds: sites.filter((s) => s !== siteId) })
                  }
                }}
              />
              <Label htmlFor={`site-${siteId}`} className="text-sm">
                Site {siteId}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Notification Config Form Component
function NotificationConfigForm({
  config,
  setConfig,
}: {
  config: NotificationConfig
  setConfig: (config: NotificationConfig) => void
}) {
  const [emailInput, setEmailInput] = useState("")

  const addEmail = () => {
    if (emailInput && !config.emailAddresses?.includes(emailInput)) {
      setConfig({
        ...config,
        emailAddresses: [...(config.emailAddresses || []), emailInput],
      })
      setEmailInput("")
    }
  }

  const removeEmail = (email: string) => {
    setConfig({
      ...config,
      emailAddresses: config.emailAddresses?.filter((e) => e !== email) || [],
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Email Notifications</Label>
        <div className="flex space-x-2">
          <Input
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="Enter email address"
            onKeyPress={(e) => e.key === "Enter" && addEmail()}
          />
          <Button type="button" onClick={addEmail}>
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {config.emailAddresses?.map((email) => (
            <Badge key={email} variant="secondary" className="flex items-center space-x-1">
              <span>{email}</span>
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeEmail(email)} />
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="slack"
            checked={config.enableSlackNotifications || false}
            onCheckedChange={(checked) => setConfig({ ...config, enableSlackNotifications: checked })}
          />
          <Label htmlFor="slack">Slack Notifications</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="sms"
            checked={config.enableSmsNotifications || false}
            onCheckedChange={(checked) => setConfig({ ...config, enableSmsNotifications: checked })}
          />
          <Label htmlFor="sms">SMS Notifications</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Severity Threshold</Label>
        <Select
          value={config.severityThreshold || "Medium"}
          onValueChange={(value) => setConfig({ ...config, severityThreshold: value })}
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
    </div>
  )
}

// System Configuration Tab
function SystemConfigurationTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">System Configuration</h3>
        <p className="text-sm text-gray-600">Configure global system settings and parameters</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Database Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Connection Timeout (seconds)</Label>
              <Input type="number" defaultValue="30" />
            </div>
            <div className="space-y-2">
              <Label>Query Timeout (seconds)</Label>
              <Input type="number" defaultValue="120" />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="autoRetry" defaultChecked />
            <Label htmlFor="autoRetry">Enable Auto Retry on Connection Failure</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Execution Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Max Concurrent Executions</Label>
              <Input type="number" defaultValue="5" />
            </div>
            <div className="space-y-2">
              <Label>Execution Timeout (minutes)</Label>
              <Input type="number" defaultValue="60" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Default Retry Attempts</Label>
            <Input type="number" defaultValue="3" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Notification Settings Tab
function NotificationSettingsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Notification Settings</h3>
        <p className="text-sm text-gray-600">Configure global notification preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Global Notification Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch id="globalEmail" defaultChecked />
              <Label htmlFor="globalEmail">Enable Email Notifications</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="globalSlack" defaultChecked />
              <Label htmlFor="globalSlack">Enable Slack Notifications</Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Default Admin Email</Label>
            <Input defaultValue="admin@company.com" />
          </div>
          <div className="space-y-2">
            <Label>Slack Webhook URL</Label>
            <Input placeholder="https://hooks.slack.com/..." />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Security Settings Tab
function SecuritySettingsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Security Settings</h3>
        <p className="text-sm text-gray-600">Configure security and access control settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Access Control</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch id="requireApproval" defaultChecked />
              <Label htmlFor="requireApproval">Require Approval for Policy Changes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="auditLog" defaultChecked />
              <Label htmlFor="auditLog">Enable Audit Logging</Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Session Timeout (minutes)</Label>
            <Input type="number" defaultValue="480" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Enums matching C# enums
export enum ReconciliationExecutionStatus {
  Pending = 0,
  Running = 1,
  Completed = 2,
  Failed = 3,
  Cancelled = 4,
}

export enum DiscrepancySeverity {
  Low = 0,
  Medium = 1,
  High = 2,
  Critical = 3,
}

export enum ReconciliationPolicyType {
  Scheduled = 0,
  Threshold = 1,
  Hybrid = 2,
  EventDriven = 3,
}

// DTOs matching C# models
export interface PolicyExecutionDTO {
  id: number
  policyId: number
  policyName: string
  executionStartTime: string
  executionEndTime?: string
  status: ReconciliationExecutionStatus
  tanksEvaluated: number
  discrepanciesDetected: number
  tanksReconciled: number
  reconciliationFailures: number
  totalVolumeVariance?: number
  averagePercentageVariance?: number
  executionDurationMs?: number
  errorMessage?: string
  executionResults?: string
  executionLog?: string
  discrepancies: ReconciliationDiscrepancyDTO[]
}

export interface ReconciliationDiscrepancyDTO {
  id: number
  policyExecutionId: number
  tankId: number
  tankName: string
  siteName: string
  detectedAt: string
  currentStock: number
  expectedStock: number
  absoluteVariance: number
  percentageVariance: number
  severity: DiscrepancySeverity
  isResolved: boolean
  resolvedAt?: string
  resolutionMethod?: string
  analysisNotes?: string
  trendAnalysis?: string
  businessImpactScore?: number
}

export interface ReconciliationPolicyDTO {
  id: number
  name: string
  description?: string
  isActive: boolean
  policyType: ReconciliationPolicyType
  scheduleConfiguration?: string
  discrepancyThreshold?: number
  discrepancyPercentageThreshold?: number
  siteId?: number
  siteName?: string
  tankScopeConfiguration?: string
  priority: number
  maxTanksPerExecution?: number
  notificationConfiguration?: string
  createdBy: string
  createdOn: string
  modifiedBy?: string
  modifiedOn?: string
  lastExecuted?: string
  nextExecution?: string
  totalExecutions: number
  successfulExecutions: number
  averageExecutionDurationMs?: number
  totalTanksReconciled: number
}

export interface ReconciliationPolicyExecutionDTO {
  id: number
  policyId: number
  policyName: string
  executionStartTime: string
  executionEndTime?: string
  status: ReconciliationExecutionStatus
  tanksEvaluated: number
  discrepanciesDetected: number
  tanksReconciled: number
  reconciliationFailures: number
  totalVolumeVariance?: number
  averagePercentageVariance?: number
  executionDurationMs?: number
  errorMessage?: string
  executionResults?: string
  executionLog?: string
  discrepancies: ReconciliationDiscrepancyDTO[]
}

export interface AnalyticsDashboardDTO {
  totalPolicies: number
  activePolicies: number
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  successRate: number
  totalDiscrepanciesDetected: number
  totalDiscrepanciesResolved: number
  resolutionRate: number
  averageExecutionTime: number
  totalTanksReconciled: number
  systemHealth: string
  lastUpdated: string
  performanceMetrics: PerformanceMetricsDTO
  trendData: TrendDataPoint[]
  siteStatistics: SiteStatisticsDTO[]
}

export interface PerformanceMetricsDTO {
  executionsLast24Hours: number
  executionsLast7Days: number
  executionsLast30Days: number
  averageDiscrepanciesPerExecution: number
  averageResolutionTime: number
  peakExecutionTime: string
  mostActivePolicy: string
}

export interface TrendDataPoint {
  date: string
  value: number
}

export interface SiteStatisticsDTO {
  siteId: number
  siteName: string
  tanksCount: number
  executionsCount: number
  discrepanciesCount: number
  successRate: number
}
//utilsimport {
  ReconciliationExecutionStatus,
  DiscrepancySeverity,
  ReconciliationPolicyType,
} from "../types/reconciliation-types"

export const getStatusDisplayName = (status: ReconciliationExecutionStatus): string => {
  switch (status) {
    case ReconciliationExecutionStatus.Pending:
      return "Pending"
    case ReconciliationExecutionStatus.Running:
      return "Running"
    case ReconciliationExecutionStatus.Completed:
      return "Completed"
    case ReconciliationExecutionStatus.Failed:
      return "Failed"
    case ReconciliationExecutionStatus.Cancelled:
      return "Cancelled"
    default:
      return "Unknown"
  }
}

export const getSeverityDisplayName = (severity: DiscrepancySeverity): string => {
  switch (severity) {
    case DiscrepancySeverity.Low:
      return "Low"
    case DiscrepancySeverity.Medium:
      return "Medium"
    case DiscrepancySeverity.High:
      return "High"
    case DiscrepancySeverity.Critical:
      return "Critical"
    default:
      return "Unknown"
  }
}

export const getPolicyTypeDisplayName = (type: ReconciliationPolicyType): string => {
  switch (type) {
    case ReconciliationPolicyType.Scheduled:
      return "Scheduled"
    case ReconciliationPolicyType.Threshold:
      return "Threshold"
    case ReconciliationPolicyType.Hybrid:
      return "Hybrid"
    case ReconciliationPolicyType.EventDriven:
      return "Event Driven"
    default:
      return "Unknown"
  }
}

export const getStatusColor = (status: ReconciliationExecutionStatus): string => {
  switch (status) {
    case ReconciliationExecutionStatus.Completed:
      return "text-green-600"
    case ReconciliationExecutionStatus.Running:
      return "text-blue-600"
    case ReconciliationExecutionStatus.Failed:
      return "text-red-600"
    case ReconciliationExecutionStatus.Pending:
      return "text-orange-600"
    case ReconciliationExecutionStatus.Cancelled:
      return "text-gray-600"
    default:
      return "text-gray-600"
  }
}

export const getSeverityColor = (severity: DiscrepancySeverity): string => {
  switch (severity) {
    case DiscrepancySeverity.Critical:
      return "bg-red-100 text-red-800 border-red-200"
    case DiscrepancySeverity.High:
      return "bg-orange-100 text-orange-800 border-orange-200"
    case DiscrepancySeverity.Medium:
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case DiscrepancySeverity.Low:
      return "bg-green-100 text-green-800 border-green-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

export const formatDuration = (durationMs?: number): string => {
  if (!durationMs) return "N/A"

  const minutes = Math.floor(durationMs / 60000)
  const seconds = Math.floor((durationMs % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString()
}

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString()
}

export const calculateSuccessRate = (successful: number, total: number): number => {
  if (total === 0) return 0
  return Math.round((successful / total) * 100 * 10) / 10
}

