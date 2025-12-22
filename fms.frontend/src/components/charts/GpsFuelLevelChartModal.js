import React from "react";
import { Popup } from "devextreme-react/popup";
import GpsFuelLevelChart from "./GpsFuelLevelChart";
import "./GpsFuelLevelChartModal.scss";

/**
 * GpsFuelLevelChartModal - Reusable modal for displaying GPS fuel level chart
 *
 * Can be used by any component that needs to show GPS fuel data for a vehicle on a date.
 *
 * @param {boolean} visible - Modal visibility
 * @param {number} vehicleId - Vehicle ID to fetch fuel data for
 * @param {string} vehicleName - Vehicle name for display
 * @param {string|Date} date - Date to show fuel levels for
 * @param {string} siteName - Optional site name for display
 * @param {object} gpsRefuelingEntry - GPS refueling entry data from GpsGateReportEntry
 * @param {number} manualVolume - Manual fueling volume (liters) for the selected record
 * @param {Function|null} onEdit - Optional edit action (e.g., open Edit GPS Entry)
 * @param {boolean} isEditDisabled - Optional flag to show Edit but disable it
 * @param {Function} onClose - Close callback
 * @param {number} height - Optional chart height (default: 450)
 * @returns {JSX.Element} GPS Fuel Level Chart Modal
 */
const GpsFuelLevelChartModal = ({
  visible,
  vehicleId,
  vehicleName,
  date,
  siteName = "",
  gpsRefuelingEntry = null,
  manualVolume = null,
  onEdit = null,
  isEditDisabled = false,
  onClose,
  height = 450,
}) => {
  if (!visible) return null;

  /**
   * Format date for modal title
   */
  const formatDate = (dateValue) => {
    if (!dateValue) return "";
    const d = new Date(dateValue);
    return d.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  /**
   * Render modal title with close button
   */
  const renderTitle = () => {
    return (
      <div className="modal-title-content tw-flex tw-items-center tw-justify-between tw-w-full tw-pr-2">
        <div className="tw-flex tw-items-center tw-gap-3">
          <div className="modal-title-icon tw-w-10 tw-h-10 tw-rounded-lg tw-bg-purple-100 tw-text-purple-600 tw-flex tw-items-center tw-justify-center">
            <i className="fa-light fa-chart-line-up tw-text-lg"></i>
          </div>
          <div>
            <div className="tw-font-semibold tw-text-lg">
              {vehicleName || `Vehicle ${vehicleId}`}
            </div>
            <div className="tw-text-sm tw-text-gray-500">
              {formatDate(date)}
              {siteName && ` • ${siteName}`}
            </div>
          </div>
        </div>
        <div className="tw-flex tw-items-center tw-gap-2">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              disabled={isEditDisabled}
              className="tw-flex tw-items-center tw-justify-center tw-w-8 tw-h-8 tw-text-blue-600 hover:tw-text-blue-800 hover:tw-bg-blue-50 disabled:tw-opacity-40 disabled:tw-cursor-not-allowed tw-rounded tw-transition-colors"
              title="Edit"
            >
              <i className="fa-light fa-pen-to-square tw-text-lg"></i>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="tw-flex tw-items-center tw-justify-center tw-w-8 tw-h-8 tw-text-gray-500 hover:tw-text-gray-700 hover:tw-bg-gray-100 tw-rounded tw-transition-colors"
            title="Close"
          >
            <i className="fa-light fa-xmark tw-text-lg"></i>
          </button>
        </div>
      </div>
    );
  };

  return (
    <Popup
      visible={visible}
      onHiding={onClose}
      dragEnabled={true}
      hideOnOutsideClick={true}
      showCloseButton={false}
      width="90%"
      height="auto"
      maxWidth={1200}
      maxHeight="90%"
      minWidth={500}
      minHeight={400}
      className="gps-fuel-level-chart-modal"
      titleRender={renderTitle}
    >
      <div className="tw-p-4">
        <GpsFuelLevelChart
          vehicleId={vehicleId}
          date={date}
          vehicleName={vehicleName}
          gpsRefuelingEntry={gpsRefuelingEntry}
          manualVolume={manualVolume}
          height={height}
          showRangeSelector={true}
          showExport={true}
        />
      </div>
    </Popup>
  );
};

export default GpsFuelLevelChartModal;
