import React, { useEffect, useState, useCallback, useMemo } from "react";
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
import { LoadIndicator } from "devextreme-react/load-indicator";
import axiosInstance from "../../../../api/axiosInstance";
import "./GpsFuelLevelChart.scss";

/**
 * GpsFuelLevelChart - Displays GPS fuel level data over a 24-hour period
 *
 * Features:
 * - Line chart showing fuel level over time
 * - Range selector for zooming into specific time periods
 * - Refill event markers (optional)
 * - Loading and error states
 * - Customizable height and appearance
 *
 * @param {number} vehicleId - GPS Gate vehicle ID
 * @param {string|Date} date - The date to fetch data for (24-hour period)
 * @param {string} vehicleName - Vehicle name for display
 * @param {object} refillEvent - Optional refill event to highlight on chart
 * @param {number} height - Chart height in pixels (default: 350)
 * @param {boolean} showRangeSelector - Whether to show the range selector (default: true)
 * @param {boolean} showExport - Whether to show export option (default: false)
 * @returns {JSX.Element} GPS Fuel Level Chart component
 */
const GpsFuelLevelChart = ({
  vehicleId,
  date,
  vehicleName = "",
  refillEvent = null,
  height = 350,
  showRangeSelector = true,
  showExport = false,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trackData, setTrackData] = useState([]);
  const [visualRange, setVisualRange] = useState({});

  /**
   * Format date for display
   */
  const formattedDate = useMemo(() => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [date]);

  /**
   * Fetch fuel level data from backend API
   */
  const fetchTrackData = useCallback(async () => {
    if (!vehicleId || !date) {
      setError("Vehicle ID and date are required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Format date for API - always parse and use LOCAL date components
      // This handles timezone correctly whether input is string or Date
      const targetDate = new Date(date);
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, "0");
      const day = String(targetDate.getDate()).padStart(2, "0");
      const formattedApiDate = `${year}-${month}-${day}`;

      console.log(
        "GpsFuelLevelChart - Input date:",
        date,
        "→ Local date:",
        targetDate.toLocaleDateString(),
        "→ API date:",
        formattedApiDate
      );

      // Call backend API endpoint
      const response = await axiosInstance.get(
        `v1/vehicletracking/${vehicleId}/fuel-levels/day`,
        { params: { date: formattedApiDate } }
      );

      if (response.data?.success && response.data?.data?.length > 0) {
        // Transform backend data for chart
        const chartData = response.data.data
          .map((reading) => {
            const timestamp = new Date(reading.timestamp);
            return {
              time: timestamp,
              timeLabel: timestamp.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }),
              fuelLevel:
                reading.fuelLevel !== null
                  ? parseFloat(reading.fuelLevel)
                  : null,
              ignition: reading.ignitionStatus,
              latitude: reading.latitude,
              longitude: reading.longitude,
              trackInfoId: reading.trackInfoId,
            };
          })
          .filter((point) => point.fuelLevel !== null)
          .sort((a, b) => a.time - b.time);

        setTrackData(chartData);

        // Set initial visual range to full day
        if (chartData.length > 0) {
          setVisualRange({
            startValue: chartData[0].time,
            endValue: chartData[chartData.length - 1].time,
          });
        }
      } else {
        setTrackData([]);
        setError(
          response.data?.message || "No fuel level data available for this date"
        );
      }
    } catch (err) {
      console.error("Error fetching fuel level data:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch fuel level data. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  }, [vehicleId, date]);

  /**
   * Fetch data on mount and when vehicleId/date changes
   */
  useEffect(() => {
    fetchTrackData();
  }, [fetchTrackData]);

  /**
   * Handle range selector change
   */
  const handleRangeChange = useCallback((e) => {
    setVisualRange(e.value);
  }, []);

  /**
   * Custom tooltip renderer
   */
  const customizeTooltip = useCallback((arg) => {
    const point = arg.point.data;
    const time = point.time.toLocaleString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    let html = `
      <div class="tw-text-sm">
        <div class="tw-font-semibold tw-mb-1">${time}</div>
        <div class="tw-flex tw-items-center tw-gap-2">
          <i class="fa-light fa-gas-pump tw-text-blue-500"></i>
          <span>Fuel Level: <strong>${point.fuelLevel?.toFixed(
            1
          )} L</strong></span>
        </div>
    `;

    if (point.ignition !== null && point.ignition !== undefined) {
      html += `
        <div class="tw-flex tw-items-center tw-gap-2 tw-mt-1">
          <i class="fa-light fa-key tw-text-${
            point.ignition ? "green" : "gray"
          }-500"></i>
          <span>Ignition: ${point.ignition ? "ON" : "OFF"}</span>
        </div>
      `;
    }

    if (point.latitude && point.longitude) {
      html += `
        <div class="tw-flex tw-items-center tw-gap-2 tw-mt-1">
          <i class="fa-light fa-location-dot tw-text-red-500"></i>
          <span>Location: ${parseFloat(point.latitude).toFixed(
            5
          )}, ${parseFloat(point.longitude).toFixed(5)}</span>
        </div>
      `;
    }

    html += "</div>";

    return {
      html,
    };
  }, []);

  /**
   * Render refill event marker annotation
   */
  const refillMarkerData = useMemo(() => {
    if (!refillEvent || trackData.length === 0) return [];

    // Find the closest data point to the refill event time
    const refillTime = new Date(refillEvent.dispenseDate || refillEvent.time);
    const closestPoint = trackData.reduce((closest, point) => {
      const diff = Math.abs(point.time - refillTime);
      const closestDiff = closest
        ? Math.abs(closest.time - refillTime)
        : Infinity;
      return diff < closestDiff ? point : closest;
    }, null);

    if (closestPoint) {
      return [
        {
          time: closestPoint.time,
          fuelLevel: closestPoint.fuelLevel,
          isRefillMarker: true,
          refillVolume: refillEvent.volume || refillEvent.gpsVolume,
        },
      ];
    }

    return [];
  }, [refillEvent, trackData]);

  /**
   * Get chart statistics
   */
  const chartStats = useMemo(() => {
    if (trackData.length === 0) {
      return { min: 0, max: 0, avg: 0, start: 0, end: 0, consumption: 0 };
    }

    const fuelLevels = trackData.map((p) => p.fuelLevel);
    const min = Math.min(...fuelLevels);
    const max = Math.max(...fuelLevels);
    const avg = fuelLevels.reduce((a, b) => a + b, 0) / fuelLevels.length;
    const start = fuelLevels[0];
    const end = fuelLevels[fuelLevels.length - 1];
    const consumption = start - end;

    return { min, max, avg, start, end, consumption };
  }, [trackData]);

  // Loading state
  if (loading) {
    return (
      <div className="gps-fuel-chart tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-12">
        <LoadIndicator height={40} width={40} />
        <div className="tw-mt-4 tw-text-gray-600">
          Loading GPS data for {vehicleName || `Vehicle ${vehicleId}`}...
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="gps-fuel-chart tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-12">
        <i className="fa-light fa-triangle-exclamation tw-text-4xl tw-text-yellow-500 tw-mb-4"></i>
        <div className="tw-text-gray-700 tw-font-medium tw-mb-2">
          Unable to load GPS data
        </div>
        <div className="tw-text-gray-500 tw-text-sm tw-text-center tw-max-w-md">
          {error}
        </div>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setLoading(true);
            setTimeout(() => fetchTrackData(), 100);
          }}
          className="tw-mt-4 tw-px-4 tw-py-2 tw-bg-blue-500 tw-text-white tw-rounded hover:tw-bg-blue-600 tw-transition-colors tw-flex tw-items-center tw-gap-2"
        >
          <i className="fa-light fa-rotate-right"></i>
          <span>Retry</span>
        </button>
      </div>
    );
  }

  // No data state
  if (trackData.length === 0) {
    return (
      <div className="gps-fuel-chart tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-12">
        <i className="fa-light fa-chart-line tw-text-4xl tw-text-gray-400 tw-mb-4"></i>
        <div className="tw-text-gray-600">
          No fuel level data available for {formattedDate}
        </div>
      </div>
    );
  }

  return (
    <div className="gps-fuel-chart">
      {/* Statistics Summary */}
      <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 lg:tw-grid-cols-6 tw-gap-3 tw-mb-4">
        <div className="chart-stat-card">
          <div className="chart-stat-icon tw-bg-blue-100 tw-text-blue-600">
            <i className="fa-light fa-play"></i>
          </div>
          <div className="chart-stat-content">
            <div className="chart-stat-value">
              {chartStats.start.toFixed(1)} L
            </div>
            <div className="chart-stat-label">Start Level</div>
          </div>
        </div>

        <div className="chart-stat-card">
          <div className="chart-stat-icon tw-bg-green-100 tw-text-green-600">
            <i className="fa-light fa-stop"></i>
          </div>
          <div className="chart-stat-content">
            <div className="chart-stat-value">
              {chartStats.end.toFixed(1)} L
            </div>
            <div className="chart-stat-label">End Level</div>
          </div>
        </div>

        <div className="chart-stat-card">
          <div className="chart-stat-icon tw-bg-red-100 tw-text-red-600">
            <i className="fa-light fa-gas-pump"></i>
          </div>
          <div className="chart-stat-content">
            <div className="chart-stat-value">
              {chartStats.consumption.toFixed(1)} L
            </div>
            <div className="chart-stat-label">Consumption</div>
          </div>
        </div>

        <div className="chart-stat-card">
          <div className="chart-stat-icon tw-bg-purple-100 tw-text-purple-600">
            <i className="fa-light fa-arrow-down"></i>
          </div>
          <div className="chart-stat-content">
            <div className="chart-stat-value">
              {chartStats.min.toFixed(1)} L
            </div>
            <div className="chart-stat-label">Min Level</div>
          </div>
        </div>

        <div className="chart-stat-card">
          <div className="chart-stat-icon tw-bg-amber-100 tw-text-amber-600">
            <i className="fa-light fa-arrow-up"></i>
          </div>
          <div className="chart-stat-content">
            <div className="chart-stat-value">
              {chartStats.max.toFixed(1)} L
            </div>
            <div className="chart-stat-label">Max Level</div>
          </div>
        </div>

        <div className="chart-stat-card">
          <div className="chart-stat-icon tw-bg-cyan-100 tw-text-cyan-600">
            <i className="fa-light fa-chart-line"></i>
          </div>
          <div className="chart-stat-content">
            <div className="chart-stat-value">
              {chartStats.avg.toFixed(1)} L
            </div>
            <div className="chart-stat-label">Avg Level</div>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="chart-container">
        <Chart
          dataSource={trackData}
          height={height}
          palette="Soft Pastel"
          onPointClick={(e) => {
            if (e.target.data) {
              console.log("Point data:", e.target.data);
            }
          }}
        >
          <Title text={`Fuel Level - ${vehicleName || `Vehicle ${vehicleId}`}`}>
            <Subtitle text={formattedDate} />
          </Title>

          <CommonSeriesSettings type="spline" argumentField="time">
            <Point visible={false} />
          </CommonSeriesSettings>

          <Series
            valueField="fuelLevel"
            name="Fuel Level (L)"
            color="#3B82F6"
          />

          {/* Refill event marker */}
          {refillMarkerData.length > 0 && (
            <Series
              dataSource={refillMarkerData}
              valueField="fuelLevel"
              argumentField="time"
              name="Refill Event"
              type="scatter"
              color="#EF4444"
            >
              <Point symbol="triangleUp" size={14} color="#EF4444" />
            </Series>
          )}

          <ArgumentAxis argumentType="datetime" visualRange={visualRange}>
            <Label format="HH:mm" />
          </ArgumentAxis>

          <ValueAxis title="Fuel Level (Litres)">
            <Label format="#,##0.0" />
          </ValueAxis>

          <CommonAxisSettings />

          <Legend
            visible={true}
            verticalAlignment="bottom"
            horizontalAlignment="center"
          />

          <Tooltip
            enabled={true}
            customizeTooltip={customizeTooltip}
            shared={false}
            contentRender={null}
          />

          <Crosshair enabled={true} color="#999">
            <HorizontalLine visible={true} dashStyle="dash" />
            <VerticalLine visible={true} dashStyle="dash">
              <Label visible={true} format="HH:mm:ss" />
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
            dataSource={trackData}
            value={visualRange}
            onValueChanged={handleRangeChange}
            size={{ height: 80 }}
          >
            <Behavior snapToTicks={false} />
            <Scale valueType="datetime" minorTickInterval={{ minutes: 5 }}>
              <Label format="HH:mm" />
            </Scale>
            <RangeChart>
              <RangeSeries
                type="area"
                valueField="fuelLevel"
                argumentField="time"
                color="#3B82F6"
              />
            </RangeChart>
          </RangeSelector>
        </div>
      )}

      {/* Data points count */}
      <div className="tw-text-xs tw-text-gray-500 tw-text-right tw-mt-2">
        {trackData.length} data points | Last updated:{" "}
        {new Date().toLocaleTimeString("en-GB")}
      </div>
    </div>
  );
};

export default GpsFuelLevelChart;
