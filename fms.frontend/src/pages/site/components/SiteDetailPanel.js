/**
 * File:          SiteDetailPanel.js
 * Purpose:       Read-only site detail content rendered inside a SlidePanel.
 *                M365 project-style sections for scope, health, and GPSGate geofence context.
 * Dependencies:  react-redux, M365StatusBadge, SiteGeofenceMapPopup
 * Last Modified: 2026-02-26
 *
 * Props:
 * - site         (object):  The site to display (may be null)
 * - geofences    (array):   Cached geofence list (polygon)
 */
import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import M365StatusBadge from "../../../components/m365/M365StatusBadge";
import SiteGeofenceMapPopup from "./SiteGeofenceMapPopup";

const SiteDetailPanel = ({ site, geofences = [] }) => {
  const { siteStats, loadingStats } = useSelector((state) => state.site);
  const [showGeofenceMap, setShowGeofenceMap] = useState(false);

  const statValue = (field) =>
    loadingStats ? "..." : siteStats?.[field] ?? "-";

  const statNumber = (field) => {
    const value = statValue(field);
    return typeof value === "number" ? value.toLocaleString() : value;
  };

  const totalIssues = loadingStats ? null : siteStats?.issueCount;
  const openIssues = loadingStats ? null : siteStats?.openIssueCount;
  const closedIssues =
    typeof totalIssues === "number" && typeof openIssues === "number"
      ? Math.max(totalIssues - openIssues, 0)
      : null;

  const issueHealth = (() => {
    if (loadingStats || typeof openIssues !== "number") {
      return { label: "Syncing", tone: "neutral" };
    }
    if (openIssues === 0) {
      return { label: "Healthy", tone: "success" };
    }
    if (openIssues <= 3) {
      return { label: "Watch", tone: "warning" };
    }
    return { label: "Action Required", tone: "danger" };
  })();

  const hasGeofenceMapping = !!(site?.gpsGeofenceId || site?.gpsGeofenceName);

  const selectedGeofence = useMemo(() => {
    if (!site) return null;

    if (site.gpsGeofenceId) {
      const byId = (geofences || []).find(
        (geo) => String(geo.id) === String(site.gpsGeofenceId)
      );
      if (byId) return byId;
    }

    if (site.gpsGeofenceName) {
      return (
        (geofences || []).find((geo) => geo.name === site.gpsGeofenceName) || null
      );
    }

    return null;
  }, [geofences, site]);

  if (!site) {
    return (
      <div className="m365-site-detail__empty">
        <p>Select a site to view details</p>
      </div>
    );
  }

  return (
    <div className="m365-site-detail">
      <div className="m365-site-detail__intro">
        <div className="m365-site-detail__intro-icon">
          <i className="fa-light fa-buildings" />
        </div>
        <div className="m365-site-detail__intro-body">
          <span className="m365-site-detail__intro-eyebrow">Site overview</span>
          <div className="m365-site-detail__intro-meta">
            <M365StatusBadge isActive={site.isActive} />
            <span>{site.siteAdministratorName || "No administrator assigned"}</span>
            <span>{hasGeofenceMapping ? "Geofence mapped" : "Geofence not mapped"}</span>
          </div>
          <p className="m365-site-detail__intro-text">
            A site represents a project workspace with assigned users, vehicles, devices, issue tracking, and GPSGate location controls.
          </p>
        </div>
      </div>

      <div
        className="m365-flat-section"
        style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}
      >
        <h3 className="m365-flat-section__title">Site Information</h3>
        <div className="m365-info-grid">
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Site Name</span>
            <span className="m365-info-cell__value">{site.name}</span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Status</span>
            <span className="m365-info-cell__value">
              <M365StatusBadge isActive={site.isActive} />
            </span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Administrator</span>
            <span className="m365-info-cell__value">
              {site.siteAdministratorName || "Not Assigned"}
            </span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Project Type</span>
            <span className="m365-info-cell__value">Site Project</span>
          </div>
        </div>
      </div>

      <div
        className="m365-flat-section m365-flat-section--intro"
        style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}
      >
        <p className="m365-site-intro">Use these details to validate scope, location mapping, and operational health.</p>
      </div>

      <div className="m365-flat-section">
        <h3 className="m365-flat-section__title">Project Scope</h3>
        <div className="m365-info-grid">
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Users</span>
            <span className="m365-info-cell__value">{statNumber("userCount")}</span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Vehicles</span>
            <span className="m365-info-cell__value">
              {statNumber("vehicleCount")}
            </span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Devices</span>
            <span className="m365-info-cell__value">
              {statNumber("ptsDeviceCount")}
            </span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Issues</span>
            <span className="m365-info-cell__value">{statNumber("issueCount")}</span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Staff</span>
            <span className="m365-info-cell__value">
              {statNumber("employeeCount")}
            </span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Tanks</span>
            <span className="m365-info-cell__value">{statNumber("tankCount")}</span>
          </div>
        </div>
      </div>

      <div className="m365-flat-section">
        <div className="m365-flat-section__title-row">
          <h3 className="m365-flat-section__title">Location (GPSGate Geofence)</h3>
          <span
            className={`m365-health-pill m365-health-pill--${hasGeofenceMapping ? "success" : "neutral"
              }`}
          >
            {hasGeofenceMapping ? "Mapped" : "Not mapped"}
          </span>
        </div>
        <div className="m365-info-grid">
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">GPSGate Tag</span>
            <span className="m365-info-cell__value">
              {site.gpsGateTagName ? (
                <span className="tw-flex tw-items-center tw-gap-2">
                  <span
                    className="tw-w-3 tw-h-3 tw-rounded-full tw-inline-block"
                    style={{ backgroundColor: site.gpsGateTagColor || "#0078d4" }}
                  />
                  {site.gpsGateTagName}
                </span>
              ) : (
                "Not Configured"
              )}
            </span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Primary Geofence</span>
            <span className="m365-info-cell__value">
              {site.gpsGeofenceName || "Not Assigned"}
            </span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Geofence Type</span>
            <span className="m365-info-cell__value">
              {site.gpsGeofenceType || "Not Available"}
            </span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Center Coordinates</span>
            <span className="m365-info-cell__value">
              {site.gpsGeofenceCenterLatitude != null &&
                site.gpsGeofenceCenterLongitude != null
                ? `${Number(site.gpsGeofenceCenterLatitude).toFixed(5)}, ${Number(site.gpsGeofenceCenterLongitude).toFixed(5)}`
                : "Not Available"}
            </span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Boundary Map</span>
            <span className="m365-info-cell__value">
              {selectedGeofence ? (
                <button
                  type="button"
                  className="m365-btn m365-btn--ghost"
                  onClick={() => setShowGeofenceMap(true)}
                >
                  <i className="fa-light fa-draw-polygon"></i>
                  View boundary
                </button>
              ) : (
                "Not Available"
              )}
            </span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Auto-Update Vehicle Tags</span>
            <span className="m365-info-cell__value">
              {site.autoUpdateGpsGateTag ? "On" : "Off"}
            </span>
          </div>
        </div>
      </div>

      <div className="m365-flat-section">
        <div className="m365-flat-section__title-row">
          <h3 className="m365-flat-section__title">Issue Health</h3>
          <span className={`m365-health-pill m365-health-pill--${issueHealth.tone}`}>
            {issueHealth.label}
          </span>
        </div>
        <div className="m365-info-grid">
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Total Issues</span>
            <span className="m365-info-cell__value">{statNumber("issueCount")}</span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Open Issues</span>
            <span className="m365-info-cell__value">
              {typeof openIssues === "number" ? openIssues.toLocaleString() : "-"}
            </span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Closed Issues</span>
            <span className="m365-info-cell__value">
              {typeof closedIssues === "number" ? closedIssues.toLocaleString() : "-"}
            </span>
          </div>
        </div>
      </div>

      <SiteGeofenceMapPopup
        visible={showGeofenceMap}
        onClose={() => setShowGeofenceMap(false)}
        geofence={selectedGeofence}
      />
    </div>
  );
};

export default SiteDetailPanel;
