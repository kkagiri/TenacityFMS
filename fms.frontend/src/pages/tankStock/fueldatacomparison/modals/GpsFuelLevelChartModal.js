import React from "react";
import { Popup } from "devextreme-react/popup";
import { Button } from "devextreme-react/button";
import GpsFuelLevelChart from "../components/GpsFuelLevelChart";
import "./GpsFuelLevelChartModal.scss";

/**
 * GpsFuelLevelChartModal - Modal wrapper for GpsFuelLevelChart
 *
 * Used in FuelDataComparison to show GPS fuel level details
 * when a user clicks on a row in the comparison data grid.
 *
 * Features:
 * - Full-screen responsive modal
 * - Shows vehicle name and date in header
 * - Displays fuel level chart with range selector
 * - Highlights refill event if provided
 *
 * @param {boolean} visible - Modal visibility
 * @param {object} rowData - FuelDataComparisonDto from the data grid
 * @param {Function} onClose - Close callback
 * @returns {JSX.Element} GPS Fuel Level Chart Modal
 */
const GpsFuelLevelChartModal = ({ visible, rowData, onClose }) => {
  if (!rowData) return null;

  // Extract data from the row
  const vehicleId = rowData.gpsGateVehicleId || rowData.vehicleId;
  const vehicleName = rowData.vehicleName || `Vehicle ${vehicleId}`;
  const dispenseDate = rowData.dispenseDate;
  const siteName = rowData.siteName || "";

  // Debug: Log the date values to trace the issue
  console.log(
    "GpsFuelLevelChartModal - rowData.dispenseDate:",
    dispenseDate,
    "Type:",
    typeof dispenseDate
  );
  if (dispenseDate) {
    const parsed = new Date(dispenseDate);
    console.log(
      "GpsFuelLevelChartModal - Parsed date:",
      parsed.toString(),
      "Local date:",
      parsed.toLocaleDateString()
    );
  }

  // Create refill event marker data
  const refillEvent = {
    dispenseDate: dispenseDate,
    volume: rowData.gpsVolume || rowData.effectiveGpsVolume,
    ptsVolume: rowData.ptsVolume,
    manualVolume: rowData.manualVolume,
  };

  /**
   * Format date for modal title
   */
  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  /**
   * Render modal toolbar buttons
   */
  const renderToolbarItems = () => {
    return (
      <div className="tw-flex tw-items-center tw-gap-4">
        <Button
          icon="fa-light fa-xmark"
          text="Close"
          onClick={onClose}
          type="normal"
          stylingMode="outlined"
        />
      </div>
    );
  };

  /**
   * Render modal title content
   */
  const renderTitle = () => {
    return (
      <div className="modal-title-content tw-flex tw-items-center tw-justify-between tw-w-full tw-pr-4">
        <div className="tw-flex tw-items-center tw-gap-3">
          <div className="modal-title-icon">
            <i className="fa-light fa-chart-line-up"></i>
          </div>
          <div>
            <div className="tw-font-semibold tw-text-lg">{vehicleName}</div>
            <div className="tw-text-sm tw-text-gray-500">
              {formatDate(dispenseDate)}
              {siteName && ` • ${siteName}`}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-1.5 tw-text-gray-600 hover:tw-text-gray-800 hover:tw-bg-gray-100 tw-rounded tw-transition-colors tw-border tw-border-gray-300"
        >
          <i className="fa-light fa-xmark"></i>
          <span>Close</span>
        </button>
      </div>
    );
  };

  return (
    <Popup
      visible={visible}
      onHiding={onClose}
      dragEnabled={true}
      hideOnOutsideClick={false}
      showCloseButton={true}
      width="90%"
      height="90%"
      maxWidth={1400}
      maxHeight={900}
      minWidth={600}
      minHeight={500}
      className="gps-fuel-level-chart-modal"
      titleRender={renderTitle}
      toolbarItems={[
        {
          toolbar: "bottom",
          location: "after",
          widget: "dxButton",
          options: {
            text: "Close",
            icon: "fa-light fa-xmark",
            onClick: onClose,
            stylingMode: "outlined",
          },
        },
      ]}
    >
      <div className="modal-content">
        {/* Vehicle & Fuel Summary Header */}
        <div className="summary-header tw-mb-4">
          <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-4">
            {/* GPS Volume */}
            <div className="summary-item">
              <div className="summary-icon tw-bg-blue-100 tw-text-blue-600">
                <i className="fa-light fa-satellite-dish"></i>
              </div>
              <div className="summary-content">
                <div className="summary-value">
                  {rowData.gpsVolume?.toFixed(1) || "-"} L
                </div>
                <div className="summary-label">GPS Volume</div>
              </div>
            </div>

            {/* PTS Volume */}
            <div className="summary-item">
              <div className="summary-icon tw-bg-green-100 tw-text-green-600">
                <i className="fa-light fa-gauge"></i>
              </div>
              <div className="summary-content">
                <div className="summary-value">
                  {rowData.ptsVolume?.toFixed(1) || "-"} L
                </div>
                <div className="summary-label">PTS Volume</div>
              </div>
            </div>

            {/* Manual Volume */}
            <div className="summary-item">
              <div className="summary-icon tw-bg-amber-100 tw-text-amber-600">
                <i className="fa-light fa-pen"></i>
              </div>
              <div className="summary-content">
                <div className="summary-value">
                  {rowData.manualVolume?.toFixed(1) || "-"} L
                </div>
                <div className="summary-label">Manual Volume</div>
              </div>
            </div>

            {/* Variance */}
            <div className="summary-item">
              <div
                className={`summary-icon ${
                  rowData.totalVariance > 0
                    ? "tw-bg-red-100 tw-text-red-600"
                    : "tw-bg-gray-100 tw-text-gray-600"
                }`}
              >
                <i className="fa-light fa-triangle-exclamation"></i>
              </div>
              <div className="summary-content">
                <div
                  className={`summary-value ${
                    rowData.totalVariance > 0 ? "tw-text-red-600" : ""
                  }`}
                >
                  {rowData.totalVariance?.toFixed(1) || "0"} L
                </div>
                <div className="summary-label">
                  Variance ({rowData.variancePercent?.toFixed(1) || 0}%)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Component */}
        <GpsFuelLevelChart
          vehicleId={vehicleId}
          date={dispenseDate}
          vehicleName={vehicleName}
          refillEvent={refillEvent}
          height={400}
          showRangeSelector={true}
          showExport={true}
        />
      </div>
    </Popup>
  );
};

export default GpsFuelLevelChartModal;
