/**
 * File: VehicleTripBadges.js
 * Purpose: Renders reusable M365-style badges for trip status, reconciliation, confidence, and anomaly signals.
 * Dependencies: React, vehicleTripUi helpers.
 * Last Modified: 2026-03-11
 */
import React from "react";
import {
  getAnomalyItems,
  getConfidenceConfig,
  getReconciliationConfig,
  getTripStatusConfig,
} from "../utils/vehicleTripUi";
import "./VehicleTripBadges.scss";

const VehicleTripBadge = ({ label, tone = "neutral", compact = false }) => (
  <span className={`vehicle-trip-badge vehicle-trip-badge--${tone}${compact ? " vehicle-trip-badge--compact" : ""}`}>
    {label}
  </span>
);

export const VehicleTripStatusBadge = ({ status, compact = false }) => {
  const config = getTripStatusConfig(status);
  return <VehicleTripBadge label={config.label} tone={config.tone} compact={compact} />;
};

export const VehicleTripReconciliationBadge = ({ status, compact = false }) => {
  const config = getReconciliationConfig(status);
  return <VehicleTripBadge label={config.label} tone={config.tone} compact={compact} />;
};

export const VehicleTripConfidenceBadge = ({ score, band, compact = false }) => {
  const config = getConfidenceConfig(score, band);
  return <VehicleTripBadge label={config.label} tone={config.tone} compact={compact} />;
};

export const VehicleTripAnomalyBadges = ({ anomalyFlags, compact = false, maxVisible = 3 }) => {
  const anomalyItems = getAnomalyItems(anomalyFlags);

  if (!anomalyItems.length) {
    return <VehicleTripBadge label="No anomalies" tone="neutral" compact={compact} />;
  }

  const visibleItems = anomalyItems.slice(0, maxVisible);
  const remainingCount = anomalyItems.length - visibleItems.length;

  return (
    <>
      {visibleItems.map((item) => (
        <VehicleTripBadge key={item.key} label={item.label} tone={item.tone} compact={compact} />
      ))}
      {remainingCount > 0 ? (
        <VehicleTripBadge label={`+${remainingCount} more`} tone="neutral" compact={compact} />
      ) : null}
    </>
  );
};

export const VehicleTripBadgeCluster = ({
  status,
  reconciliationStatus,
  confidenceScore,
  confidenceBand,
  anomalyFlags,
  compact = false,
}) => {
  return (
    <div className={`vehicle-trip-badge-cluster${compact ? " vehicle-trip-badge-cluster--compact" : ""}`}>
      <VehicleTripStatusBadge status={status} compact={compact} />
      <VehicleTripReconciliationBadge status={reconciliationStatus} compact={compact} />
      <VehicleTripConfidenceBadge score={confidenceScore} band={confidenceBand} compact={compact} />
      <VehicleTripAnomalyBadges anomalyFlags={anomalyFlags} compact={compact} />
    </div>
  );
};

export default VehicleTripBadge;
