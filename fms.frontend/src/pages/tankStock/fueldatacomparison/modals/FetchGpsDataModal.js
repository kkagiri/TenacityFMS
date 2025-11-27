import React, { useState, useEffect } from 'react';
import { Popup } from 'devextreme-react/popup';
import { Button } from 'devextreme-react/button';
import { DateBox } from 'devextreme-react/date-box';
import { CheckBox } from 'devextreme-react/check-box';
import notify from 'devextreme/ui/notify';
import './FetchGpsDataModal.scss';

/**
 * FetchGpsDataModal - Trigger GPSGate Report 212 data fetch
 *
 * Features:
 * - Date range selection (start/end dates)
 * - Overwrite existing data option
 * - Validation for date range
 * - Fetches data for ALL vehicles (no filters)
 * - Cancel running fetch operation
 *
 * @param {boolean} visible - Modal visibility
 * @param {object} currentFilters - Current active filters { startDate, endDate }
 * @param {Function} onClose - Close callback
 * @param {Function} onFetch - Fetch callback with parameters
 * @param {boolean} isFetching - Whether GPS fetch is in progress
 * @param {string} currentJobId - Current GPS fetch job ID
 * @param {Function} onCancel - Cancel callback
 * @param {object} fetchProgress - Current fetch progress { status, progressPercent, message }
 * @returns {JSX.Element} Fetch GPS Data Modal
 */
