import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Progress } from "../../../components/ui/progress";
import { mockPolicyMetrics, mockPerformanceMetrics } from "../mockData";

const EnhancedManagerDashboard = () => {
  // Using mock data instead of hardcoded sample data
  const policyMetrics = mockPolicyMetrics;
  const performanceMetrics = mockPerformanceMetrics;

  return (
    <div className="tw-space-y-6">
      {/* Performance Overview */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-4 tw-gap-4">
        <Card>
          <CardHeader className="tw-flex tw-flex-row tw-items-center tw-justify-between tw-space-y-0 tw-pb-2">
            <CardTitle className="tw-text-sm tw-font-medium">Total Policies</CardTitle>
            <i className="fa-light fa-gear tw-text-blue-600"></i>
          </CardHeader>
          <CardContent>
            <div className="tw-text-2xl tw-font-bold">{performanceMetrics.totalPolicies}</div>
            <p className="tw-text-xs tw-text-gray-500">{performanceMetrics.activePolicies} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="tw-flex tw-flex-row tw-items-center tw-justify-between tw-space-y-0 tw-pb-2">
            <CardTitle className="tw-text-sm tw-font-medium">Success Rate</CardTitle>
            <i className="fa-light fa-trending-up tw-text-green-600"></i>
          </CardHeader>
          <CardContent>
            <div className="tw-text-2xl tw-font-bold tw-text-green-600">{performanceMetrics.averageSuccessRate}%</div>
            <p className="tw-text-xs tw-text-gray-500">+2.3% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="tw-flex tw-flex-row tw-items-center tw-justify-between tw-space-y-0 tw-pb-2">
            <CardTitle className="tw-text-sm tw-font-medium">Total Executions</CardTitle>
            <i className="fa-light fa-chart-line tw-text-purple-600"></i>
          </CardHeader>
          <CardContent>
            <div className="tw-text-2xl tw-font-bold">{performanceMetrics.totalExecutions}</div>
            <p className="tw-text-xs tw-text-gray-500">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="tw-flex tw-flex-row tw-items-center tw-justify-between tw-space-y-0 tw-pb-2">
            <CardTitle className="tw-text-sm tw-font-medium">System Efficiency</CardTitle>
            <i className="fa-light fa-bolt tw-text-blue-600"></i>
          </CardHeader>
          <CardContent>
            <div className="tw-text-2xl tw-font-bold tw-text-blue-600">{performanceMetrics.systemEfficiency}%</div>
            <p className="tw-text-xs tw-text-gray-500">Processing efficiency</p>
          </CardContent>
        </Card>
      </div>

      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-3 tw-gap-6">
        {/* Policy Management */}
        <div className="lg:tw-col-span-2">
          <Card>
            <CardHeader>
              <div className="tw-flex tw-items-center tw-justify-between">
                <div>
                  <CardTitle>Policy Management</CardTitle>
                  <CardDescription>Configure and monitor reconciliation policies</CardDescription>
                </div>
                <Button>
                  <i className="fa-light fa-plus tw-mr-2"></i>
                  New Policy
                </Button>
              </div>
            </CardHeader>
            <CardContent className="tw-space-y-4">
              {policyMetrics.map((policy) => (
                <div key={policy.id} className="tw-border tw-rounded-lg tw-p-4 tw-space-y-3">
                  <div className="tw-flex tw-items-center tw-justify-between">
                    <div className="tw-flex tw-items-center tw-space-x-3">
                      <h4 className="tw-font-medium">{policy.name}</h4>
                      <Badge variant="outline">{policy.type}</Badge>
                      <Badge variant={policy.isActive ? "default" : "secondary"}>
                        {policy.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <Button size="sm" variant="outline">
                      <i className="fa-light fa-edit tw-mr-1"></i>
                      Edit
                    </Button>
                  </div>

                  <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-4 tw-text-sm">
                    <div>
                      <p className="tw-text-gray-500">Success Rate</p>
                      <p className="tw-font-medium tw-text-green-600">{policy.successRate}%</p>
                    </div>
                    <div>
                      <p className="tw-text-gray-500">Executions</p>
                      <p className="tw-font-medium">{policy.executionCount}</p>
                    </div>
                    <div>
                      <p className="tw-text-gray-500">Tanks in Scope</p>
                      <p className="tw-font-medium">{policy.tanksInScope}</p>
                    </div>
                    <div>
                      <p className="tw-text-gray-500">Next Execution</p>
                      <p className="tw-font-medium">
                        {policy.nextExecution === "On Threshold"
                          ? "On Threshold"
                          : policy.nextExecution === "Inactive"
                            ? "Inactive"
                            : "Tomorrow 2:00 AM"}
                      </p>
                    </div>
                  </div>

                  <div className="tw-space-y-2">
                    <div className="tw-flex tw-justify-between tw-text-xs tw-text-gray-500">
                      <span>Performance</span>
                      <span>{policy.successRate}%</span>
                    </div>
                    <Progress value={policy.successRate} className="tw-h-2" />
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
          <CardContent className="tw-space-y-6">
            <div className="tw-space-y-4">
              <div className="tw-flex tw-items-center tw-justify-between">
                <div className="tw-flex tw-items-center tw-space-x-2">
                  <i className="fa-light fa-trending-up tw-text-green-600"></i>
                  <span className="tw-text-sm">Improving</span>
                </div>
                <span className="tw-text-sm tw-font-medium">{performanceMetrics.trendsImproving} policies</span>
              </div>

              <div className="tw-flex tw-items-center tw-justify-between">
                <div className="tw-flex tw-items-center tw-space-x-2">
                  <i className="fa-light fa-chart-line tw-text-blue-600"></i>
                  <span className="tw-text-sm">Stable</span>
                </div>
                <span className="tw-text-sm tw-font-medium">{performanceMetrics.trendsStable} policies</span>
              </div>

              <div className="tw-flex tw-items-center tw-justify-between">
                <div className="tw-flex tw-items-center tw-space-x-2">
                  <i className="fa-light fa-trending-down tw-text-red-600"></i>
                  <span className="tw-text-sm">Needs Attention</span>
                </div>
                <span className="tw-text-sm tw-font-medium">{performanceMetrics.trendsDecreasing} policies</span>
              </div>
            </div>

            <div className="tw-pt-4 tw-border-t">
              <h4 className="tw-font-medium tw-mb-3">Optimization Recommendations</h4>
              <div className="tw-space-y-3 tw-text-sm">
                <div className="tw-p-3 tw-bg-blue-50 tw-rounded-lg">
                  <p className="tw-font-medium tw-text-blue-900">Schedule Optimization</p>
                  <p className="tw-text-blue-700">Consider adjusting execution times for better resource utilization</p>
                </div>
                <div className="tw-p-3 tw-bg-yellow-50 tw-rounded-lg">
                  <p className="tw-font-medium tw-text-yellow-900">Threshold Review</p>
                  <p className="tw-text-yellow-700">
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
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-4 tw-gap-4">
            <Button variant="outline" className="tw-h-20 tw-flex-col tw-space-y-2">
              <i className="fa-light fa-plus tw-text-xl"></i>
              <span>Create Policy</span>
            </Button>
            <Button variant="outline" className="tw-h-20 tw-flex-col tw-space-y-2">
              <i className="fa-light fa-gear tw-text-xl"></i>
              <span>System Config</span>
            </Button>
            <Button variant="outline" className="tw-h-20 tw-flex-col tw-space-y-2">
              <i className="fa-light fa-chart-line tw-text-xl"></i>
              <span>Performance Report</span>
            </Button>
            <Button variant="outline" className="tw-h-20 tw-flex-col tw-space-y-2">
              <i className="fa-light fa-trending-up tw-text-xl"></i>
              <span>Optimization Analysis</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedManagerDashboard;