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
  Strip,
} from "devextreme-react/chart";
import RangeSelector, {
  Behavior,
  Scale,
  Chart as RangeChart,
  Series as RangeSeries,
} from "devextreme-react/range-selector";
import { LoadIndicator } from "devextreme-react/load-indicator";
import axiosInstance from "../../api/axiosInstance";
import "./GpsFuelLevelChart.scss";

/**
 * GpsFuelLevelChart - Displays GPS fuel level data over a 24-hour period
 *
 * This is a global/shared component that can be used throughout the application.
 * It fetches fuel level data from the backend GPS tracking API and displays it
 * as an interactive line chart with time-based zoom capabilities.
 *
 * Features:
 * - Line chart showing fuel level over time
 * - Range selector for zooming into specific time periods
 * - Refueling event highlighting from GPS report data
 * - Out-of-bounds time warning (before 6 AM or after 8 PM)
 * - Loading and error states
 * - Customizable height and appearance
 * - Statistics summary cards showing start/end levels, max/avg
 *
 * @param {number} vehicleId - GPS Gate vehicle ID
 * @param {string|Date} date - The date to fetch data for (24-hour period)
 * @param {string} vehicleName - Vehicle name for display
 * @param {object} refillEvent - Optional refill event to highlight on chart
 * @param {object} gpsRefuelingEntry - GPS refueling entry data from GpsGateReportEntry (startTime, duration, fuelBefore, fuelAfter, volume)
 * @param {number} manualVolume - Manual fueling volume (liters) for the selected record
 * @param {number} height - Chart height in pixels (default: 350)
 * @param {boolean} showRangeSelector - Whether to show the range selector (default: true)
 * @param {boolean} showExport - Whether to show export option (default: false)
 * @param {boolean} showStatistics - Whether to show statistics summary cards (default: true)
 * @returns {JSX.Element} GPS Fuel Level Chart component
 */
