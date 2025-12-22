import React from "react";
import { Popup } from "devextreme-react/popup";
import GpsMultiMetricChart from "./GpsMultiMetricChart";
import "./GpsMultiMetricChartModal.scss";

/**
 * GpsMultiMetricChartModal - Reusable modal for displaying multi-metric GPS chart
 *
 * Can be used by any component that needs to show multiple GPS metrics for a vehicle.
 * Supports filtering and combining multiple variables on the same chart.
 *
 * @param {boolean} visible - Modal visibility
 * @param {Array} data - Array of data points with timestamp and metric values
 * @param {Array} availableMetrics - Array of metric keys available in the data
 * @param {string} title - Modal/chart title
 * @param {string} subtitle - Optional subtitle (e.g., date range, vehicle name)
 * @param {Function} onClose - Close callback
 * @param {number} height - Optional chart height (default: 450)
 * @param {object} customMetrics - Custom metric definitions to override defaults
 * @param {string} iconClass - Optional icon class for the title (default: "fa-chart-mixed")
 * @param {string} iconBgColor - Optional icon background color class (default: "tw-bg-indigo-100")
 * @param {string} iconTextColor - Optional icon text color class (default: "tw-text-indigo-600")
 * @returns {JSX.Element} Multi-Metric Chart Modal
 */
const GpsMultiMetricChartModal = ({
  visible,
  data = [],
  availableMetrics = ["fuelLevel"],
  title = "GPS Metrics",
  subtitle = "",
  onClose,
  height = 450,
  customMetrics = {},
  iconClass = "fa-chart-mixed",
  iconBgColor = "tw-bg-indigo-100",
  iconTextColor = "tw-text-indigo-600",
}) => {
  if (!visible) return null;

  /**
   * Render modal title with close button
   */
  const renderTitle = () => {
    return (
      <div className="modal-title-content tw-flex tw-items-center tw-justify-between tw-w-full tw-pr-2">
        <div className="tw-flex tw-items-center tw-gap-3">
          <div
            className={`modal-title-icon tw-w-10 tw-h-10 tw-rounded-lg ${iconBgColor} ${iconTextColor} tw-flex tw-items-center tw-justify-center`}
          >
            <i className={`fa-light ${iconClass} tw-text-lg`}></i>
          </div>
          <div>
            <div className="tw-font-semibold tw-text-lg">{title}</div>
            {subtitle && (
              <div className="tw-text-sm tw-text-gray-500">{subtitle}</div>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="tw-flex tw-items-center tw-justify-center tw-w-8 tw-h-8 tw-text-gray-500 hover:tw-text-gray-700 hover:tw-bg-gray-100 tw-rounded tw-transition-colors"
          title="Close"
        >
          <i className="fa-light fa-xmark tw-text-lg"></i>
        </button>
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
      maxWidth={1400}
      maxHeight="90%"
      minWidth={600}
      minHeight={500}
      className="gps-multi-metric-chart-modal"
      titleRender={renderTitle}
    >
      <div className="tw-p-4">
        <GpsMultiMetricChart
          data={data}
          availableMetrics={availableMetrics}
          title=""
          subtitle=""
          height={height}
          showRangeSelector={true}
          showExport={true}
          showMetricFilter={true}
          customMetrics={customMetrics}
        />
      </div>
    </Popup>
  );
};

export default GpsMultiMetricChartModal;