const FetchGpsDataModal = ({
  visible,
  currentFilters,
  onClose,
  onFetch,
  isFetching: isGpsFetching = false,
  currentJobId = null,
  onCancel,
  fetchProgress = null
}) => {
  const [fetchParams, setFetchParams] = useState({
    startDate: null,
    endDate: null,
    overwriteExisting: false
  });

  /**
   * Load current filters on mount
   */
  useEffect(() => {
    if (currentFilters && visible) {
      setFetchParams({
        startDate: currentFilters.startDate || new Date(new Date().setDate(new Date().getDate() - 7)),
        endDate: currentFilters.endDate || new Date(),
        overwriteExisting: false
      });
    } else if (visible) {
      // Default to last 7 days
      setFetchParams({
        startDate: new Date(new Date().setDate(new Date().getDate() - 7)),
        endDate: new Date(),
        overwriteExisting: false
      });
    }
  }, [currentFilters, visible]);

  /**
   * Validate form data
   */
  const validateForm = () => {
    const errors = [];

    if (!fetchParams.startDate) {
      errors.push('Start date is required');
    }

    if (!fetchParams.endDate) {
      errors.push('End date is required');
    }

    if (fetchParams.startDate && fetchParams.endDate) {
      if (fetchParams.startDate > fetchParams.endDate) {
        errors.push('Start date must be before or equal to end date');
      }

      // Check for date range > 90 days
      const daysDiff = Math.ceil((fetchParams.endDate - fetchParams.startDate) / (1000 * 60 * 60 * 24));
      if (daysDiff > 90) {
        errors.push('Date range cannot exceed 90 days. Please select a shorter period.');
      }
    }

    return errors;
  };

  /**
   * Handle fetch
   */
  const handleFetch = async () => {
    // Validate
    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach(error => notify(error, 'error', 3000));
      return;
    }

    try {
      notify('GPS data fetch started. This may take several minutes...', 'info', 5000);

      await onFetch(fetchParams);

      // Note: onFetch closes the modal and manages fetching state
    } catch (error) {
      console.error('Error fetching GPS data:', error);
      notify(error.message || 'Failed to fetch GPS data', 'error', 3000);
    }
  };

  /**
   * Handle cancel
   */
  const handleCancel = async () => {
    if (onCancel && currentJobId) {
      await onCancel();
    }
  };

  /**
   * Calculate date range info
   */
  const getDateRangeInfo = () => {
    if (!fetchParams.startDate || !fetchParams.endDate) return '';

    const daysDiff = Math.ceil((fetchParams.endDate - fetchParams.startDate) / (1000 * 60 * 60 * 24));
    return `${daysDiff} day${daysDiff !== 1 ? 's' : ''} selected`;
  };

  return (
    <Popup
      visible={visible}
      onHiding={onClose}
      title="Fetch GPS Data from GPSGate"
      width={500}
      height="auto"
      showCloseButton={true}
      dragEnabled={false}
    >
      <div className="fetch-gps-data-modal tw-max-h-[70vh] tw-overflow-y-auto">
        {/* Information Banner */}
        <div className="tw-bg-blue-50 tw-border-l-4 tw-border-blue-500 tw-p-4 tw-mb-5">
          <div className="tw-flex tw-items-start tw-gap-3">
            <i className="fa-light fa-info-circle tw-text-2xl tw-text-blue-600"></i>
            <div>
              <h3 className="tw-text-sm tw-font-bold tw-text-blue-800 tw-mb-1">
                About GPS Data Fetch
              </h3>
              <p className="tw-text-xs tw-text-blue-700">
                This will retrieve Report 212 (Vehicle Fuel Data) from GPSGate for the specified date range.
                All vehicles will be included. The process may take several minutes.
              </p>
            </div>
          </div>
        </div>

        {/* Date Range */}
        <div className="tw-mb-5">
          <label className="tw-block tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-2">
            Date Range <span className="tw-text-red-500">*</span>
          </label>
          <div className="tw-grid tw-grid-cols-2 tw-gap-3">
            <div>
              <label className="tw-block tw-text-xs tw-font-medium tw-text-gray-600 tw-mb-1">
                Start Date
              </label>
              <DateBox
                value={fetchParams.startDate}
                onValueChanged={(e) => setFetchParams({ ...fetchParams, startDate: e.value })}
                type="date"
                displayFormat="dd/MM/yyyy"
                max={fetchParams.endDate || new Date()}
                placeholder="Select start date"
              />
            </div>
            <div>
              <label className="tw-block tw-text-xs tw-font-medium tw-text-gray-600 tw-mb-1">
                End Date
              </label>
              <DateBox
                value={fetchParams.endDate}
                onValueChanged={(e) => setFetchParams({ ...fetchParams, endDate: e.value })}
                type="date"
                displayFormat="dd/MM/yyyy"
                min={fetchParams.startDate}
                max={new Date()}
                placeholder="Select end date"
              />
            </div>
          </div>
          {fetchParams.startDate && fetchParams.endDate && (
            <div className="tw-text-xs tw-text-gray-600 tw-mt-2">
              <i className="fa-light fa-calendar tw-mr-1"></i>
              {getDateRangeInfo()}
            </div>
          )}
        </div>

        {/* Overwrite Option */}
        <div className="tw-mb-5">
          <CheckBox
            value={fetchParams.overwriteExisting}
            onValueChanged={(e) => setFetchParams({ ...fetchParams, overwriteExisting: e.value })}
            text="Overwrite Existing Data"
          />
          <div className="tw-text-xs tw-text-gray-500 tw-mt-1 tw-ml-7">
            Replace existing GPS entries for the selected date range (use with caution)
          </div>
        </div>

        {/* Warning if overwrite enabled */}
        {fetchParams.overwriteExisting && (
          <div className="tw-bg-yellow-50 tw-border tw-border-yellow-200 tw-rounded-lg tw-p-3 tw-mb-5">
            <div className="tw-flex tw-items-start tw-gap-2">
              <i className="fa-light fa-triangle-exclamation tw-text-yellow-600 tw-mt-0.5"></i>
              <div className="tw-text-xs tw-text-yellow-800">
                <strong>Warning:</strong> Overwriting will replace existing GPS entries, including any manual modifications.
                This action cannot be undone.
              </div>
            </div>
          </div>
        )}

        {/* Fetch Progress Indicator */}
        {isGpsFetching && fetchProgress && (
          <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-4 tw-mb-5">
            <div className="tw-flex tw-items-center tw-gap-3 tw-mb-2">
              <i className="fa-light fa-spinner fa-spin tw-text-blue-600"></i>
              <div className="tw-flex-1">
                <div className="tw-text-sm tw-font-semibold tw-text-blue-800">
                  {fetchProgress.status || 'Fetching GPS Data...'}
                </div>
                {fetchProgress.message && (
                  <div className="tw-text-xs tw-text-blue-700 tw-mt-1">
                    {fetchProgress.message}
                  </div>
                )}
              </div>
            </div>
            {fetchProgress.progressPercent > 0 && (
              <div className="tw-w-full tw-bg-blue-100 tw-rounded-full tw-h-2">
                <div
                  className="tw-bg-blue-600 tw-h-2 tw-rounded-full tw-transition-all tw-duration-300"
                  style={{ width: `${fetchProgress.progressPercent}%` }}
                ></div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="tw-flex tw-justify-end tw-gap-3 tw-mt-6 tw-pt-4 tw-border-t tw-border-gray-200">
          <Button
            text="Close"
            onClick={onClose}
            type="normal"
            stylingMode="outlined"
            disabled={isGpsFetching}
          />
          {isGpsFetching && currentJobId && (
            <Button
              text="Cancel Fetch"
              onClick={handleCancel}
              type="danger"
              stylingMode="outlined"
              icon="fa-light fa-times"
            />
          )}
          <Button
            text={isGpsFetching ? "Fetching..." : "Fetch GPS Data"}
            onClick={handleFetch}
            type="success"
            stylingMode="contained"
            disabled={isGpsFetching}
            icon={isGpsFetching ? "fa-light fa-spinner fa-spin" : "fa-light fa-satellite-dish"}
          />
        </div>
      </div>
    </Popup>
  );
};

export default FetchGpsDataModal;
