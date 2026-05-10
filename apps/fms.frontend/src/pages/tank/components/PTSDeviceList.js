/**
 * File:          PTSDeviceList.js
 * Purpose:       PTS device selection with live connection status from SignalR.
 *                Shows device info card when a device is selected.
 * Dependencies:  devextreme-react/select-box, M365SectionCard, M365InfoRow
 * Last Modified: 2026-02-26
 *
 * Props:
 * - devices           (array):  PTS devices enriched with liveStatus
 * - selectedDeviceId   (string): Currently selected ptsid
 * - onDeviceChange     (func):   (ptsid) => void
 * - signalRConnected   (bool):   Whether SignalR hub is online
 * - connecting         (bool):   Reconnection in progress
 * - onReconnect        (func):   Trigger SignalR reconnect
 */
import React from "react";
import { SelectBox } from "devextreme-react/select-box";
import M365SectionCard from "../../../components/m365/M365SectionCard";
import M365InfoRow from "../../../components/m365/M365InfoRow";

const PTSDeviceList = ({
  devices,
  selectedDeviceId,
  onDeviceChange,
  signalRConnected,
  connecting,
  onReconnect,
}) => {
  const selectedDevice = devices.find((d) => d.ptsid === selectedDeviceId);

  return (
    <>
      {/* ── SignalR status bar ── */}
      <div className="m365-pts-signalr-bar">
        <div className="tw-flex tw-items-center tw-gap-2">
          <i
            className={`fa-light ${
              signalRConnected ? "fa-wifi" : "fa-wifi-slash"
            }`}
            style={{
              color: signalRConnected
                ? "var(--m365-success)"
                : "var(--m365-danger)",
            }}
          />
          <div>
            <span className="m365-field__label tw-mb-0">
              SignalR Connection
            </span>
            <p className="m365-field__hint">
              {signalRConnected
                ? "Connected — receiving live probe data"
                : "Disconnected — connect to view live readings"}
            </p>
          </div>
        </div>
        <button
          className="m365-btn m365-btn--ghost"
          onClick={onReconnect}
          disabled={connecting}
        >
          <i
            className={`fa-light ${
              connecting ? "fa-spinner fa-spin" : "fa-plug"
            }`}
          />
          {signalRConnected ? "Refresh" : "Connect"}
        </button>
      </div>

      {/* ── Device Selector ── */}
      <M365SectionCard title="PTS Device" icon="fa-light fa-server">
        <div className="tw-space-y-3">
          <div>
            <label className="m365-field__label">Select Device</label>
            <SelectBox
              dataSource={devices}
              displayExpr={(item) => {
                if (!item) return "";
                const icon = item.isOnline ? "🟢" : "🔴";
                return `${icon} ${item.ptsName || item.name || item.ptsid} (${item.ptsid})`;
              }}
              valueExpr="ptsid"
              value={selectedDeviceId}
              onValueChanged={(e) => onDeviceChange(e.value || null)}
              placeholder={
                devices.length > 0
                  ? "Select a PTS device"
                  : "No PTS devices available"
              }
              searchEnabled
              height={34}
              stylingMode="outlined"
            />
            {devices.length === 0 && (
              <p className="m365-field__hint" style={{ color: "var(--m365-warning)" }}>
                No PTS devices found. Add devices in PTS Device Management.
              </p>
            )}
          </div>

          {/* ── Selected Device Info ── */}
          {selectedDevice && (
            <div className="m365-pts-device-info">
              <M365InfoRow
                label="Status"
                icon="fa-light fa-signal"
                value={
                  <span
                    className={`m365-badge ${
                      selectedDevice.isOnline
                        ? "m365-badge--success"
                        : "m365-badge--danger"
                    }`}
                  >
                    {selectedDevice.liveStatus}
                  </span>
                }
              />
              <M365InfoRow
                label="Connection"
                icon="fa-light fa-network-wired"
                value={selectedDevice.liveConnectionType || "Unknown"}
              />
              <M365InfoRow
                label="Last Activity"
                icon="fa-light fa-clock"
                value={
                  selectedDevice.liveLastActivity
                    ? new Date(selectedDevice.liveLastActivity).toLocaleString()
                    : "N/A"
                }
              />
            </div>
          )}
        </div>
      </M365SectionCard>
    </>
  );
};

export default PTSDeviceList;
