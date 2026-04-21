/**
 * File: VehicleConsumptionDetails.js
 * Purpose: Displays vehicle consumption detail with record context, five-record history, selected-day GPS insight, and track map.
 * Dependencies: React, DevExtreme DataGrid, react-router-dom, usePermissions, local consumption service
 * Last Modified: 2026-04-21
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DataGrid, { Column, Paging, Scrolling } from "devextreme-react/data-grid";
import LoadIndicator from "devextreme-react/load-indicator";
import { useNavigate, useParams } from "react-router-dom";
import { usePermissions } from "../../../hooks/usePermissions";
import VehicleConsumptionEmptyState from "./components/VehicleConsumptionEmptyState";
import {
  formatDisplayDate,
  getGoogleMapsApiKey,
  formatNumber,
  getModeLabel,
  getVehicleConsumptionHistory,
  getVehicleConsumptionRecordDetail,
  getVehicleConsumptionTrackPoints,
} from "./vehicleConsumptionService";
import "./VehicleConsumptionModule.scss";

const TAB_ITEMS = [
  { id: "history", label: "History", icon: "fa-light fa-timeline" },
  { id: "gps", label: "GPS Details", icon: "fa-light fa-satellite-dish" },
  { id: "map", label: "Map", icon: "fa-light fa-route" },
];

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatTime = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const normalizeBooleanLabel = (value) => {
  if (value == null) {
    return "-";
  }

  return value ? "Yes" : "No";
};

const getSignalQuality = (satelliteCount) => {
  if (satelliteCount >= 8) {
    return { label: "Strong", accentClass: "vehicle-consumption-module__accent-success" };
  }

  if (satelliteCount >= 4) {
    return { label: "Moderate", accentClass: "" };
  }

  if (satelliteCount > 0) {
    return { label: "Weak", accentClass: "vehicle-consumption-module__accent-danger" };
  }

  return { label: "Unavailable", accentClass: "vehicle-consumption-module__accent-danger" };
};

const buildGpsSummary = (trackPoints = []) => {
  if (!trackPoints.length) {
    return {
      totalPoints: 0,
      validPoints: 0,
      averageSpeed: 0,
      maxSpeed: 0,
      averageSatellites: 0,
      ignitionOnPoints: 0,
      firstPoint: null,
      lastPoint: null,
      lastKnownAddress: "",
      lastKnownSite: "",
    };
  }

  const sortedPoints = [...trackPoints].sort((left, right) => new Date(left.timestamp) - new Date(right.timestamp));
  const validPoints = sortedPoints.filter((point) => point.isValid !== false);
  const speedPoints = sortedPoints.filter((point) => point.speed > 0);
  const satellitePoints = sortedPoints.filter((point) => point.satelliteCount > 0);
  const ignitionOnPoints = sortedPoints.filter((point) => point.ignitionStatus === true).length;

  const totalSpeed = speedPoints.reduce((sum, point) => sum + (point.speed || 0), 0);
  const totalSatellites = satellitePoints.reduce((sum, point) => sum + (point.satelliteCount || 0), 0);

  return {
    totalPoints: sortedPoints.length,
    validPoints: validPoints.length,
    averageSpeed: speedPoints.length ? totalSpeed / speedPoints.length : 0,
    maxSpeed: sortedPoints.reduce((max, point) => Math.max(max, point.speed || 0), 0),
    averageSatellites: satellitePoints.length ? totalSatellites / satellitePoints.length : 0,
    ignitionOnPoints,
    firstPoint: sortedPoints[0],
    lastPoint: sortedPoints[sortedPoints.length - 1],
    lastKnownAddress: sortedPoints[sortedPoints.length - 1]?.address || "",
    lastKnownSite: sortedPoints[sortedPoints.length - 1]?.containingSiteName || "",
  };
};

const VehicleTrackMap = ({ mapApiKey, points }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polylineRef = useRef(null);
  const markersRef = useRef([]);
  const [mapError, setMapError] = useState("");
  const [isMapLoading, setIsMapLoading] = useState(false);

  const clearMapOverlays = useCallback(() => {
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
  }, []);

  const drawTrack = useCallback(() => {
    if (!mapInstanceRef.current || !window.google?.maps || !points.length) {
      return;
    }

    clearMapOverlays();

    const path = points
      .filter((point) => point.latitude && point.longitude)
      .map((point) => ({ lat: Number(point.latitude), lng: Number(point.longitude) }));

    if (!path.length) {
      setMapError("Track points are available but do not include usable coordinates.");
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();
    path.forEach((coordinate) => bounds.extend(coordinate));

    polylineRef.current = new window.google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: "#0078d4",
      strokeOpacity: 0.9,
      strokeWeight: 4,
    });
    polylineRef.current.setMap(mapInstanceRef.current);

    const firstPoint = path[0];
    const lastPoint = path[path.length - 1];

    markersRef.current = [
      new window.google.maps.Marker({
        position: firstPoint,
        map: mapInstanceRef.current,
        title: "Track start",
        label: "S",
      }),
      new window.google.maps.Marker({
        position: lastPoint,
        map: mapInstanceRef.current,
        title: "Track end",
        label: "E",
      }),
    ];

    mapInstanceRef.current.fitBounds(bounds, 32);
    setMapError("");
  }, [clearMapOverlays, points]);

  useEffect(() => () => {
    clearMapOverlays();
  }, [clearMapOverlays]);

  useEffect(() => {
    let isActive = true;

    const initializeMap = () => {
      if (!isActive || !mapContainerRef.current || !window.google?.maps) {
        return;
      }

      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new window.google.maps.Map(mapContainerRef.current, {
          center: { lat: -1.286389, lng: 36.817223 },
          zoom: 8,
          mapTypeId: "roadmap",
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
        });
      }

      drawTrack();
    };

    const ensureMapScript = async () => {
      if (!mapApiKey) {
        setMapError("Google Maps API key is not configured.");
        return;
      }

      if (window.google?.maps) {
        initializeMap();
        return;
      }

      setIsMapLoading(true);

      const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
      if (existingScript) {
        existingScript.addEventListener("load", initializeMap, { once: true });
        existingScript.addEventListener("error", () => setMapError("Failed to load Google Maps."), { once: true });
        setIsMapLoading(false);
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${mapApiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setIsMapLoading(false);
        initializeMap();
      };
      script.onerror = () => {
        setIsMapLoading(false);
        setMapError("Failed to load Google Maps.");
      };
      document.head.appendChild(script);
    };

    ensureMapScript();

    return () => {
      isActive = false;
    };
  }, [drawTrack, mapApiKey]);

  useEffect(() => {
    if (window.google?.maps && mapInstanceRef.current) {
      drawTrack();
    }
  }, [drawTrack]);

  return (
    <div className="vehicle-consumption-module__map-shell">
      <div className="vehicle-consumption-module__map-toolbar">
        <div>
          <strong>Selected-day track</strong>
          <p>{points.length ? `${points.length} GPS point(s) available for drawing.` : "No GPS points available for the selected record date."}</p>
        </div>
        <button type="button" className="m365-btn m365-btn--ghost" onClick={drawTrack} disabled={!points.length || isMapLoading}>
          <i className="fa-light fa-draw-circle" />
          Draw track
        </button>
      </div>

      {mapError ? (
        <div className="m365-info-banner m365-info-banner--warning">
          <i className="fa-light fa-map-location-dot m365-info-banner__icon" />
          <span className="m365-info-banner__text">{mapError}</span>
        </div>
      ) : null}

      <div className="vehicle-consumption-module__map-frame">
        {isMapLoading ? (
          <div className="vehicle-consumption-module__map-loading">
            <LoadIndicator width="32px" height="32px" visible={true} />
            <span>Loading map...</span>
          </div>
        ) : null}
        <div ref={mapContainerRef} className="vehicle-consumption-module__map-canvas" />
      </div>
    </div>
  );
};

const VehicleConsumptionDetails = () => {
  const { consumptionId } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canReadConsumption = hasPermission("_Read_VehicleConsumptionReport");

  const [detail, setDetail] = useState(null);
  const [activeTab, setActiveTab] = useState("history");
  const [historyRecords, setHistoryRecords] = useState([]);
  const [trackPoints, setTrackPoints] = useState([]);
  const [mapApiKey, setMapApiKey] = useState("");
  const [supportingLoading, setSupportingLoading] = useState(false);
  const [supportingError, setSupportingError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const gpsSummary = useMemo(() => buildGpsSummary(trackPoints), [trackPoints]);
  const signalQuality = useMemo(() => getSignalQuality(Math.round(gpsSummary.averageSatellites)), [gpsSummary.averageSatellites]);

  const loadDetail = useCallback(async () => {
    if (!consumptionId || !canReadConsumption) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSupportingError("");

      const result = await getVehicleConsumptionRecordDetail(consumptionId);
      setDetail(result);

      if (result?.vehicleId && result?.date) {
        setSupportingLoading(true);
        const [historyResult, trackPointResult, mapApiKeyResult] = await Promise.allSettled([
          getVehicleConsumptionHistory(result.vehicleId, result.date, 5),
          getVehicleConsumptionTrackPoints(result.vehicleId, result.date, 5000),
          getGoogleMapsApiKey(),
        ]);

        setHistoryRecords(historyResult.status === "fulfilled" ? historyResult.value : []);
        setTrackPoints(trackPointResult.status === "fulfilled" ? trackPointResult.value : []);
        setMapApiKey(mapApiKeyResult.status === "fulfilled" ? mapApiKeyResult.value : "");

        if (historyResult.status === "rejected" || trackPointResult.status === "rejected") {
          setSupportingError("Some supporting history or GPS details could not be loaded for this record.");
        }
      } else {
        setHistoryRecords([]);
        setTrackPoints([]);
      }
    } catch (requestError) {
      setDetail(null);
      setError(requestError?.response?.data?.message || requestError.message || "Failed to load the consumption record.");
    } finally {
      setSupportingLoading(false);
      setLoading(false);
    }
  }, [canReadConsumption, consumptionId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  if (!canReadConsumption) {
    return (
      <div className="vehicle-consumption-module">
        <div className="m365-info-banner m365-info-banner--warning">
          <i className="fa-light fa-lock m365-info-banner__icon" />
          <span className="m365-info-banner__text">You do not have permission to view vehicle consumption detail.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="vehicle-consumption-module">
      <section className="vehicle-consumption-module__panel">
        <div className="m365-page-header">
          <div className="m365-page-header__left vehicle-consumption-module__header-copy">
            <div className="vehicle-consumption-module__eyebrow">Record detail</div>
            <div className="tw-flex tw-items-center tw-gap-2">
              <i className="fa-light fa-file-magnifying-glass m365-page-header__icon" />
              <h2 className="m365-page-header__title">Consumption Record Detail</h2>
            </div>
            <p className="vehicle-consumption-module__subtitle">
              Raw row values from the vehicle consumption source, preserved without reinterpreting calendar dates or units.
            </p>
          </div>
          <div className="vehicle-consumption-module__header-actions">
            <button type="button" className="m365-btn m365-btn--ghost" onClick={() => navigate("/vehicles/consumption")}>
              <i className="fa-light fa-arrow-left" />
              Back to module
            </button>
            <button type="button" className="m365-btn m365-btn--ghost" onClick={loadDetail} disabled={loading}>
              <i className={`fa-light fa-arrows-rotate${loading ? " tw-animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="m365-info-banner m365-info-banner--error">
          <i className="fa-light fa-circle-exclamation m365-info-banner__icon" />
          <span className="m365-info-banner__text">{error}</span>
        </div>
      ) : null}

      {supportingError ? (
        <div className="m365-info-banner m365-info-banner--warning">
          <i className="fa-light fa-triangle-exclamation m365-info-banner__icon" />
          <span className="m365-info-banner__text">{supportingError}</span>
        </div>
      ) : null}

      {detail ? (
        <>
          <section className="vehicle-consumption-module__panel vehicle-consumption-module__hero">
            <div className="vehicle-consumption-module__hero-main">
              <div className="vehicle-consumption-module__hero-icon">
                <i className="fa-light fa-truck-front" />
              </div>
              <div className="vehicle-consumption-module__hero-copy">
                <div className="vehicle-consumption-module__eyebrow">Vehicle context</div>
                <h3>{detail.hyoungNo || "Unknown vehicle"} {detail.numberPlate ? `· ${detail.numberPlate}` : ""}</h3>
                <p>
                  {[detail.manufacturerName, detail.vehicleModelName, detail.vehicleTypeName].filter(Boolean).join(" · ") || "Vehicle metadata unavailable"}
                </p>
              </div>
            </div>
            <div className="vehicle-consumption-module__hero-tags">
              <span className="vehicle-consumption-module__chip"><i className="fa-light fa-calendar-day" />{formatDisplayDate(detail.date)}</span>
              <span className="vehicle-consumption-module__chip"><i className="fa-light fa-warehouse" />{detail.siteName || "Unknown site"}</span>
              <span className="vehicle-consumption-module__chip"><i className="fa-light fa-sliders" />{getModeLabel(detail.isKmPerLiter)}</span>
              <span className="vehicle-consumption-module__chip"><i className="fa-light fa-user" />{detail.assignedEmployeeName || detail.sourceDriverName || "No driver"}</span>
            </div>
          </section>

          <section className="vehicle-consumption-module__summary-grid">
            <article className="vehicle-consumption-module__summary-card">
              <div className="vehicle-consumption-module__summary-top">
                <span className="vehicle-consumption-module__summary-label">Actual Efficiency</span>
                <span className="vehicle-consumption-module__summary-icon"><i className="fa-light fa-gauge-high" /></span>
              </div>
              <div className="vehicle-consumption-module__summary-value">
                {formatNumber(detail.actualEfficiency)}
                <span className="vehicle-consumption-module__summary-unit">{getModeLabel(detail.isKmPerLiter)}</span>
              </div>
              <div className="vehicle-consumption-module__summary-meta">Expected {formatNumber(detail.expectedAverage)} {getModeLabel(detail.isKmPerLiter)}</div>
            </article>

            <article className="vehicle-consumption-module__summary-card">
              <div className="vehicle-consumption-module__summary-top">
                <span className="vehicle-consumption-module__summary-label">Total Fuel</span>
                <span className="vehicle-consumption-module__summary-icon"><i className="fa-light fa-gas-pump" /></span>
              </div>
              <div className="vehicle-consumption-module__summary-value">{formatNumber(detail.totalFuel)}<span className="vehicle-consumption-module__summary-unit">L</span></div>
              <div className="vehicle-consumption-module__summary-meta">Fuel lost {formatNumber(detail.fuelLost)} L</div>
            </article>

            <article className="vehicle-consumption-module__summary-card">
              <div className="vehicle-consumption-module__summary-top">
                <span className="vehicle-consumption-module__summary-label">Distance</span>
                <span className="vehicle-consumption-module__summary-icon"><i className="fa-light fa-route" /></span>
              </div>
              <div className="vehicle-consumption-module__summary-value">{formatNumber(detail.totalDistance)}<span className="vehicle-consumption-module__summary-unit">km</span></div>
              <div className="vehicle-consumption-module__summary-meta">Engine hours {formatNumber(detail.engineHours)} hr</div>
            </article>

            <article className="vehicle-consumption-module__summary-card">
              <div className="vehicle-consumption-module__summary-top">
                <span className="vehicle-consumption-module__summary-label">Record Date</span>
                <span className="vehicle-consumption-module__summary-icon"><i className="fa-light fa-calendar-day" /></span>
              </div>
              <div className="vehicle-consumption-module__summary-value">{formatDisplayDate(detail.date)}</div>
              <div className="vehicle-consumption-module__summary-meta">Mode {getModeLabel(detail.isKmPerLiter)}</div>
            </article>
          </section>

          <section className="m365-section-group vehicle-consumption-module__panel">
            <div className="m365-section-group__header">
              <i className="fa-light fa-grid-2 m365-section-group__icon" />
              <h3 className="m365-section-group__title">Vehicle Consumption Details</h3>
            </div>
            <div className="m365-section-group__body vehicle-consumption-module__detail-stack">
              <div className="vehicle-consumption-module__detail-grid">
                <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Vehicle</span><span className="vehicle-consumption-module__info-value">{detail.hyoungNo || "-"}</span></div>
                <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Plate</span><span className="vehicle-consumption-module__info-value">{detail.numberPlate || "-"}</span></div>
                <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Source Driver</span><span className="vehicle-consumption-module__info-value">{detail.sourceDriverName || "-"}</span></div>
                <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Assigned Employee</span><span className="vehicle-consumption-module__info-value">{detail.assignedEmployeeName || "-"}</span></div>
                <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Report Reference</span><span className="vehicle-consumption-module__info-value">{detail.reportReference || "-"}</span></div>
                <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Modified</span><span className="vehicle-consumption-module__info-value">{normalizeBooleanLabel(detail.isModified)}</span></div>
                <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Modified Date</span><span className="vehicle-consumption-module__info-value">{detail.modifiedDate ? formatDisplayDate(detail.modifiedDate) : "-"}</span></div>
                <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Expected Average</span><span className="vehicle-consumption-module__info-value">{formatNumber(detail.expectedAverage)} {getModeLabel(detail.isKmPerLiter)}</span></div>
                <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Actual Efficiency</span><span className="vehicle-consumption-module__info-value">{formatNumber(detail.actualEfficiency)} {getModeLabel(detail.isKmPerLiter)}</span></div>
                <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Average Speed</span><span className="vehicle-consumption-module__info-value">{formatNumber(detail.avgSpeed)} km/h</span></div>
                <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Max Speed</span><span className="vehicle-consumption-module__info-value">{formatNumber(detail.maxSpeed)} km/h</span></div>
                <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Flow Meter Fuel Used</span><span className="vehicle-consumption-module__info-value">{formatNumber(detail.flowMeterFuelUsed)} L</span></div>
                <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Flow Meter Fuel Lost</span><span className="vehicle-consumption-module__info-value">{formatNumber(detail.flowMeterFuelLost)} L</span></div>
                <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Flow Meter Efficiency</span><span className="vehicle-consumption-module__info-value">{formatNumber(detail.flowMeterEfficiency)} {getModeLabel(detail.isKmPerLiter)}</span></div>
                <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Flow Meter Engine Hours</span><span className="vehicle-consumption-module__info-value">{formatNumber(detail.flowMeterEngineHours)} hr</span></div>
              </div>
              <div className="vehicle-consumption-module__info-cell vehicle-consumption-module__info-cell--wide">
                <span className="vehicle-consumption-module__info-label">Comments</span>
                <span className="vehicle-consumption-module__info-note">{detail.comments || "-"}</span>
              </div>
            </div>
          </section>

          <section className="vehicle-consumption-module__panel">
            <div className="vehicle-consumption-module__tab-header">
              <div>
                <div className="vehicle-consumption-module__eyebrow">Analysis</div>
                <h3 className="vehicle-consumption-module__tab-title">History, GPS details, and selected-day map</h3>
              </div>
              {supportingLoading ? (
                <div className="vehicle-consumption-module__tab-loading">
                  <LoadIndicator width="24px" height="24px" visible={true} />
                  <span>Loading support data...</span>
                </div>
              ) : null}
            </div>

            <div className="vehicle-consumption-module__tab-list" role="tablist" aria-label="Consumption detail panels">
              {TAB_ITEMS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`vehicle-consumption-module__tab-button${activeTab === tab.id ? " vehicle-consumption-module__tab-button--active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <i className={tab.icon} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="vehicle-consumption-module__tab-panel">
              {activeTab === "history" ? (
                <div className="vehicle-consumption-module__tab-content">
                  <div className="vehicle-consumption-module__grid-title">
                    <div>
                      <h3>Last 5 records on file</h3>
                      <p>Shows recent `vehicleconsumption` rows for this vehicle ending on the selected record date.</p>
                    </div>
                  </div>

                  <DataGrid
                    dataSource={historyRecords}
                    keyExpr="id"
                    showBorders={true}
                    hoverStateEnabled={true}
                    columnAutoWidth={true}
                    noDataText={supportingLoading ? "Loading history..." : "No history records found for this vehicle."}
                    rowAlternationEnabled={false}
                    onRowPrepared={(event) => {
                      if (event.rowType === "data" && event.data?.id === detail.id) {
                        event.rowElement.classList.add("vehicle-consumption-module__history-row--active");
                      }
                    }}
                  >
                    <Paging enabled={false} />
                    <Scrolling mode="standard" showScrollbar="always" />
                    <Column dataField="date" caption="Date" customizeText={({ value }) => formatDisplayDate(value)} minWidth={120} />
                    <Column dataField="employeeName" caption="Driver" minWidth={160} />
                    <Column dataField="siteName" caption="Site" minWidth={120} />
                    <Column dataField="totalFuel" caption="Fuel (L)" alignment="right" customizeText={({ value }) => formatNumber(value)} minWidth={100} />
                    <Column dataField="fuelLost" caption="Lost (L)" alignment="right" customizeText={({ value }) => formatNumber(value)} minWidth={100} />
                    <Column dataField="totalDistance" caption="Distance" alignment="right" customizeText={({ value }) => formatNumber(value)} minWidth={110} />
                    <Column dataField="fuelEfficiency" caption={`Efficiency (${getModeLabel(detail.isKmPerLiter)})`} alignment="right" customizeText={({ value }) => formatNumber(value)} minWidth={140} />
                    <Column dataField="comments" caption="Comments" minWidth={220} />
                  </DataGrid>
                </div>
              ) : null}

              {activeTab === "gps" ? (
                <div className="vehicle-consumption-module__tab-content vehicle-consumption-module__gps-grid-shell">
                  <div className="vehicle-consumption-module__detail-grid">
                    <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Signal Quality</span><span className={`vehicle-consumption-module__info-value ${signalQuality.accentClass}`}>{signalQuality.label}</span></div>
                    <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Average Satellites</span><span className="vehicle-consumption-module__info-value">{formatNumber(gpsSummary.averageSatellites, 0)}</span></div>
                    <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">GPS Points</span><span className="vehicle-consumption-module__info-value">{formatNumber(gpsSummary.totalPoints, 0)}</span></div>
                    <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Valid Points</span><span className="vehicle-consumption-module__info-value">{formatNumber(gpsSummary.validPoints, 0)}</span></div>
                    <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Average Speed</span><span className="vehicle-consumption-module__info-value">{formatNumber(gpsSummary.averageSpeed)} km/h</span></div>
                    <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Max Speed</span><span className="vehicle-consumption-module__info-value">{formatNumber(gpsSummary.maxSpeed)} km/h</span></div>
                    <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Ignition ON Points</span><span className="vehicle-consumption-module__info-value">{formatNumber(gpsSummary.ignitionOnPoints, 0)}</span></div>
                    <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">First Point</span><span className="vehicle-consumption-module__info-value">{formatDateTime(gpsSummary.firstPoint?.timestamp)}</span></div>
                    <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Last Point</span><span className="vehicle-consumption-module__info-value">{formatDateTime(gpsSummary.lastPoint?.timestamp)}</span></div>
                  </div>

                  <div className="vehicle-consumption-module__detail-grid">
                    <div className="vehicle-consumption-module__info-cell vehicle-consumption-module__info-cell--wide"><span className="vehicle-consumption-module__info-label">Last Known Address</span><span className="vehicle-consumption-module__info-note">{gpsSummary.lastKnownAddress || "-"}</span></div>
                    <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Containing Site</span><span className="vehicle-consumption-module__info-value">{gpsSummary.lastKnownSite || "-"}</span></div>
                    <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Track Start</span><span className="vehicle-consumption-module__info-value">{gpsSummary.firstPoint ? `${formatNumber(gpsSummary.firstPoint.latitude, 6)}, ${formatNumber(gpsSummary.firstPoint.longitude, 6)}` : "-"}</span></div>
                    <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Track End</span><span className="vehicle-consumption-module__info-value">{gpsSummary.lastPoint ? `${formatNumber(gpsSummary.lastPoint.latitude, 6)}, ${formatNumber(gpsSummary.lastPoint.longitude, 6)}` : "-"}</span></div>
                  </div>

                  <DataGrid
                    dataSource={trackPoints.slice(0, 12)}
                    keyExpr="id"
                    showBorders={true}
                    columnAutoWidth={true}
                    noDataText={supportingLoading ? "Loading GPS detail..." : "No GPS points found for this record date."}
                  >
                    <Paging enabled={false} />
                    <Scrolling mode="standard" showScrollbar="always" />
                    <Column dataField="timestamp" caption="Timestamp" customizeText={({ value }) => formatDateTime(value)} minWidth={170} />
                    <Column dataField="speed" caption="Speed" alignment="right" customizeText={({ value }) => `${formatNumber(value)} km/h`} minWidth={100} />
                    <Column dataField="satelliteCount" caption="Satellites" alignment="right" customizeText={({ value }) => formatNumber(value, 0)} minWidth={90} />
                    <Column dataField="fuelLevel" caption="Fuel Level" alignment="right" customizeText={({ value }) => `${formatNumber(value)} L`} minWidth={100} />
                    <Column dataField="ignitionStatus" caption="Ignition" customizeText={({ value }) => (value == null ? "-" : value ? "ON" : "OFF")} minWidth={90} />
                    <Column dataField="containingSiteName" caption="Site" minWidth={120} />
                    <Column dataField="address" caption="Address" minWidth={220} />
                  </DataGrid>
                </div>
              ) : null}

              {activeTab === "map" ? (
                <div className="vehicle-consumption-module__tab-content">
                  <VehicleTrackMap mapApiKey={mapApiKey} points={trackPoints} />
                </div>
              ) : null}
            </div>
          </section>
        </>
      ) : (
        <VehicleConsumptionEmptyState
          title="Consumption detail unavailable"
          description={loading ? "Loading the selected record..." : "The selected record could not be loaded with the current permissions or filters."}
          icon="fa-light fa-file-circle-question"
        />
      )}
    </div>
  );
};

export default VehicleConsumptionDetails;