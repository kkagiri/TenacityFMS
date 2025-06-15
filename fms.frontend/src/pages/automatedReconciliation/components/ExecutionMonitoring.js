import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Progress } from "../../../components/ui/progress";
import { mockExecutions } from "../mockData";

const ExecutionMonitoring = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("today");

  // Using mock data instead of hardcoded sample data
  const executions = mockExecutions.map(execution => ({
    ...execution,
    executionStartTime: execution.startTime,
    executionEndTime: execution.endTime,
    tanksEvaluated: execution.tanksProcessed,
    discrepanciesFound: execution.discrepanciesFound || 0,
    reconciliationsPerformed: execution.discrepanciesFound || 0,
    totalTanks: execution.totalTanks,
      performanceMetrics: {
      totalProcessingTimeMs: Math.floor(Math.random() * 1000000) + 300000,
      averageProcessingTimePerTank: Math.floor(Math.random() * 50000) + 15000,
      databaseQueryCount: Math.floor(Math.random() * 200) + 50,
      memoryUsageMB: Math.random() * 50 + 20,
      },
      results: {
      successfulReconciliations: execution.discrepanciesFound || 0,
        failedReconciliations: 0,
      skippedTanks: Math.floor(Math.random() * 3),
      totalVolumeReconciled: Math.random() * 200 + 50,
      significantDiscrepancies: Math.floor(Math.random() * 2),
      },
         errorDetails: execution.executionDetails?.errorMessage || null,
   }));

  const filteredExecutions = executions.filter((execution) => {
    const matchesSearch = execution.policyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || execution.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case "Completed":
        return <i className="fa-light fa-circle-check tw-h-4 tw-w-4 tw-text-green-600"></i>;
      case "Running":
        return <i className="fa-light fa-play tw-h-4 tw-w-4 tw-text-blue-600"></i>;
      case "Failed":
        return <i className="fa-light fa-circle-xmark tw-h-4 tw-w-4 tw-text-red-600"></i>;
      case "Pending":
        return <i className="fa-light fa-clock tw-h-4 tw-w-4 tw-text-orange-600"></i>;
      default:
        return <i className="fa-light fa-triangle-exclamation tw-h-4 tw-w-4 tw-text-gray-600"></i>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Completed":
        return <Badge className="tw-bg-green-100 tw-text-green-800 tw-border-green-200">{status}</Badge>;
      case "Running":
        return <Badge className="tw-bg-blue-100 tw-text-blue-800 tw-border-blue-200">{status}</Badge>;
      case "Failed":
        return <Badge variant="destructive">{status}</Badge>;
      case "Pending":
        return <Badge className="tw-bg-orange-100 tw-text-orange-800 tw-border-orange-200">{status}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDuration = (durationMs) => {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="tw-space-y-6">
      {/* Header */}
      <div className="tw-flex tw-flex-col sm:tw-flex-row tw-justify-between tw-items-start sm:tw-items-center tw-space-y-4 sm:tw-space-y-0">
        <div>
          <h2 className="tw-text-2xl tw-font-bold">Execution Monitoring</h2>
          <p className="tw-text-gray-600">Monitor policy executions and system performance</p>
        </div>
        <Button>
          <i className="fa-light fa-play tw-h-4 tw-w-4 tw-mr-2"></i>
          Manual Trigger
        </Button>
      </div>

      {/* Real-time Status */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-4 tw-gap-4">
        <Card>
          <CardHeader className="tw-flex tw-flex-row tw-items-center tw-justify-between tw-space-y-0 tw-pb-2">
            <CardTitle className="tw-text-sm tw-font-medium">Currently Running</CardTitle>
            <i className="fa-light fa-play tw-h-4 tw-w-4 tw-text-blue-600"></i>
          </CardHeader>
          <CardContent>
            <div className="tw-text-2xl tw-font-bold tw-text-blue-600">1</div>
            <p className="tw-text-xs tw-text-muted-foreground">Active executions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="tw-flex tw-flex-row tw-items-center tw-justify-between tw-space-y-0 tw-pb-2">
            <CardTitle className="tw-text-sm tw-font-medium">Completed Today</CardTitle>
            <i className="fa-light fa-circle-check tw-h-4 tw-w-4 tw-text-green-600"></i>
          </CardHeader>
          <CardContent>
            <div className="tw-text-2xl tw-font-bold tw-text-green-600">12</div>
            <p className="tw-text-xs tw-text-muted-foreground">Successful executions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="tw-flex tw-flex-row tw-items-center tw-justify-between tw-space-y-0 tw-pb-2">
            <CardTitle className="tw-text-sm tw-font-medium">Failed Today</CardTitle>
            <i className="fa-light fa-circle-xmark tw-h-4 tw-w-4 tw-text-red-600"></i>
          </CardHeader>
          <CardContent>
            <div className="tw-text-2xl tw-font-bold tw-text-red-600">1</div>
            <p className="tw-text-xs tw-text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="tw-flex tw-flex-row tw-items-center tw-justify-between tw-space-y-0 tw-pb-2">
            <CardTitle className="tw-text-sm tw-font-medium">Avg Duration</CardTitle>
            <i className="fa-light fa-clock tw-h-4 tw-w-4 tw-text-purple-600"></i>
          </CardHeader>
          <CardContent>
            <div className="tw-text-2xl tw-font-bold tw-text-purple-600">12:34</div>
            <p className="tw-text-xs tw-text-muted-foreground">Minutes:seconds</p>
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
                  placeholder="Search executions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="tw-pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="tw-w-full sm:tw-w-40">
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
              <SelectTrigger className="tw-w-full sm:tw-w-32">
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
      <div className="tw-space-y-4">
        {filteredExecutions.map((execution) => (
          <Card key={execution.id}>
            <CardContent className="tw-pt-6">
              <div className="tw-space-y-4">
                {/* Header */}
                <div className="tw-flex tw-flex-col lg:tw-flex-row lg:tw-items-center tw-justify-between tw-space-y-4 lg:tw-space-y-0">
                  <div className="tw-flex tw-items-center tw-space-x-4">
                    {getStatusIcon(execution.status)}
                    <div>
                      <h3 className="tw-text-lg tw-font-semibold">{execution.policyName}</h3>
                      <p className="tw-text-sm tw-text-gray-600">Execution ID: {execution.id}</p>
                    </div>
                    {getStatusBadge(execution.status)}
                  </div>
                  <div className="tw-flex tw-space-x-2">
                    <Button size="sm" variant="outline">
                      <i className="fa-light fa-eye tw-h-3 tw-w-3 tw-mr-1"></i>
                      View Details
                    </Button>
                    {execution.status === "Running" && (
                      <Button size="sm" variant="outline" className="tw-text-orange-600">
                        <i className="fa-light fa-pause tw-h-3 tw-w-3 tw-mr-1"></i>
                        Pause
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress for Running Executions */}
                {execution.status === "Running" && execution.progress && (
                  <div className="tw-space-y-2">
                    <div className="tw-flex tw-justify-between tw-text-sm tw-text-gray-600">
                      <span>
                        Progress: {execution.tanksEvaluated}/{execution.totalTanks} tanks
                      </span>
                      <span>{execution.progress}%</span>
                    </div>
                    <Progress value={execution.progress} className="tw-h-2" />
                  </div>
                )}

                {/* Metrics Grid */}
                <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 lg:tw-grid-cols-6 tw-gap-4 tw-text-sm">
                  <div>
                    <p className="tw-text-gray-500">Tanks Evaluated</p>
                    <p className="tw-font-medium">{execution.tanksEvaluated}</p>
                  </div>
                  <div>
                    <p className="tw-text-gray-500">Discrepancies</p>
                    <p className="tw-font-medium tw-text-orange-600">{execution.discrepanciesFound}</p>
                  </div>
                  <div>
                    <p className="tw-text-gray-500">Reconciliations</p>
                    <p className="tw-font-medium tw-text-green-600">{execution.reconciliationsPerformed}</p>
                  </div>
                  <div>
                    <p className="tw-text-gray-500">Volume Reconciled</p>
                    <p className="tw-font-medium">{execution.results.totalVolumeReconciled}L</p>
                  </div>
                  <div>
                    <p className="tw-text-gray-500">Processing Time</p>
                    <p className="tw-font-medium">{formatDuration(execution.performanceMetrics.totalProcessingTimeMs)}</p>
                  </div>
                  <div>
                    <p className="tw-text-gray-500">Memory Usage</p>
                    <p className="tw-font-medium">{execution.performanceMetrics.memoryUsageMB.toFixed(1)}MB</p>
                  </div>
                </div>

                {/* Timing Information */}
                <div className="tw-flex tw-flex-col sm:tw-flex-row sm:tw-justify-between tw-text-xs tw-text-gray-500 tw-pt-2 tw-border-t">
                  <span>Started: {new Date(execution.executionStartTime).toLocaleString()}</span>
                  {execution.executionEndTime && (
                    <span>Completed: {new Date(execution.executionEndTime).toLocaleString()}</span>
                  )}
                </div>

                {/* Error Details */}
                {execution.errorDetails && (
                  <div className="tw-p-3 tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg">
                    <div className="tw-flex tw-items-center tw-space-x-2 tw-mb-2">
                      <i className="fa-light fa-circle-xmark tw-h-4 tw-w-4 tw-text-red-600"></i>
                      <span className="tw-font-medium tw-text-red-900">Error Details</span>
                    </div>
                    <p className="tw-text-sm tw-text-red-700">{execution.errorDetails}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredExecutions.length === 0 && (
        <Card>
          <CardContent className="tw-pt-6">
            <div className="tw-text-center tw-py-8">
              <i className="fa-light fa-filter tw-h-12 tw-w-12 tw-text-gray-400 tw-mx-auto tw-mb-4"></i>
              <h3 className="tw-text-lg tw-font-medium tw-text-gray-900 tw-mb-2">No executions found</h3>
              <p className="tw-text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExecutionMonitoring;