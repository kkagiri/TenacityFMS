/**
 * File: TankDetails.js
 * Purpose: Displays tank details and live PTS UploadStatus probe information.
 * Dependencies: react
 * Last Modified: 2026-02-04
 *
 * Key Functions/Components:
 * - TankDetails: Renders full tank profile including configuration, status, and live probe data.
 */
import React from "react";

const TankDetails = ({ tank, liveStatus, connectionStatus }) => {
  if (!tank) return null;

  const fillPercentage =
    tank.tankVolume > 0
      ? (((tank.currentStock || 0) / tank.tankVolume) * 100).toFixed(1)
      : 0;

  const getStatusLevel = (percentage) => {
    if (percentage < 20)
      return {
        text: "Critical",
        color: "tw-text-red-600",
        bg: "tw-bg-red-500",
      };
    if (percentage < 50)
      return { text: "Low", color: "tw-text-amber-600", bg: "tw-bg-amber-500" };
    if (percentage < 80)
      return {
        text: "Normal",
        color: "tw-text-emerald-600",
        bg: "tw-bg-emerald-500",
      };
    return { text: "Full", color: "tw-text-sky-600", bg: "tw-bg-sky-500" };
  };

  const status = getStatusLevel(fillPercentage);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const probes = liveStatus?.status?.probes;
  const onlineStatus = probes?.onlineStatus || probes?.OnlineStatus;
  const measurements = onlineStatus?.measurements || onlineStatus?.Measurements || [];
  const ids = onlineStatus?.ids || onlineStatus?.Ids || [];

  const probeReadings =
    Array.isArray(measurements) && measurements.length > 0
      ? measurements
        .map((measurement, index) => {
          const probeNumber =
            Number(
              measurement?.probeNumber ??
              measurement?.ProbeNumber ??
              ids[index] ??
              0
            ) || 0;

          if (probeNumber <= 0) {
            return null;
          }

          return {
            probeNumber,
            productVolume:
              measurement?.productVolume ?? measurement?.ProductVolume ?? null,
            productHeight:
              measurement?.productHeight ?? measurement?.ProductHeight ?? null,
            waterHeight:
              measurement?.waterHeight ?? measurement?.WaterHeight ?? null,
            temperature:
              measurement?.temperature ?? measurement?.Temperature ?? null,
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.probeNumber - b.probeNumber)
      : (Array.isArray(ids) ? ids : [])
        .map((id) => Number(id || 0))
        .filter((id) => id > 0)
        .map((probeNumber) => ({
          probeNumber,
          productVolume: null,
          productHeight: null,
          waterHeight: null,
          temperature: null,
        }));

  const selectedProbeReading =
    probeReadings.length === 0
      ? null
      : tank.probeNumber
        ? probeReadings.find((reading) => reading.probeNumber === tank.probeNumber) ||
        null
        : probeReadings[0];

  const InfoRow = ({ label, value, icon }) => (
    <div className="tw-flex tw-items-center tw-justify-between tw-py-3 tw-border-b tw-border-slate-100 last:tw-border-0">
      <span className="tw-text-slate-500 tw-text-sm tw-flex tw-items-center">
        {icon && <i className={`${icon} tw-mr-2 tw-w-4 tw-text-center`}></i>}
        {label}
      </span>
      <span className="tw-font-medium tw-text-slate-800">{value}</span>
    </div>
  );

  const SectionCard = ({ title, icon, children }) => (
    <div className="tw-bg-white tw-border tw-border-slate-200 tw-rounded-lg tw-shadow-sm hover:tw-shadow tw-transition-shadow">
      <div className="tw-px-4 tw-py-3 tw-border-b tw-border-slate-100 tw-bg-slate-50/50 tw-rounded-t-lg">
        <h3 className="tw-font-semibold tw-text-slate-700 tw-flex tw-items-center tw-text-sm tw-uppercase tw-tracking-wide">
          <i className={`${icon} tw-mr-2 tw-text-slate-500`}></i>
          {title}
        </h3>
      </div>
      <div className="tw-px-4 tw-py-2">{children}</div>
    </div>
  );

  return (
    <div className="tank-details tw-animate-fadeIn tw-space-y-6">
      {/* Header with Tank Gauge */}
      <div className="tw-bg-gradient-to-r tw-from-slate-800 tw-to-slate-700 tw-rounded-xl tw-p-6 tw-text-white tw-shadow-lg">
        <div className="tw-flex tw-flex-col lg:tw-flex-row tw-items-start lg:tw-items-center tw-justify-between tw-gap-6">
          {/* Tank Info */}
          <div className="tw-flex tw-items-center tw-gap-4">
            <div className="tw-w-16 tw-h-16 tw-rounded-full tw-bg-white/10 tw-flex tw-items-center tw-justify-center tw-backdrop-blur">
              <i className="fa-light fa-gas-pump tw-text-3xl"></i>
            </div>
            <div>
              <h2 className="tw-text-2xl tw-font-bold">{tank.name}</h2>
              <div className="tw-flex tw-items-center tw-gap-3 tw-mt-1">
                <span className="tw-text-slate-300 tw-text-sm">
                  {tank.siteName || "No Site"}
                </span>
                {tank.ptsId && (
                  <span className="tw-bg-white/10 tw-px-2 tw-py-0.5 tw-rounded tw-text-xs tw-backdrop-blur">
                    PTS: {tank.ptsId}
                  </span>
                )}
                {tank.probeNumber && (
                  <span className="tw-bg-emerald-500/20 tw-px-2 tw-py-0.5 tw-rounded tw-text-xs tw-backdrop-blur">
                    Probe: {tank.probeNumber}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tank Gauge Visual */}
          <div className="tw-flex tw-items-center tw-gap-6 tw-w-full lg:tw-w-auto">
            {/* Circular Gauge */}
            <div className="tw-relative tw-w-28 tw-h-28">
              <svg
                className="tw-w-full tw-h-full tw-transform -tw-rotate-90"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="12"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${fillPercentage * 2.51} 251`}
                  className={status.color}
                  style={{ transition: "stroke-dasharray 1s ease-out" }}
                />
              </svg>
              <div className="tw-absolute tw-inset-0 tw-flex tw-flex-col tw-items-center tw-justify-center">
                <span className="tw-text-2xl tw-font-bold">
                  {Math.round(fillPercentage)}%
                </span>
                <span className="tw-text-xs tw-text-slate-300">
                  {status.text}
                </span>
              </div>
            </div>

            {/* Volume Stats */}
            <div className="tw-space-y-2 tw-flex-1 lg:tw-flex-none">
              <div className="tw-flex tw-justify-between tw-items-center tw-gap-8">
                <span className="tw-text-slate-400 tw-text-sm">Current</span>
                <span className="tw-font-semibold">
                  {(tank.currentStock || 0).toLocaleString()} L
                </span>
              </div>
              <div className="tw-flex tw-justify-between tw-items-center tw-gap-8">
                <span className="tw-text-slate-400 tw-text-sm">Capacity</span>
                <span className="tw-font-semibold">
                  {tank.tankVolume.toLocaleString()} L
                </span>
              </div>
              <div className="tw-flex tw-justify-between tw-items-center tw-gap-8">
                <span className="tw-text-slate-400 tw-text-sm">Available</span>
                <span className="tw-font-semibold tw-text-emerald-400">
                  {(
                    tank.tankVolume - (tank.currentStock || 0)
                  ).toLocaleString()}{" "}
                  L
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="tw-mt-6">
          <div className="tw-bg-white/10 tw-rounded-full tw-h-2 tw-overflow-hidden">
            <div
              className={`tw-h-full tw-transition-all tw-duration-1000 tw-ease-out ${status.bg} tw-rounded-full`}
              style={{ width: `${fillPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-4">
        {/* Configuration */}
        <SectionCard title="Configuration" icon="fa-light fa-sliders">
          <InfoRow
            label="Book Keeping"
            icon="fa-light fa-book"
            value={
              tank.useBookKeeping ? (
                <span className="tw-inline-flex tw-items-center tw-gap-1 tw-text-emerald-600">
                  <i className="fa-light fa-check-circle"></i> Enabled
                </span>
              ) : (
                <span className="tw-inline-flex tw-items-center tw-gap-1 tw-text-slate-400">
                  <i className="fa-light fa-times-circle"></i> Disabled
                </span>
              )
            }
          />
          <InfoRow
            label="Auto Book Keeping"
            icon="fa-light fa-robot"
            value={
              tank.hasAutomaticBookKeeping ? (
                <span className="tw-inline-flex tw-items-center tw-gap-1 tw-text-emerald-600">
                  <i className="fa-light fa-check-circle"></i> Enabled
                </span>
              ) : (
                <span className="tw-inline-flex tw-items-center tw-gap-1 tw-text-slate-400">
                  <i className="fa-light fa-times-circle"></i> Disabled
                </span>
              )
            }
          />
          <InfoRow
            label="Priority"
            icon="fa-light fa-flag"
            value={
              tank.priority ? (
                <span
                  className={`tw-inline-flex tw-items-center tw-gap-1 tw-px-2 tw-py-0.5 tw-rounded tw-text-xs tw-font-medium ${tank.priority === "High"
                    ? "tw-bg-red-50 tw-text-red-700"
                    : tank.priority === "Medium"
                      ? "tw-bg-amber-50 tw-text-amber-700"
                      : "tw-bg-slate-50 tw-text-slate-700"
                    }`}
                >
                  {tank.priority}
                </span>
              ) : (
                <span className="tw-text-slate-400">Not Set</span>
              )
            }
          />
          <InfoRow
            label="Fuel Grade"
            icon="fa-light fa-droplet"
            value={tank.fuelGradeName || "Not Set"}
          />
          <InfoRow
            label="Threshold"
            icon="fa-light fa-triangle-exclamation"
            value={
              tank.discrepancyThreshold
                ? `${tank.discrepancyThreshold} L`
                : "Not Set"
            }
          />
        </SectionCard>

        {/* Dimensions */}
        <SectionCard title="Dimensions" icon="fa-light fa-ruler-combined">
          <InfoRow
            label="Height"
            icon="fa-light fa-arrows-up-down"
            value={tank.tankHeight ? `${tank.tankHeight} m` : "N/A"}
          />
          <InfoRow
            label="Length"
            icon="fa-light fa-arrows-left-right"
            value={tank.tankLength ? `${tank.tankLength} m` : "N/A"}
          />
          <InfoRow
            label="Volume"
            icon="fa-light fa-cube"
            value={`${tank.tankVolume.toLocaleString()} L`}
          />
        </SectionCard>

        {/* Status */}
        <SectionCard title="Status" icon="fa-light fa-chart-line">
          <InfoRow
            label="Last Book Update"
            icon="fa-light fa-clock"
            value={
              <span className="tw-text-xs">
                {formatDate(tank.lastStockUpdate)}
              </span>
            }
          />
          <InfoRow
            label="Physical Stock"
            icon="fa-light fa-gauge"
            value={
              tank.physicalStockValue || tank.physicalStockValue === 0
                ? `${tank.physicalStockValue.toLocaleString()} L`
                : "N/A"
            }
          />
          <InfoRow
            label="Physical Updated"
            icon="fa-light fa-timer"
            value={<span className="tw-text-xs">{formatDate(tank.lastPhysicalStockUpdate)}</span>}
          />
          <InfoRow
            label="Stock Source"
            icon="fa-light fa-database"
            value={tank.physicalStockSource || "System"}
          />
        </SectionCard>
      </div>

      {/* Live PTS section */}
      <SectionCard title="PTS Live Data" icon="fa-light fa-satellite-dish">
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-x-8">
          <InfoRow
            label="Connection"
            icon="fa-light fa-plug"
            value={
              tank.ptsId ? (
                <span
                  className={`tw-inline-flex tw-items-center tw-gap-1 ${connectionStatus?.status && connectionStatus.status !== "Disconnected"
                    ? "tw-text-emerald-600"
                    : "tw-text-amber-600"
                    }`}
                >
                  {connectionStatus?.status || "Awaiting signal"}
                </span>
              ) : (
                <span className="tw-text-slate-400">Not Linked</span>
              )
            }
          />
          <InfoRow
            label="Mapped Probe"
            icon="fa-light fa-link"
            value={tank.probeNumber || "Not Set"}
          />
          <InfoRow
            label="Auto Stock Updates"
            icon="fa-light fa-gauge-high"
            value={
              tank.usePtsProbeReadings ? (
                <span className="tw-text-emerald-600 tw-flex tw-items-center tw-gap-1">
                  <i className="fa-light fa-check-circle"></i> Enabled
                </span>
              ) : (
                <span className="tw-text-slate-400">Disabled</span>
              )
            }
          />
          <InfoRow
            label="Live Product Volume"
            icon="fa-light fa-chart-simple"
            value={
              selectedProbeReading?.productVolume || selectedProbeReading?.productVolume === 0
                ? `${Number(selectedProbeReading.productVolume).toFixed(2)} L`
                : "N/A"
            }
          />
          <InfoRow
            label="Last UploadStatus"
            icon="fa-light fa-waveform-lines"
            value={<span className="tw-text-xs">{formatDate(liveStatus?.receivedAt)}</span>}
          />
          <InfoRow
            label="Temperature"
            icon="fa-light fa-temperature-half"
            value={
              selectedProbeReading?.temperature || selectedProbeReading?.temperature === 0
                ? `${Number(selectedProbeReading.temperature).toFixed(1)} C`
                : "N/A"
            }
          />
          <InfoRow
            label="Product Height"
            icon="fa-light fa-arrows-up-down"
            value={
              selectedProbeReading?.productHeight || selectedProbeReading?.productHeight === 0
                ? `${Number(selectedProbeReading.productHeight).toFixed(1)} mm`
                : "N/A"
            }
          />
          <InfoRow
            label="Water Height"
            icon="fa-light fa-droplet"
            value={
              selectedProbeReading?.waterHeight || selectedProbeReading?.waterHeight === 0
                ? `${Number(selectedProbeReading.waterHeight).toFixed(1)} mm`
                : "N/A"
            }
          />
          <InfoRow
            label="Probe Data"
            icon="fa-light fa-circle-nodes"
            value={`${probeReadings.length} channel(s)`}
          />
        </div>
      </SectionCard>

      {/* Location Validation */}
      <SectionCard
        title="Location Validation"
        icon={
          tank.tankType === "MobileTanker"
            ? "fa-light fa-truck"
            : "fa-light fa-map-pin"
        }
      >
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-x-8">
          <InfoRow
            label="Tank Type"
            icon={
              tank.tankType === "MobileTanker"
                ? "fa-light fa-truck"
                : "fa-light fa-location-dot"
            }
            value={
              <span
                className={`tw-inline-flex tw-items-center tw-gap-2 tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-font-medium ${tank.tankType === "MobileTanker"
                  ? "tw-bg-amber-50 tw-text-amber-700"
                  : "tw-bg-sky-50 tw-text-sky-700"
                  }`}
              >
                {tank.tankType === "MobileTanker"
                  ? "Mobile Tanker"
                  : "Stationary"}
              </span>
            }
          />
          <InfoRow
            label="Validation Radius"
            icon="fa-light fa-circle-dot"
            value={`${tank.locationValidationRadius || 100} m`}
          />
          {tank.tankType === "MobileTanker" ? (
            <InfoRow
              label="Linked Vehicle"
              icon="fa-light fa-link"
              value={
                tank.linkedVehicleName || tank.linkedVehicleId ? (
                  tank.linkedVehicleName || `ID: ${tank.linkedVehicleId}`
                ) : (
                  <span className="tw-text-amber-600">Not Linked</span>
                )
              }
            />
          ) : (
            <>
              <InfoRow
                label="Latitude"
                icon="fa-light fa-location-crosshairs"
                value={
                  tank.latitude != null ? (
                    tank.latitude
                  ) : (
                    <span className="tw-text-slate-400">Not Set</span>
                  )
                }
              />
              <InfoRow
                label="Longitude"
                icon="fa-light fa-location-crosshairs"
                value={
                  tank.longitude != null ? (
                    tank.longitude
                  ) : (
                    <span className="tw-text-slate-400">Not Set</span>
                  )
                }
              />
            </>
          )}
        </div>
      </SectionCard>
    </div>
  );
};

export default TankDetails;
