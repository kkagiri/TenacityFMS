import React, { useMemo } from 'react';
import { Chart } from 'devextreme-react/chart';
import {
  Series,
  ArgumentAxis,
  ValueAxis,
  Legend,
  Tooltip,
  CommonSeriesSettings,
  Label,
  Export
} from 'devextreme-react/chart';
import './TransferVarianceChart.scss';

const TransferVarianceChart = ({ periods }) => {
  // Transform periods data for chart
  const chartData = useMemo(() => {
    if (!periods || periods.length === 0) return [];

    return periods.map((period, index) => ({
      period: `P${period.periodNumber}`,
      periodNumber: period.periodNumber,
      expectedClosing: period.expectedClosing,
      actualClosing: period.actualClosing,
      variance: period.variance,
      severity: period.severity,
      startDate: new Date(period.startDate).toLocaleDateString(),
      endDate: new Date(period.endDate).toLocaleDateString(),
      dateRange: `${new Date(period.startDate).toLocaleDateString()} - ${new Date(period.endDate).toLocaleDateString()}`
    }));
  }, [periods]);

  // Custom point color based on severity
  const customizeVariancePoint = (pointInfo) => {
    const severity = pointInfo.data.severity;
    if (severity === 'acceptable') return '#10b981'; // green
    if (severity === 'moderate') return '#f59e0b'; // yellow
    if (severity === 'high') return '#ef4444'; // red
    return '#6b7280'; // gray default
  };

  // Tooltip customization
  const customizeTooltip = (pointInfo) => {
    const data = pointInfo.point.data;
    const severityLabel = data.severity === 'acceptable' ? 'Acceptable' :
                          data.severity === 'moderate' ? 'Moderate' : 'High Variance';
    const severityColor = data.severity === 'acceptable' ? '#10b981' :
                           data.severity === 'moderate' ? '#f59e0b' : '#ef4444';

    return {
      html: `
        <div style="background: white; padding: 12px; min-width: 220px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e5e7eb;">
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; color: #1f2937;">
            Period #${data.periodNumber}
          </div>
          <div style="font-size: 11px; color: #6b7280; margin-bottom: 10px;">
            ${data.dateRange}
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #6b7280; font-size: 12px;">Expected Closing:</span>
            <span style="font-weight: 600; color: #2563eb; font-size: 12px;">${data.expectedClosing.toFixed(2)} L</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #6b7280; font-size: 12px;">Actual Closing:</span>
            <span style="font-weight: 600; color: #f97316; font-size: 12px;">${data.actualClosing.toFixed(2)} L</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding-top: 6px; border-top: 1px solid #e5e7eb;">
            <span style="color: #1f2937; font-weight: 600; font-size: 12px;">Variance:</span>
            <span style="font-weight: 700; color: ${data.variance >= 0 ? '#f97316' : '#ef4444'}; font-size: 13px;">
              ${data.variance >= 0 ? '+' : ''}${data.variance.toFixed(2)} L
            </span>
          </div>
          <div style="background: ${severityColor}; color: white; padding: 6px 10px; border-radius: 6px; text-align: center; font-size: 11px; font-weight: 600; letter-spacing: 0.5px;">
            ${severityLabel}
          </div>
        </div>
      `
    };
  };

  if (!periods || periods.length === 0) {
    return (
      <div className="tw-text-center tw-text-gray-500 tw-p-8">
        <i className="fa-light fa-chart-line tw-text-4xl tw-text-gray-400 tw-mb-3"></i>
        <div className="tw-text-sm">No data available for chart</div>
      </div>
    );
  }

  return (
    <div className="transfer-variance-chart">
      <Chart
        id="transferVarianceChart"
        dataSource={chartData}
        title=""
        height={400}
      >
        <CommonSeriesSettings argumentField="period" />

        {/* Expected Closing - Line Series */}
        <Series
          valueField="expectedClosing"
          name="Expected Closing"
          type="line"
          color="#2563eb"
          width={2}
        >
          <Label visible={false} />
        </Series>

        {/* Actual Closing - Line Series */}
        <Series
          valueField="actualClosing"
          name="Actual Closing"
          type="line"
          color="#f97316"
          width={2}
        >
          <Label visible={false} />
        </Series>

        {/* Variance - Bar Series with color customization */}
        <Series
          valueField="variance"
          name="Variance"
          type="bar"
          customizePoint={customizeVariancePoint}
        >
          <Label visible={false} />
        </Series>

        {/* Argument Axis (X-axis) */}
        <ArgumentAxis>
          <Label overlappingBehavior="rotate" rotationAngle={-45} />
        </ArgumentAxis>

        {/* Value Axis (Y-axis) */}
        <ValueAxis>
          <Label format={{ type: 'fixedPoint', precision: 0 }} />
        </ValueAxis>

        {/* Legend */}
        <Legend
          verticalAlignment="bottom"
          horizontalAlignment="center"
          orientation="horizontal"
        />

        {/* Tooltip */}
        <Tooltip
          enabled={true}
          customizeTooltip={customizeTooltip}
          zIndex={10000}
        />

        {/* Export */}
        <Export enabled={true} fileName="transfer_variance_chart" />
      </Chart>

      {/* Legend for Variance Colors */}
      <div className="tw-flex tw-items-center tw-justify-center tw-gap-6 tw-mt-4 tw-text-xs tw-text-gray-600">
        <div className="tw-flex tw-items-center">
          <div className="tw-w-3 tw-h-3 tw-bg-green-500 tw-rounded-full tw-mr-2"></div>
          <span>Acceptable</span>
        </div>
        <div className="tw-flex tw-items-center">
          <div className="tw-w-3 tw-h-3 tw-bg-yellow-500 tw-rounded-full tw-mr-2"></div>
          <span>Moderate</span>
        </div>
        <div className="tw-flex tw-items-center">
          <div className="tw-w-3 tw-h-3 tw-bg-red-500 tw-rounded-full tw-mr-2"></div>
          <span>High Variance</span>
        </div>
      </div>
    </div>
  );
};

export default TransferVarianceChart;
