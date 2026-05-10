import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Progress } from "../../../components/ui/progress";
import { mockCurrentExecutions, mockRecentDiscrepancies } from "../mockData";

const EnhancedOperatorDashboard = () => {
  // Using mock data instead of hardcoded sample data
  const currentExecutions = mockCurrentExecutions;
  const recentDiscrepancies = mockRecentDiscrepancies;

  return (
    <div className="tw-space-y-6">
      {/* System Status Overview */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-4 tw-gap-4">
        <Card>
          <CardHeader className="tw-flex tw-flex-row tw-items-center tw-justify-between tw-space-y-0 tw-pb-2">
            <CardTitle className="tw-text-sm tw-font-medium">Currently Running</CardTitle>
            <i className="fa-light fa-play tw-text-blue-600"></i>
          </CardHeader>
          <CardContent>
            <div className="tw-text-2xl tw-font-bold tw-text-blue-600">{currentExecutions.length}</div>
            <p className="tw-text-xs tw-text-gray-500">Active executions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="tw-flex tw-flex-row tw-items-center tw-justify-between tw-space-y-0 tw-pb-2">
            <CardTitle className="tw-text-sm tw-font-medium">Pending Alerts</CardTitle>
            <i className="fa-light fa-triangle-exclamation tw-text-red-600"></i>
          </CardHeader>
          <CardContent>
            <div className="tw-text-2xl tw-font-bold tw-text-red-600">{recentDiscrepancies.length}</div>
            <p className="tw-text-xs tw-text-gray-500">Unresolved discrepancies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="tw-flex tw-flex-row tw-items-center tw-justify-between tw-space-y-0 tw-pb-2">
            <CardTitle className="tw-text-sm tw-font-medium">Completed Today</CardTitle>
            <i className="fa-light fa-circle-check tw-text-green-600"></i>
          </CardHeader>
          <CardContent>
            <div className="tw-text-2xl tw-font-bold tw-text-green-600">12</div>
            <p className="tw-text-xs tw-text-gray-500">Successful executions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="tw-flex tw-flex-row tw-items-center tw-justify-between tw-space-y-0 tw-pb-2">
            <CardTitle className="tw-text-sm tw-font-medium">System Health</CardTitle>
            <i className="fa-light fa-circle-check tw-text-green-600"></i>
          </CardHeader>
          <CardContent>
            <div className="tw-text-2xl tw-font-bold tw-text-green-600">Healthy</div>
            <p className="tw-text-xs tw-text-gray-500">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Executions and Recent Alerts */}
      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="tw-flex tw-items-center tw-space-x-2">
              <i className="fa-light fa-play tw-text-blue-600"></i>
              <span>Current Executions</span>
            </CardTitle>
            <CardDescription>Real-time monitoring of active policy executions</CardDescription>
          </CardHeader>
          <CardContent className="tw-space-y-4">
            {currentExecutions.map((execution) => (
              <div key={execution.id} className="tw-border tw-rounded-lg tw-p-4 tw-space-y-3">
                <div className="tw-flex tw-items-center tw-justify-between">
                  <h4 className="tw-font-medium">{execution.policyName}</h4>
                  <Badge className="tw-bg-blue-100 tw-text-blue-800 tw-border-blue-200">
                    {execution.status}
                  </Badge>
                </div>
                <div className="tw-space-y-2">
                  <div className="tw-flex tw-justify-between tw-text-sm tw-text-gray-600">
                    <span>Progress: {execution.tanksProcessed}/{execution.totalTanks} tanks</span>
                    <span>{execution.progress}%</span>
                  </div>
                  <Progress value={execution.progress} className="tw-h-2" />
                </div>
                <div className="tw-flex tw-justify-between tw-text-xs tw-text-gray-500">
                  <span>Started: {execution.startTime}</span>
                  <span>ETA: {execution.estimatedCompletion}</span>
                </div>
                <div className="tw-flex tw-space-x-2">
                  <Button size="sm" variant="outline">
                    <i className="fa-light fa-pause tw-mr-1"></i>
                    Pause
                  </Button>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
            {currentExecutions.length === 0 && (
              <div className="tw-text-center tw-py-8 tw-text-gray-500">
                <i className="fa-light fa-play tw-text-4xl tw-mb-2"></i>
                <p>No active executions</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="tw-flex tw-items-center tw-space-x-2">
              <i className="fa-light fa-triangle-exclamation tw-text-red-600"></i>
              <span>Recent Discrepancy Alerts</span>
            </CardTitle>
            <CardDescription>Newly discovered discrepancies requiring attention</CardDescription>
          </CardHeader>
          <CardContent className="tw-space-y-4">
            {recentDiscrepancies.map((alert) => (
              <div key={alert.id} className="tw-border tw-rounded-lg tw-p-4 tw-space-y-2">
                <div className="tw-flex tw-items-center tw-justify-between">
                  <h4 className="tw-font-medium">{alert.tankName}</h4>
                  <Badge className="tw-bg-yellow-100 tw-text-yellow-800 tw-border-yellow-200">
                    {alert.severity}
                  </Badge>
                </div>
                <p className="tw-text-sm tw-text-gray-600">{alert.siteName}</p>
                <div className="tw-flex tw-justify-between tw-text-sm">
                  <span className="tw-font-medium tw-text-red-600">
                    Variance: {alert.variance > 0 ? "+" : ""}{alert.variance} L
                  </span>
                  <span className="tw-text-gray-500">{alert.detectedTime}</span>
                </div>
                <div className="tw-flex tw-space-x-2">
                  <Button size="sm" variant="outline">
                    Investigate
                  </Button>
                  <Button size="sm" variant="outline">
                    <i className="fa-light fa-rotate tw-mr-1"></i>
                    Reconcile
                  </Button>
                </div>
              </div>
            ))}
            {recentDiscrepancies.length === 0 && (
              <div className="tw-text-center tw-py-8 tw-text-gray-500">
                <i className="fa-light fa-circle-check tw-text-4xl tw-mb-2"></i>
                <p>No recent discrepancies</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedOperatorDashboard;