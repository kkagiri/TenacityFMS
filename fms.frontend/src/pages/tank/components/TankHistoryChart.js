/**
 * File:          TankHistoryChart.js
 * Purpose:       Line chart showing tank volume over time with rich tooltips.
 *                Extracted from TankHistory.js to keep files under 600 lines.
 * Dependencies:  devextreme-react/chart
 * Last Modified: 2026-02-26
 *
 * Props:
 * - dataSource  (array): History records with timestamp, newVolume, volumeChange, etc.
 */
import React from "react";
import {
  Chart,
  Series,
  CommonSeriesSettings,
  Legend,
  ValueAxis,
  ArgumentAxis,
  Label,
  Tooltip,
} from "devextreme-react/chart";

/* ── reason mapping ── */
const REASON_NAMES = {
  0: "Opening Stock",
  1: "Closing Stock",
  2: "Delivery",
  3: "Transfer In",
  4: "Transfer Out",
  5: "Adjustment",
  6: "Dispensing",
};

const customizeTooltip = (pointInfo) => {
  const { argument, value, point } = pointInfo;

  if (!point?.data) {
    return {
      html: `<div style="padding:8px;font-size:12px;">
        <strong>Volume:</strong> ${value?.toLocaleString() || "N/A"} L<br/>
        <strong>Date:</strong> ${new Date(argument).toLocaleDateString()}
      </div>`,
    };
  }

  const {
    changeReason,
    vehicleName,
    volumeChange,
    recordedByUserName,
    site,
    referenceType,
    referenceId,
  } = point.data;

  const d = new Date(argument);
  const fmtDate = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${d.getFullYear()}`;
  const fmtTime = d.toLocaleTimeString();

  const reasonText = REASON_NAMES[changeReason] || "Unknown";
  const vc = volumeChange || 0;
  const sign = vc > 0 ? "+" : "";

  let html = `
    <div style="padding:10px;background:#fff;border:1px solid #d1d5db;border-radius:6px;
                box-shadow:0 4px 6px rgba(0,0,0,.1);font-size:12px;line-height:1.5;min-width:200px;">
      <div style="font-weight:600;color:#1f2937;margin-bottom:6px;text-align:center;">
        Tank Volume Details
      </div>
      <span><strong>Date:</strong> ${fmtDate}</span><br/>
      <span><strong>Time:</strong> ${fmtTime}</span><br/>
      <span><strong>Volume:</strong> ${value.toLocaleString()} L</span><br/>
      <span><strong>Change:</strong> ${sign}${vc.toFixed(2)} L</span><br/>
      <span><strong>Type:</strong> ${reasonText}</span>`;

  if (changeReason === 6 && vehicleName?.trim()) {
    html += `<br/><span><strong>Vehicle:</strong> ${vehicleName}</span>`;
  }
  if (site?.trim()) {
    html += `<br/><span><strong>Site:</strong> ${site}</span>`;
  }
  if (recordedByUserName?.trim()) {
    html += `<br/><span><strong>Recorded By:</strong> ${recordedByUserName}</span>`;
  }
  if (referenceType && referenceId) {
    html += `<br/><span><strong>Reference:</strong> ${referenceType} #${referenceId}</span>`;
  }

  html += "</div>";
  return { html };
};

const TankHistoryChart = ({ dataSource }) => (
  <Chart
    dataSource={dataSource}
    height={400}
    title="Tank Volume Over Time"
    tooltip={{ enabled: true, format: "fixedPoint", precision: 2, container: "body" }}
  >
    <CommonSeriesSettings argumentField="timestamp" type="line" />
    <Series
      valueField="newVolume"
      name="Tank Volume"
      color="#3b82f6"
      width={3}
      point={{
        visible: true,
        size: 8,
        symbol: "circle",
        color: "#1d4ed8",
        border: { visible: true, width: 2, color: "#fff" },
      }}
    />
    <ValueAxis>
      <Label format="#,##0 L" />
    </ValueAxis>
    <ArgumentAxis>
      <Label
        customizeText={(e) =>
          new Date(e.value).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        }
        rotationAngle={45}
      />
    </ArgumentAxis>
    <Legend visible />
    <Tooltip enabled customizeTooltip={customizeTooltip} />
  </Chart>
);

export default TankHistoryChart;
