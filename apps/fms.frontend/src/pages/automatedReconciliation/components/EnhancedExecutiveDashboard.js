import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Progress } from "../../../components/ui/progress";
import { mockBusinessMetrics, mockKpiData } from "../mockData";

const EnhancedExecutiveDashboard = () => {
  // Using mock data instead of hardcoded sample data
  const businessMetrics = mockBusinessMetrics;
  const kpiData = mockKpiData;

  return (
    <div className="tw-space-y-6">
      {/* Executive KPIs */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4">
        {kpiData.map((kpi, index) => (
          <Card key={index}>
            <CardHeader className="tw-flex tw-flex-row tw-items-center tw-justify-between tw-space-y-0 tw-pb-2">
              <CardTitle className="tw-text-sm tw-font-medium">{kpi.title}</CardTitle>
              <i className={`fa-light ${kpi.icon} tw-text-blue-600`}></i>
            </CardHeader>
            <CardContent>
              <div className="tw-text-2xl tw-font-bold">{kpi.value}</div>
              <div className="tw-flex tw-items-center tw-space-x-2 tw-text-xs">
                <span className={`tw-flex tw-items-center ${
                  kpi.trend === "up" ? "tw-text-green-600" : "tw-text-red-600"
                }`}>
                  {kpi.trend === "up" ? (
                    <i className="fa-light fa-trending-up tw-mr-1"></i>
                  ) : (
                    <i className="fa-light fa-trending-down tw-mr-1"></i>
                  )}
                  {kpi.change}
                </span>
                <span className="tw-text-gray-500">vs last month</span>
              </div>
              <p className="tw-text-xs tw-text-gray-500 tw-mt-1">{kpi.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6">
        {/* Business Impact Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Business Impact Summary</CardTitle>
            <CardDescription>Key performance indicators and ROI metrics</CardDescription>
          </CardHeader>
          <CardContent className="tw-space-y-6">
            <div className="tw-space-y-4">
              <div className="tw-flex tw-justify-between tw-items-center">
                <span className="tw-text-sm tw-font-medium">System Uptime</span>
                <span className="tw-text-sm tw-font-bold tw-text-green-600">{businessMetrics.systemUptime}%</span>
              </div>
              <Progress value={businessMetrics.systemUptime} className="tw-h-2" />
            </div>

            <div className="tw-space-y-4">
              <div className="tw-flex tw-justify-between tw-items-center">
                <span className="tw-text-sm tw-font-medium">Processing Efficiency</span>
                <span className="tw-text-sm tw-font-bold tw-text-blue-600">{businessMetrics.processingEfficiency}%</span>
              </div>
              <Progress value={businessMetrics.processingEfficiency} className="tw-h-2" />
            </div>

            <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-pt-4 tw-border-t">
              <div className="tw-text-center">
                <p className="tw-text-2xl tw-font-bold tw-text-blue-600">
                  {businessMetrics.totalReconciliationsPerformed.toLocaleString()}
                </p>
                <p className="tw-text-xs tw-text-gray-500">Total Reconciliations</p>
              </div>
              <div className="tw-text-center">
                <p className="tw-text-2xl tw-font-bold tw-text-green-600">
                  {businessMetrics.totalVolumeReconciled.toLocaleString()}L
                </p>
                <p className="tw-text-xs tw-text-gray-500">Volume Reconciled</p>
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
          <CardContent className="tw-space-y-6">
            <div className="tw-space-y-4">
              <div className="tw-flex tw-items-center tw-justify-between tw-p-3 tw-bg-green-50 tw-rounded-lg">
                <div className="tw-flex tw-items-center tw-space-x-3">
                  <i className="fa-light fa-trending-down tw-text-green-600"></i>
                  <div>
                    <p className="tw-font-medium tw-text-green-900">Discrepancy Trend</p>
                    <p className="tw-text-sm tw-text-green-700">Decreasing</p>
                  </div>
                </div>
                <Badge variant="outline" className="tw-bg-green-100 tw-text-green-800 tw-border-green-200">
                  Excellent
                </Badge>
              </div>

              <div className="tw-flex tw-items-center tw-justify-between tw-p-3 tw-bg-blue-50 tw-rounded-lg">
                <div className="tw-flex tw-items-center tw-space-x-3">
                  <i className="fa-light fa-trending-up tw-text-blue-600"></i>
                  <div>
                    <p className="tw-font-medium tw-text-blue-900">System Performance</p>
                    <p className="tw-text-sm tw-text-blue-700">Improving</p>
                  </div>
                </div>
                <Badge variant="outline" className="tw-bg-blue-100 tw-text-blue-800 tw-border-blue-200">
                  Good
                </Badge>
              </div>

              <div className="tw-flex tw-items-center tw-justify-between tw-p-3 tw-bg-gray-50 tw-rounded-lg">
                <div className="tw-flex tw-items-center tw-space-x-3">
                  <i className="fa-light fa-target tw-text-gray-600"></i>
                  <div>
                    <p className="tw-font-medium tw-text-gray-900">Policy Effectiveness</p>
                    <p className="tw-text-sm tw-text-gray-700">Stable</p>
                  </div>
                </div>
                <Badge variant="outline" className="tw-bg-gray-100 tw-text-gray-800 tw-border-gray-200">
                  Stable
                </Badge>
              </div>

              <div className="tw-flex tw-items-center tw-justify-between tw-p-3 tw-bg-purple-50 tw-rounded-lg">
                <div className="tw-flex tw-items-center tw-space-x-3">
                  <i className="fa-light fa-trending-up tw-text-purple-600"></i>
                  <div>
                    <p className="tw-font-medium tw-text-purple-900">Resource Utilization</p>
                    <p className="tw-text-sm tw-text-purple-700">Optimizing</p>
                  </div>
                </div>
                <Badge variant="outline" className="tw-bg-purple-100 tw-text-purple-800 tw-border-purple-200">
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
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-6">
            <div className="tw-text-center tw-p-6 tw-bg-green-50 tw-rounded-lg">
              <i className="fa-light fa-dollar-sign tw-text-green-600 tw-text-3xl tw-mb-2"></i>
              <p className="tw-text-2xl tw-font-bold tw-text-green-600">
                ${businessMetrics.estimatedCostSavings.toLocaleString()}
              </p>
              <p className="tw-text-sm tw-text-green-700 tw-font-medium">Monthly Savings</p>
              <p className="tw-text-xs tw-text-green-600 tw-mt-1">18.5% increase from last month</p>
            </div>

            <div className="tw-text-center tw-p-6 tw-bg-blue-50 tw-rounded-lg">
              <i className="fa-light fa-clock tw-text-blue-600 tw-text-3xl tw-mb-2"></i>
              <p className="tw-text-2xl tw-font-bold tw-text-blue-600">
                {businessMetrics.estimatedManualHoursSaved.toFixed(0)}h
              </p>
              <p className="tw-text-sm tw-text-blue-700 tw-font-medium">Time Saved</p>
              <p className="tw-text-xs tw-text-blue-600 tw-mt-1">Equivalent to 1.8 FTE positions</p>
            </div>

            <div className="tw-text-center tw-p-6 tw-bg-purple-50 tw-rounded-lg">
              <i className="fa-light fa-target tw-text-purple-600 tw-text-3xl tw-mb-2"></i>
              <p className="tw-text-2xl tw-font-bold tw-text-purple-600">+{businessMetrics.dataQualityImprovement}%</p>
              <p className="tw-text-sm tw-text-purple-700 tw-font-medium">Quality Improvement</p>
              <p className="tw-text-xs tw-text-purple-600 tw-mt-1">Data accuracy enhancement</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedExecutiveDashboard;