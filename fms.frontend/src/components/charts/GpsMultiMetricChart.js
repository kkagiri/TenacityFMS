import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Chart,
  Series,
  ArgumentAxis,
  ValueAxis,
  Tooltip,
  Legend,
  CommonAxisSettings,
  Crosshair,
  Label,
  VerticalLine,
  HorizontalLine,
  ZoomAndPan,
  Point,
  CommonSeriesSettings,
  Export,
  Title,
  Subtitle,
} from "devextreme-react/chart";
import RangeSelector, {
  Behavior,
  Scale,
  Chart as RangeChart,
  Series as RangeSeries,
} from "devextreme-react/range-selector";
import { CheckBox } from "devextreme-react/check-box";
import { LoadIndicator } from "devextreme-react/load-indicator";
import "./GpsMultiMetricChart.scss";

/**
 * Predefined metric configurations
 * Each metric defines how it should be displayed on the chart
 */
const METRIC_DEFINITIONS = {
  fuelLevel: {
    label: "Fuel Level",
    unit: "L",
    color: "#3B82F6", // blue
    icon: "fa-gas-pump",
    valueAxis: "fuel",
    defaultVisible: true,
  },
  distance: {
    label: "Distance",
    unit: "km",
    color: "#8B5CF6", // purple
    icon: "fa-route",
    valueAxis: "distance",
    defaultVisible: false,
  },
  engineHours: {
    label: "Engine Hours",
    unit: "hr",
    color: "#6366F1", // indigo
    icon: "fa-engine",
    valueAxis: "hours",
    defaultVisible: false,
  },
  speed: {
    label: "Speed",
    unit: "km/h",
    color: "#EC4899", // pink
    icon: "fa-gauge-high",
    valueAxis: "speed",
    defaultVisible: false,
  },
  consumption: {
    label: "Consumption",
    unit: "L",
    color: "#EF4444", // red
    icon: "fa-fire",
    valueAxis: "fuel",
    defaultVisible: false,
  },
  efficiency: {
    label: "Efficiency",
    unit: "km/L",
    color: "#10B981", // green
    icon: "fa-leaf",
    valueAxis: "efficiency",
    defaultVisible: false,
  },
  temperature: {
    label: "Temperature",
    unit: "°C",
    color: "#F59E0B", // amber
    icon: "fa-temperature-half",
    valueAxis: "temperature",
    defaultVisible: false,
  },
  ignition: {
    label: "Ignition",
    unit: "",
    color: "#22C55E", // green
    icon: "fa-key",
    valueAxis: "binary",
    defaultVisible: false,
  },
};

/**
 * Value axis configurations for different metric types
 */
const VALUE_AXIS_CONFIG = {
  fuel: { title: "Fuel (L)", position: "left" },
  distance: { title: "Distance (km)", position: "right" },
  hours: { title: "Hours", position: "right" },
  speed: { title: "Speed (km/h)", position: "right" },
  efficiency: { title: "Efficiency (km/L)", position: "right" },
  temperature: { title: "Temperature (°C)", position: "right" },
  binary: { title: "On/Off", position: "right" },
};

/**
 * GpsMultiMetricChart - Flexible chart component for displaying multiple GPS metrics
 *
 * This component can display multiple variables on the same chart with:
 * - Metric selection checkboxes for filtering what to show
 * - Multiple Y-axes for different units
 * - Range selector for time-based zooming
 * - Crosshair and tooltip for detailed data inspection
 *
 * @param {Array} data - Array of data points with timestamp and metric values
 * @param {Array} availableMetrics - Array of metric keys that are available in the data
 * @param {string} title - Chart title
 * @param {string} subtitle - Chart subtitle
 * @param {string} argumentField - Field name for the X-axis (default: "time")
 * @param {number} height - Chart height in pixels (default: 400)
 * @param {boolean} showRangeSelector - Whether to show the range selector (default: true)
 * @param {boolean} showExport - Whether to show export option (default: false)
 * @param {boolean} showMetricFilter - Whether to show metric filter checkboxes (default: true)
 * @param {object} customMetrics - Custom metric definitions to override defaults
 * @param {Function} onMetricToggle - Callback when a metric is toggled (optional)
 * @returns {JSX.Element} Multi-Metric Chart component
 */
const GpsMultiMetricChart = ({
  data = [],
  availableMetrics = ["fuelLevel"],
  title = "GPS Metrics",
  subtitle = "",
  argumentField = "time",
  height = 400,
  showRangeSelector = true,
  showExport = false,
  showMetricFilter = true,
  customMetrics = {},
  onMetricToggle = null,
}) => {
  // Merge custom metrics with defaults
  const metricDefinitions = useMemo(
    () => ({ ...METRIC_DEFINITIONS, ...customMetrics }),
    [customMetrics]
  );

  // Initialize visible metrics based on defaults and available metrics
  const [visibleMetrics, setVisibleMetrics] = useState(() => {
    const initial = {};
    availableMetrics.forEach((metric) => {
      const def = metricDefinitions[metric];
      initial[metric] = def?.defaultVisible ?? true;
    });
    return initial;
  });

  const [visualRange, setVisualRange] = useState({});

  // Update visible metrics when availableMetrics changes
  useEffect(() => {
    setVisibleMetrics((prev) => {
      const updated = {};
      availableMetrics.forEach((metric) => {
        const def = metricDefinitions[metric];
        // Keep existing visibility if already set, otherwise use default
        updated[metric] =
          prev[metric] !== undefined
            ? prev[metric]
            : def?.defaultVisible ?? true;
      });
      return updated;
    });
  }, [availableMetrics, metricDefinitions]);

  // Set initial visual range when data changes
  useEffect(() => {
    if (data.length > 0) {
      const firstPoint = data[0];
      const lastPoint = data[data.length - 1];
      setVisualRange({
        startValue: firstPoint[argumentField],
        endValue: lastPoint[argumentField],
      });
    }
  }, [data, argumentField]);

  /**
   * Toggle metric visibility
   */
  const handleMetricToggle = useCallback(
    (metric, value) => {
      setVisibleMetrics((prev) => {
        const updated = { ...prev, [metric]: value };
        if (onMetricToggle) {
          onMetricToggle(metric, value, updated);
        }
        return updated;
      });
    },
    [onMetricToggle]
  );

  /**
   * Handle range selector change
   */
  const handleRangeChange = useCallback((e) => {
    setVisualRange(e.value);
  }, []);

  /**
   * Get active value axes based on visible metrics
   */
  const activeValueAxes = useMemo(() => {
    const axes = new Set();
    Object.entries(visibleMetrics).forEach(([metric, isVisible]) => {
      if (isVisible) {
        const def = metricDefinitions[metric];
        if (def?.valueAxis) {
          axes.add(def.valueAxis);
        }
      }
    });
    return Array.from(axes);
  }, [visibleMetrics, metricDefinitions]);

  /**
   * Custom tooltip renderer
   */
  const customizeTooltip = useCallback(
    (arg) => {
      const point = arg.point.data;
      const time =
        point[argumentField] instanceof Date
          ? point[argumentField].toLocaleString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            })
          : point[argumentField];

      let html = `<div class="tw-text-sm"><div class="tw-font-semibold tw-mb-2">${time}</div>`;

      // Show all visible metrics in tooltip
      Object.entries(visibleMetrics).forEach(([metric, isVisible]) => {
        if (
          isVisible &&
          point[metric] !== undefined &&
          point[metric] !== null
        ) {
          const def = metricDefinitions[metric];
          const value =
            typeof point[metric] === "number"
              ? point[metric].toFixed(2)
              : point[metric];
          html += `
            <div class="tw-flex tw-items-center tw-gap-2 tw-mt-1">
              <span style="color: ${def?.color || "#666"}">●</span>
              <span>${def?.label || metric}: <strong>${value} ${
            def?.unit || ""
          }</strong></span>
            </div>
          `;
        }
      });

      html += "</div>";
      return { html };
    },
    [visibleMetrics, metricDefinitions, argumentField]
  );

  /**
   * Get visible series for the chart
   */
  const visibleSeries = useMemo(() => {
    return Object.entries(visibleMetrics)
      .filter(([, isVisible]) => isVisible)
      .map(([metric]) => {
        const def = metricDefinitions[metric];
        return {
          metric,
          ...def,
        };
      });
  }, [visibleMetrics, metricDefinitions]);

  // No data state
  if (!data || data.length === 0) {
    return (
      <div className="gps-multi-metric-chart tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-12">
        <i className="fa-light fa-chart-line tw-text-4xl tw-text-gray-400 tw-mb-4"></i>
        <div className="tw-text-gray-600">
          No data available for the selected period
        </div>
      </div>
    );
  }

  return (
    <div className="gps-multi-metric-chart">
      {/* Metric Filter Checkboxes */}
      {showMetricFilter && availableMetrics.length > 1 && (
        <div className="metric-filter-bar tw-flex tw-flex-wrap tw-gap-4 tw-mb-4 tw-p-3 tw-bg-gray-50 tw-rounded-lg tw-border tw-border-gray-200">
          <span className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mr-2">
            <i className="fa-light fa-filter tw-mr-1"></i>
            Show Metrics:
          </span>
          {availableMetrics.map((metric) => {
            const def = metricDefinitions[metric];
            return (
              <div
                key={metric}
                className="metric-checkbox-item tw-flex tw-items-center tw-gap-2"
              >
                <CheckBox
                  value={visibleMetrics[metric] || false}
                  onValueChanged={(e) => handleMetricToggle(metric, e.value)}
                />
                <span
                  className="tw-text-sm tw-flex tw-items-center tw-gap-1"
                  style={{ color: def?.color || "#666" }}
                >
                  <i className={`fa-light ${def?.icon || "fa-circle"}`}></i>
                  {def?.label || metric}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Chart */}
      <div className="chart-container">
        <Chart dataSource={data} height={height} palette="Soft Pastel">
          {title && (
            <Title text={title}>
              {subtitle && <Subtitle text={subtitle} />}
            </Title>
          )}

          <CommonSeriesSettings type="spline" argumentField={argumentField}>
            <Point visible={false} />
          </CommonSeriesSettings>

          {/* Render series for each visible metric */}
          {visibleSeries.map((series) => (
            <Series
              key={series.metric}
              valueField={series.metric}
              name={`${series.label} (${series.unit})`}
              color={series.color}
              axis={series.valueAxis}
            />
          ))}

          {/* X-Axis (Time) */}
          <ArgumentAxis
            argumentType={
              data[0]?.[argumentField] instanceof Date ? "datetime" : "string"
            }
            visualRange={visualRange}
          >
            <Label
              format={
                data[0]?.[argumentField] instanceof Date ? "HH:mm" : undefined
              }
            />
          </ArgumentAxis>

          {/* Value Axes - Only render axes for visible metrics */}
          {activeValueAxes.map((axisKey, index) => {
            const config = VALUE_AXIS_CONFIG[axisKey];
            return (
              <ValueAxis
                key={axisKey}
                name={axisKey}
                position={index === 0 ? "left" : "right"}
                title={config?.title || axisKey}
              >
                <Label format="#,##0.0" />
              </ValueAxis>
            );
          })}

          <CommonAxisSettings />

          <Legend
            visible={visibleSeries.length > 1}
            verticalAlignment="bottom"
            horizontalAlignment="center"
          />

          <Tooltip
            enabled={true}
            customizeTooltip={customizeTooltip}
            shared={true}
          />

          <Crosshair enabled={true} color="#999">
            <HorizontalLine visible={true} dashStyle="dash" />
            <VerticalLine visible={true} dashStyle="dash">
              <Label
                visible={true}
                format={
                  data[0]?.[argumentField] instanceof Date
                    ? "HH:mm:ss"
                    : undefined
                }
              />
            </VerticalLine>
          </Crosshair>

          <ZoomAndPan
            argumentAxis="both"
            dragToZoom={true}
            allowMouseWheel={true}
          />

          {showExport && <Export enabled={true} />}
        </Chart>
      </div>

      {/* Range Selector */}
      {showRangeSelector && (
        <div className="range-selector-container tw-mt-4">
          <RangeSelector
            dataSource={data}
            value={visualRange}
            onValueChanged={handleRangeChange}
            size={{ height: 80 }}
          >
            <Behavior snapToTicks={false} />
            <Scale
              valueType={
                data[0]?.[argumentField] instanceof Date ? "datetime" : "string"
              }
              minorTickInterval={
                data[0]?.[argumentField] instanceof Date
                  ? { minutes: 5 }
                  : undefined
              }
            >
              <Label
                format={
                  data[0]?.[argumentField] instanceof Date ? "HH:mm" : undefined
                }
              />
            </Scale>
            <RangeChart>
              {/* Show first visible metric in range selector */}
              {visibleSeries.length > 0 && (
                <RangeSeries
                  type="area"
                  valueField={visibleSeries[0].metric}
                  argumentField={argumentField}
                  color={visibleSeries[0].color}
                />
              )}
            </RangeChart>
          </RangeSelector>
        </div>
      )}

      {/* Data summary */}
      <div className="tw-text-xs tw-text-gray-500 tw-text-right tw-mt-2">
        {data.length} data points | {visibleSeries.length} metric(s) displayed
      </div>
    </div>
  );
};

export default GpsMultiMetricChart;