const GpsFuelLevelChart = ({
  vehicleId,
  date,
  vehicleName = "",
  refillEvent = null,
  gpsRefuelingEntry = null, // { startTime, duration, fuelBefore, fuelAfter, volume, dispenseDate }
  manualVolume = null,
  height = 350,
  showRangeSelector = true,
  showExport = false,
  showStatistics = true,
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
   * Convert GPS refueling entry from database to refueling event format
   * Uses data from GpsGateReportEntry instead of auto-detection
   */
  const refuelingEvents = useMemo(() => {
    if (!gpsRefuelingEntry) return [];

    const { startTime, duration, fuelBefore, fuelAfter, volume, dispenseDate } =
      gpsRefuelingEntry;

    // Parse start time
    let eventStartTime = null;
    if (startTime) {
      // startTime is a TimeSpan string like "14:26:00" or "HH:mm:ss"
      const targetDate = new Date(dispenseDate || date);
      const timeParts = startTime.split(":");
      if (timeParts.length >= 2) {
        eventStartTime = new Date(
          targetDate.getFullYear(),
          targetDate.getMonth(),
          targetDate.getDate(),
          parseInt(timeParts[0], 10),
          parseInt(timeParts[1], 10),
          timeParts.length > 2 ? parseInt(timeParts[2], 10) : 0
        );
      }
    }

    // Calculate end time from duration
    let eventEndTime = null;
    if (eventStartTime && duration) {
      const durationParts = duration.split(":");
      if (durationParts.length >= 2) {
        const durationMs =
          (parseInt(durationParts[0], 10) * 3600 +
            parseInt(durationParts[1], 10) * 60 +
            (durationParts.length > 2 ? parseInt(durationParts[2], 10) : 0)) *
          1000;
        eventEndTime = new Date(eventStartTime.getTime() + durationMs);
      }
    }

    // If no start time, try to find the refueling in the track data
    // (Only possible when we actually have track data points)
    if (!eventStartTime && trackData.length > 1) {
      // Find the point where fuel level matches fuelBefore/fuelAfter transition
      for (let i = 1; i < trackData.length; i++) {
        const prev = trackData[i - 1];
        const curr = trackData[i];
        const fuelIncrease = curr.fuelLevel - prev.fuelLevel;

        // Match by volume increase (within 10% tolerance)
        if (volume && fuelIncrease > 0) {
          const matchTolerance = volume * 0.15;
          if (Math.abs(fuelIncrease - volume) <= matchTolerance) {
            eventStartTime = prev.time;
            eventEndTime = curr.time;
            break;
          }
        }
      }
    }

    if (!eventStartTime) return [];

    // Find data point indices for highlighting (only when trackData exists)
    let startIndex = 0;
    let endIndex = Math.max(0, trackData.length - 1);

    if (trackData.length > 0) {
      for (let i = 0; i < trackData.length; i++) {
        if (trackData[i].time >= eventStartTime) {
          startIndex = Math.max(0, i - 1);
          break;
        }
      }

      if (eventEndTime) {
        for (let i = trackData.length - 1; i >= 0; i--) {
          if (trackData[i].time <= eventEndTime) {
            endIndex = Math.min(trackData.length - 1, i + 1);
            break;
          }
        }
      } else {
        // If no end time, use a window of ~5 minutes after start
        for (let i = startIndex; i < trackData.length; i++) {
          if (trackData[i].time - eventStartTime > 5 * 60 * 1000) {
            endIndex = i;
            break;
          }
        }
      }
    }

    // Check if refueling is out of bounds (before 6 AM or after 8 PM)
    const hour = eventStartTime.getHours();
    const isOutOfBounds = hour < 6 || hour >= 20;

    // Always prefer FuelAfter - FuelBefore when available (authoritative refuel delta)
    const computedVolumeRaw =
      fuelAfter !== null &&
      fuelAfter !== undefined &&
      fuelBefore !== null &&
      fuelBefore !== undefined
        ? Number(fuelAfter) - Number(fuelBefore)
        : volume !== null && volume !== undefined
        ? Number(volume)
        : 0;
    const computedVolume = Math.max(0, computedVolumeRaw);

    return [
      {
        startTime: eventStartTime,
        endTime:
          eventEndTime ||
          (trackData.length > 0 ? trackData[endIndex]?.time : null) ||
          eventStartTime,
        startLevel:
          fuelBefore ??
          (trackData.length > 0 ? trackData[startIndex]?.fuelLevel : null) ??
          0,
        endLevel:
          fuelAfter ??
          (trackData.length > 0 ? trackData[endIndex]?.fuelLevel : null) ??
          0,
        volume: computedVolume,
        startIndex,
        endIndex,
        isOutOfBounds,
        isFromZero: (fuelBefore ?? 0) === 0,
      },
    ];
  }, [gpsRefuelingEntry, trackData, date]);

  const formatVolume = useCallback((value, decimals = 1) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return "-";
    }
    return `${Number(value).toFixed(decimals)} L`;
  }, []);

  const formatTimeRange = useCallback((start, end) => {
    if (!start || !end) return "-";
    return `${start.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    })} - ${end.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }, []);

  const formatDurationFromTimeSpan = useCallback((timeSpan) => {
    if (!timeSpan) return "";
    if (typeof timeSpan !== "string") return "";

    const parts = timeSpan.split(":");
    if (parts.length < 2) return timeSpan;

    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    const seconds = parts.length > 2 ? parseInt(parts[2], 10) || 0 : 0;

    const pieces = [];
    if (hours) pieces.push(`${hours}h`);
    if (minutes || hours) pieces.push(`${minutes}m`);
    if (!hours) pieces.push(`${seconds}s`);
    return pieces.join(" ");
  }, []);

  /**
   * Create refueling highlight data for area series
   */
  const refuelingHighlightData = useMemo(() => {
    if (refuelingEvents.length === 0 || trackData.length === 0) return [];

    const highlights = [];

    refuelingEvents.forEach((event) => {
      // Get all points within the refueling period
      const startIdx = Math.max(0, event.startIndex - 1);
      const endIdx = Math.min(trackData.length - 1, event.endIndex + 1);

      for (let i = startIdx; i <= endIdx; i++) {
        highlights.push({
          time: trackData[i].time,
          refuelingLevel: trackData[i].fuelLevel,
          isRefueling: true,
          refuelingVolume: event.volume,
        });
      }
    });

    return highlights;
  }, [refuelingEvents, trackData]);

  /**
   * Custom tooltip renderer
   */
  const customizeTooltip = useCallback(
    (arg) => {
      const point = arg.point.data;
      const time = point.time.toLocaleString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

      // Check if this point is during a refueling event
      const refuelingEvent = refuelingEvents.find(
        (event) => point.time >= event.startTime && point.time <= event.endTime
      );

      let html = `
      <div class="tw-text-sm">
        <div class="tw-font-semibold tw-mb-1">${time}</div>
    `;

      // Show refueling badge if during refueling
      if (refuelingEvent) {
        html += `
        <div class="tw-flex tw-items-center tw-gap-2 tw-mb-2 tw-px-2 tw-py-1 tw-bg-yellow-100 tw-rounded tw-text-yellow-800">
          <i class="fa-light fa-gas-pump"></i>
          <span class="tw-font-medium">Refueling: +${refuelingEvent.volume.toFixed(
            1
          )} L</span>
        </div>
      `;
      }

      html += `
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
    },
    [refuelingEvents]
  );

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

  const refuelEvent = refuelingEvents?.[0] || null;
  const gpsFuelBefore = gpsRefuelingEntry?.fuelBefore ?? null;
  const gpsFuelAfter = gpsRefuelingEntry?.fuelAfter ?? null;

  // Compute GPS refuel value with multiple fallbacks:
  // 1. FuelAfter - FuelBefore (most accurate if available)
  // 2. refuelEvent.volume (from chart event detection)
  // 3. gpsRefuelingEntry.volume (from database GPS volume)
  const gpsRefuelValue =
    gpsFuelBefore !== null &&
    gpsFuelBefore !== undefined &&
    gpsFuelAfter !== null &&
    gpsFuelAfter !== undefined
      ? Math.max(0, Number(gpsFuelAfter) - Number(gpsFuelBefore))
      : refuelEvent?.volume ?? gpsRefuelingEntry?.volume ?? null;

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
      {/* Statistics Summary - conditionally rendered */}
      {showStatistics && (
        <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-3 lg:tw-grid-cols-5 tw-gap-3 tw-mb-4">
          <div className="chart-stat-card">
            <div className="chart-stat-icon tw-bg-blue-100 tw-text-blue-600">
              <i className="fa-light fa-arrow-down"></i>
            </div>
            <div className="chart-stat-content">
              <div className="chart-stat-value">
                {formatVolume(gpsFuelBefore)}
              </div>
              <div className="chart-stat-label">Fuel Before</div>
            </div>
          </div>

          <div className="chart-stat-card">
            <div className="chart-stat-icon tw-bg-green-100 tw-text-green-600">
              <i className="fa-light fa-arrow-up"></i>
            </div>
            <div className="chart-stat-content">
              <div className="chart-stat-value">
                {formatVolume(gpsFuelAfter)}
              </div>
              <div className="chart-stat-label">Fuel After</div>
            </div>
          </div>

          <div
            className={`chart-stat-card tw-border-yellow-400 tw-bg-yellow-50 ${
              refuelEvent?.isOutOfBounds ? "tw-border-red-400 tw-bg-red-50" : ""
            }`}
          >
            <div
              className={`chart-stat-icon ${
                refuelEvent?.isOutOfBounds
                  ? "tw-bg-red-100 tw-text-red-600"
                  : "tw-bg-yellow-100 tw-text-yellow-600"
              }`}
            >
              <i className="fa-light fa-gas-pump"></i>
            </div>
            <div className="chart-stat-content">
              <div className="chart-stat-value">
                {gpsRefuelValue === null || gpsRefuelValue === undefined
                  ? "-"
                  : `+${Number(gpsRefuelValue).toFixed(1)} L`}
              </div>
              <div className="chart-stat-label">
                {refuelEvent?.isOutOfBounds ? (
                  <span className="tw-text-red-600">
                    <i className="fa-light fa-triangle-exclamation tw-mr-1"></i>
                    Out of Hours
                  </span>
                ) : (
                  "GPS Refueling"
                )}
                {refuelEvent?.isFromZero && (
                  <span className="tw-ml-2 tw-text-orange-600">
                    (from empty)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="chart-stat-card">
            <div className="chart-stat-icon tw-bg-purple-100 tw-text-purple-600">
              <i className="fa-light fa-clock"></i>
            </div>
            <div className="chart-stat-content">
              <div className="chart-stat-value">
                {refuelEvent
                  ? formatTimeRange(refuelEvent.startTime, refuelEvent.endTime)
                  : "-"}
              </div>
              <div className="chart-stat-label">
                Fueling Time
                {gpsRefuelingEntry?.duration
                  ? ` (${formatDurationFromTimeSpan(
                      gpsRefuelingEntry.duration
                    )})`
                  : ""}
              </div>
            </div>
          </div>

          <div className="chart-stat-card">
            <div className="chart-stat-icon tw-bg-indigo-100 tw-text-indigo-600">
              <i className="fa-light fa-pen-to-square"></i>
            </div>
            <div className="chart-stat-content">
              <div className="chart-stat-value">
                {formatVolume(manualVolume)}
              </div>
              <div className="chart-stat-label">Manual Fueling</div>
            </div>
          </div>
        </div>
      )}

      {/* Refueling Events Detail from GPS Report Entry */}
      {gpsRefuelingEntry && refuelingEvents.length > 0 && (
        <div
          className={`refueling-events-list tw-mb-4 tw-p-3 tw-border tw-rounded-lg ${
            refuelingEvents[0]?.isOutOfBounds
              ? "tw-bg-red-50 tw-border-red-200"
              : "tw-bg-yellow-50 tw-border-yellow-200"
          }`}
        >
          <div className="tw-flex tw-items-center tw-gap-2 tw-mb-2">
            <i
              className={`fa-light fa-gas-pump ${
                refuelingEvents[0]?.isOutOfBounds
                  ? "tw-text-red-600"
                  : "tw-text-yellow-600"
              }`}
            ></i>
            <span
              className={`tw-font-medium ${
                refuelingEvents[0]?.isOutOfBounds
                  ? "tw-text-red-800"
                  : "tw-text-yellow-800"
              }`}
            >
              GPS Reported Refueling
              {refuelingEvents[0]?.isOutOfBounds && (
                <span className="tw-ml-2 tw-text-red-600 tw-text-sm">
                  <i className="fa-light fa-clock tw-mr-1"></i>
                  Outside allowed hours (6 AM - 8 PM)
                </span>
              )}
            </span>
          </div>
          <div className="tw-flex tw-flex-wrap tw-gap-3">
            {refuelingEvents.map((event, idx) => (
              <div
                key={idx}
                className={`tw-flex tw-items-center tw-gap-3 tw-px-3 tw-py-2 tw-bg-white tw-rounded tw-border tw-text-sm ${
                  event.isOutOfBounds
                    ? "tw-border-red-300"
                    : "tw-border-yellow-300"
                }`}
              >
                <div className="tw-flex tw-flex-col">
                  <span className="tw-text-xs tw-text-gray-500">
                    {event.startTime.toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" - "}
                    {event.endTime.toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span
                    className={`tw-font-semibold ${
                      event.isOutOfBounds
                        ? "tw-text-red-700"
                        : "tw-text-yellow-700"
                    }`}
                  >
                    +{event.volume.toFixed(1)} L
                  </span>
                </div>
                <div className="tw-text-xs tw-text-gray-500">
                  {event.startLevel.toFixed(0)}L → {event.endLevel.toFixed(0)}L
                  {event.isFromZero && (
                    <span className="tw-ml-1 tw-text-orange-600">
                      (from empty)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {gpsRefuelingEntry && refuelingEvents.length === 0 && (
        <div className="tw-mb-4 tw-p-3 tw-border tw-rounded-lg tw-bg-gray-50 tw-border-gray-200 tw-text-sm tw-text-gray-600">
          GPS refueling details are not available for this record.
        </div>
      )}

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

          {/* Refueling highlight area - rendered first so it's behind the line */}
          {refuelingHighlightData.length > 0 && (
            <Series
              dataSource={refuelingHighlightData}
              valueField="refuelingLevel"
              argumentField="time"
              name="Refueling Period"
              type="area"
              color="rgba(250, 204, 21, 0.6)"
            >
              <Point visible={false} />
            </Series>
          )}

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
