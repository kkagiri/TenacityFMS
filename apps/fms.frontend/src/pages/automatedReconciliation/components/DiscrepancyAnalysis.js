import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Progress } from "../../../components/ui/progress";
import { mockDiscrepancies, mockAnalytics } from "../mockData";

const DiscrepancyAnalysis = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Using mock data instead of hardcoded sample data
  const discrepancies = mockDiscrepancies;
  const analytics = mockAnalytics;

  const filteredDiscrepancies = discrepancies.filter((discrepancy) => {
    const matchesSearch =
      discrepancy.tankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      discrepancy.siteName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity =
      severityFilter === "all" || discrepancy.severity.toLowerCase() === severityFilter.toLowerCase();
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "resolved" && discrepancy.resolutionDetails.isResolved) ||
      (statusFilter === "unresolved" && !discrepancy.resolutionDetails.isResolved);

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case "Critical":
        return <Badge className="tw-bg-red-100 tw-text-red-800 tw-border-red-200">{severity}</Badge>;
      case "High":
        return <Badge className="tw-bg-orange-100 tw-text-orange-800 tw-border-orange-200">{severity}</Badge>;
      case "Medium":
        return <Badge className="tw-bg-yellow-100 tw-text-yellow-800 tw-border-yellow-200">{severity}</Badge>;
      case "Low":
        return <Badge className="tw-bg-green-100 tw-text-green-800 tw-border-green-200">{severity}</Badge>;
      default:
        return <Badge variant="secondary">{severity}</Badge>;
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case "Increasing":
        return <i className="fa-light fa-trending-up tw-text-red-600"></i>;
      case "Decreasing":
        return <i className="fa-light fa-trending-down tw-text-green-600"></i>;
      default:
        return <div className="tw-h-4 tw-w-4 tw-bg-blue-600 tw-rounded-full" />;
    }
  };

  return (
    <div className="tw-space-y-6">
      {/* Header */}
      <div className="tw-flex tw-flex-col sm:tw-flex-row tw-justify-between tw-items-start sm:tw-items-center tw-space-y-4 sm:tw-space-y-0">
        <div>
          <h2 className="tw-text-2xl tw-font-bold">Discrepancy Analysis</h2>
          <p className="tw-text-gray-600">Analyze and resolve tank volume discrepancies</p>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-4 tw-gap-4">
        <Card>
          <CardHeader className="tw-flex tw-flex-row tw-items-center tw-justify-between tw-space-y-0 tw-pb-2">
            <CardTitle className="tw-text-sm tw-font-medium">Total Discrepancies</CardTitle>
            <i className="fa-light fa-triangle-exclamation tw-h-4 tw-w-4 tw-text-orange-600"></i>
          </CardHeader>
          <CardContent>
            <div className="tw-text-2xl tw-font-bold">{analytics.totalDiscrepancies}</div>
            <p className="tw-text-xs tw-text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="tw-flex tw-flex-row tw-items-center tw-justify-between tw-space-y-0 tw-pb-2">
            <CardTitle className="tw-text-sm tw-font-medium">Resolution Rate</CardTitle>
            <i className="fa-light fa-circle-check tw-h-4 tw-w-4 tw-text-green-600"></i>
          </CardHeader>
          <CardContent>
            <div className="tw-text-2xl tw-font-bold tw-text-green-600">
              {((analytics.resolvedDiscrepancies / analytics.totalDiscrepancies) * 100).toFixed(1)}%
            </div>
            <p className="tw-text-xs tw-text-muted-foreground">
              {analytics.resolvedDiscrepancies} of {analytics.totalDiscrepancies} resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="tw-flex tw-flex-row tw-items-center tw-justify-between tw-space-y-0 tw-pb-2">
            <CardTitle className="tw-text-sm tw-font-medium">Avg Resolution Time</CardTitle>
            <i className="fa-light fa-rotate tw-h-4 tw-w-4 tw-text-blue-600"></i>
          </CardHeader>
          <CardContent>
            <div className="tw-text-2xl tw-font-bold tw-text-blue-600">{analytics.averageResolutionTime}</div>
            <p className="tw-text-xs tw-text-muted-foreground">Minutes:seconds</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="tw-flex tw-flex-row tw-items-center tw-justify-between tw-space-y-0 tw-pb-2">
            <CardTitle className="tw-text-sm tw-font-medium">High Severity</CardTitle>
            <i className="fa-light fa-triangle-exclamation tw-h-4 tw-w-4 tw-text-red-600"></i>
          </CardHeader>
          <CardContent>
            <div className="tw-text-2xl tw-font-bold tw-text-red-600">
              {analytics.severityDistribution.High + analytics.severityDistribution.Critical}
            </div>
            <p className="tw-text-xs tw-text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-3 tw-gap-6">
        {/* Severity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Severity Distribution</CardTitle>
            <CardDescription>Breakdown by discrepancy severity</CardDescription>
          </CardHeader>
          <CardContent className="tw-space-y-4">
            {Object.entries(analytics.severityDistribution).map(([severity, count]) => (
              <div key={severity} className="tw-space-y-2">
                <div className="tw-flex tw-justify-between tw-text-sm">
                  <span className="tw-flex tw-items-center tw-space-x-2">
                    {getSeverityBadge(severity)}
                    <span>{severity}</span>
                  </span>
                  <span className="tw-font-medium">{count}</span>
                </div>
                <Progress value={(count / analytics.totalDiscrepancies) * 100} className="tw-h-2" />
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
          <CardContent className="tw-space-y-4">
            <div className="tw-flex tw-items-center tw-justify-between tw-p-3 tw-bg-red-50 tw-rounded-lg">
              <div className="tw-flex tw-items-center tw-space-x-3">
                <i className="fa-light fa-trending-up tw-h-5 tw-w-5 tw-text-red-600"></i>
                <div>
                  <p className="tw-font-medium tw-text-red-900">Increasing</p>
                  <p className="tw-text-sm tw-text-red-700">Worsening trends</p>
                </div>
              </div>
              <span className="tw-text-lg tw-font-bold tw-text-red-600">{analytics.trendSummary.increasingTrend}</span>
            </div>

            <div className="tw-flex tw-items-center tw-justify-between tw-p-3 tw-bg-blue-50 tw-rounded-lg">
              <div className="tw-flex tw-items-center tw-space-x-3">
                <div className="tw-h-5 tw-w-5 tw-bg-blue-600 tw-rounded-full" />
                <div>
                  <p className="tw-font-medium tw-text-blue-900">Stable</p>
                  <p className="tw-text-sm tw-text-blue-700">Consistent patterns</p>
                </div>
              </div>
              <span className="tw-text-lg tw-font-bold tw-text-blue-600">{analytics.trendSummary.stableTrend}</span>
            </div>

            <div className="tw-flex tw-items-center tw-justify-between tw-p-3 tw-bg-green-50 tw-rounded-lg">
              <div className="tw-flex tw-items-center tw-space-x-3">
                <i className="fa-light fa-trending-down tw-h-5 tw-w-5 tw-text-green-600"></i>
                <div>
                  <p className="tw-font-medium tw-text-green-900">Decreasing</p>
                  <p className="tw-text-sm tw-text-green-700">Improving trends</p>
                </div>
              </div>
              <span className="tw-text-lg tw-font-bold tw-text-green-600">{analytics.trendSummary.decreasingTrend}</span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common analysis tasks</CardDescription>
          </CardHeader>
          <CardContent className="tw-space-y-3">
            <Button variant="outline" className="tw-w-full tw-justify-start">
              <i className="fa-light fa-triangle-exclamation tw-h-4 tw-w-4 tw-mr-2"></i>
              View Critical Discrepancies
            </Button>
            <Button variant="outline" className="tw-w-full tw-justify-start">
              <i className="fa-light fa-trending-up tw-h-4 tw-w-4 tw-mr-2"></i>
              Trend Analysis Report
            </Button>
            <Button variant="outline" className="tw-w-full tw-justify-start">
              <i className="fa-light fa-rotate tw-h-4 tw-w-4 tw-mr-2"></i>
              Bulk Reconciliation
            </Button>
            <Button variant="outline" className="tw-w-full tw-justify-start">
              <i className="fa-light fa-eye tw-h-4 tw-w-4 tw-mr-2"></i>
              Export Analysis
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="tw-pt-6">
          <div className="tw-flex tw-flex-col sm:tw-flex-row tw-space-y-4 sm:tw-space-y-0 sm:tw-space-x-4">
            <div className="tw-flex-1">
              <div className="tw-relative">
                <i className="fa-light fa-search tw-absolute tw-left-3 tw-top-1/2 tw-transform tw--translate-y-1/2 tw-h-4 tw-w-4 tw-text-gray-400"></i>
                <Input
                  placeholder="Search by tank or site..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="tw-pl-10"
                />
              </div>
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="tw-w-full sm:tw-w-40">
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
              <SelectTrigger className="tw-w-full sm:tw-w-32">
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
      <div className="tw-space-y-4">
        {filteredDiscrepancies.map((discrepancy) => (
          <Card key={discrepancy.id}>
            <CardContent className="tw-pt-6">
              <div className="tw-space-y-4">
                {/* Header */}
                <div className="tw-flex tw-flex-col lg:tw-flex-row lg:tw-items-center tw-justify-between tw-space-y-4 lg:tw-space-y-0">
                  <div className="tw-flex tw-items-center tw-space-x-4">
                    <i className="fa-light fa-triangle-exclamation tw-h-5 tw-w-5 tw-text-orange-600"></i>
                    <div>
                      <h3 className="tw-text-lg tw-font-semibold">{discrepancy.tankName}</h3>
                      <p className="tw-text-sm tw-text-gray-600">{discrepancy.siteName}</p>
                    </div>
                    {getSeverityBadge(discrepancy.severity)}
                    {discrepancy.resolutionDetails.isResolved ? (
                      <Badge className="tw-bg-green-100 tw-text-green-800 tw-border-green-200">
                        <i className="fa-light fa-circle-check tw-h-3 tw-w-3 tw-mr-1"></i>
                        Resolved
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="tw-bg-red-50 tw-text-red-700 tw-border-red-200">
                        Unresolved
                      </Badge>
                    )}
                  </div>
                  <div className="tw-flex tw-space-x-2">
                    <Button size="sm" variant="outline">
                      <i className="fa-light fa-eye tw-h-3 tw-w-3 tw-mr-1"></i>
                      Details
                    </Button>
                    {!discrepancy.resolutionDetails.isResolved && (
                      <Button size="sm" variant="outline" className="tw-text-blue-600">
                        <i className="fa-light fa-rotate tw-h-3 tw-w-3 tw-mr-1"></i>
                        Reconcile
                      </Button>
                    )}
                  </div>
                </div>

                {/* Variance Information */}
                <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-4 tw-text-sm">
                  <div>
                    <p className="tw-text-gray-500">Expected Volume</p>
                    <p className="tw-font-medium">{discrepancy.expectedVolume.toLocaleString()}L</p>
                  </div>
                  <div>
                    <p className="tw-text-gray-500">Actual Volume</p>
                    <p className="tw-font-medium">{discrepancy.actualVolume.toLocaleString()}L</p>
                  </div>
                  <div>
                    <p className="tw-text-gray-500">Variance</p>
                    <p className={`tw-font-medium ${discrepancy.varianceAmount < 0 ? "tw-text-red-600" : "tw-text-orange-600"}`}>
                      {discrepancy.varianceAmount > 0 ? "+" : ""}
                      {discrepancy.varianceAmount}L ({discrepancy.variancePercentage > 0 ? "+" : ""}
                      {discrepancy.variancePercentage}%)
                    </p>
                  </div>
                  <div>
                    <p className="tw-text-gray-500">Cost Impact</p>
                    <p className="tw-font-medium tw-text-red-600">
                      ${discrepancy.businessImpact.estimatedCostImpact.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Trend Analysis */}
                <div className="tw-flex tw-items-center tw-justify-between tw-p-3 tw-bg-gray-50 tw-rounded-lg">
                  <div className="tw-flex tw-items-center tw-space-x-3">
                    {getTrendIcon(discrepancy.trendAnalysis.varianceTrend)}
                    <div>
                      <p className="tw-font-medium">Trend: {discrepancy.trendAnalysis.varianceTrend}</p>
                      <p className="tw-text-sm tw-text-gray-600">
                        {discrepancy.trendAnalysis.isRecurring ? "Recurring pattern detected" : "Isolated incident"}
                      </p>
                    </div>
                  </div>
                  <div className="tw-text-right tw-text-sm">
                    <p className="tw-text-gray-500">Avg Variance</p>
                    <p className="tw-font-medium">{discrepancy.trendAnalysis.averageVariance}L</p>
                  </div>
                </div>

                {/* Resolution Details */}
                {discrepancy.resolutionDetails.isResolved && (
                  <div className="tw-p-3 tw-bg-green-50 tw-border tw-border-green-200 tw-rounded-lg">
                    <div className="tw-flex tw-items-center tw-space-x-2 tw-mb-2">
                      <i className="fa-light fa-circle-check tw-h-4 tw-w-4 tw-text-green-600"></i>
                      <span className="tw-font-medium tw-text-green-900">Resolution Details</span>
                    </div>
                    <div className="tw-text-sm tw-text-green-700">
                      <p>Method: {discrepancy.resolutionDetails.resolutionMethod}</p>
                      <p>Resolved: {new Date(discrepancy.resolutionDetails.resolutionDate).toLocaleString()}</p>
                    </div>
                  </div>
                )}

                {/* Timestamp */}
                <div className="tw-text-xs tw-text-gray-500 tw-pt-2 tw-border-t">
                  Detected: {new Date(discrepancy.detectedDate).toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDiscrepancies.length === 0 && (
        <Card>
          <CardContent className="tw-pt-6">
            <div className="tw-text-center tw-py-8">
              <i className="fa-light fa-filter tw-h-12 tw-w-12 tw-text-gray-400 tw-mx-auto tw-mb-4"></i>
              <h3 className="tw-text-lg tw-font-medium tw-text-gray-900 tw-mb-2">No discrepancies found</h3>
              <p className="tw-text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DiscrepancyAnalysis;