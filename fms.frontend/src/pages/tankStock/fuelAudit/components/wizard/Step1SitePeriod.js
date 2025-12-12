/**
 * Step1SitePeriod.js
 * Step 1: Site & Audit Period Selection
 *
 * Site data uses: id, name (from SiteDTO.cs)
 * Date range: Max 1 month, default is 1 month ending today
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { SelectBox } from 'devextreme-react/select-box';
import { DateBox } from 'devextreme-react/date-box';
import { LoadIndicator } from 'devextreme-react/load-indicator';

import { setWizardSiteAndPeriod, selectWizard } from '../../../../../redux/slices/fuelAuditSlice';
import { AUDIT_TYPES } from './wizardConstants';

// Helper: Get default dates (30 days ago to now)
const getDefaultDates = () => {
  const endDate = new Date(); // Current time (now)

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30); // 30 days ago
  startDate.setHours(0, 0, 0, 0); // Start of day

  return { startDate, endDate };
};

// Helper: Calculate days between two dates
const getDaysBetween = (start, end) => {
  if (!start || !end) return 0;
  const diffTime = Math.abs(new Date(end) - new Date(start));
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Max allowed days (approximately 1 month)
const MAX_DAYS = 31;

const Step1SitePeriod = () => {
  const dispatch = useDispatch();
  const wizard = useSelector(selectWizard);
  const sites = useSelector((state) => state.site?.sites || []);
  const siteLoading = useSelector((state) => state.site?.loading || false);

  // Date validation error
  const [dateError, setDateError] = useState(null);

  // Set default dates on mount if not already set
  useEffect(() => {
    // Always set defaults if periodStart or periodEnd is not set
    if (!wizard.periodStart || !wizard.periodEnd) {
      const { startDate, endDate } = getDefaultDates();
      dispatch(setWizardSiteAndPeriod({
        siteId: wizard.siteId,
        periodStart: startDate,
        periodEnd: endDate,
        auditType: wizard.auditType || 'Weekly'
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Validate date range
  const validateDateRange = (start, end) => {
    if (!start || !end) {
      setDateError(null);
      return true;
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (startDate > endDate) {
      setDateError('Start date cannot be after end date');
      return false;
    }

    const days = getDaysBetween(start, end);
    if (days > MAX_DAYS) {
      setDateError(`Date range cannot exceed ${MAX_DAYS} days (currently ${days} days)`);
      return false;
    }

    setDateError(null);
    return true;
  };

  // Update wizard state with validation
  const updateWizard = (updates) => {
    const newStart = updates.periodStart !== undefined ? updates.periodStart : wizard.periodStart;
    const newEnd = updates.periodEnd !== undefined ? updates.periodEnd : wizard.periodEnd;

    // Validate date range
    if (updates.periodStart !== undefined || updates.periodEnd !== undefined) {
      validateDateRange(newStart, newEnd);
    }

    dispatch(setWizardSiteAndPeriod({
      siteId: updates.siteId !== undefined ? updates.siteId : wizard.siteId,
      periodStart: newStart,
      periodEnd: newEnd,
      auditType: updates.auditType !== undefined ? updates.auditType : wizard.auditType
    }));
  };

  return (
    <div className="wizard-step tw-p-6">
      <h3 className="tw-text-lg tw-font-semibold tw-mb-6">
        <i className="fa-light fa-building tw-mr-2"></i>
        Select Site & Audit Period
      </h3>

      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6">
        {/* Site Selection */}
        <div className="tw-space-y-2">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
            Site <span className="tw-text-red-500">*</span>
          </label>
          {siteLoading ? (
            <div className="tw-flex tw-items-center tw-h-10">
              <LoadIndicator height={24} width={24} />
              <span className="tw-ml-2 tw-text-sm tw-text-gray-500">Loading sites...</span>
            </div>
          ) : (
            <SelectBox
              dataSource={sites}
              displayExpr={(item) => item?.name || item?.siteName || ''}
              valueExpr={(item) => item?.id ?? item?.siteId}
              value={wizard.siteId}
              onValueChanged={(e) => updateWizard({ siteId: e.value })}
              placeholder="Select a site..."
              searchEnabled={true}
              showClearButton={true}
              height={40}
            />
          )}
        </div>

        {/* Audit Type */}
        <div className="tw-space-y-2">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
            Audit Type
          </label>
          <SelectBox
            dataSource={AUDIT_TYPES}
            displayExpr="label"
            valueExpr="value"
            value={wizard.auditType || 'Weekly'}
            onValueChanged={(e) => updateWizard({ auditType: e.value })}
            height={40}
          />
        </div>

        {/* Period Start */}
        <div className="tw-space-y-2">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
            Period Start <span className="tw-text-red-500">*</span>
          </label>
          <DateBox
            value={wizard.periodStart}
            onValueChanged={(e) => updateWizard({ periodStart: e.value })}
            type="datetime"
            displayFormat="yyyy-MM-dd HH:mm"
            height={40}
            placeholder="Select start date..."
            max={wizard.periodEnd || new Date()}
          />
        </div>

        {/* Period End */}
        <div className="tw-space-y-2">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
            Period End <span className="tw-text-red-500">*</span>
          </label>
          <DateBox
            value={wizard.periodEnd}
            onValueChanged={(e) => updateWizard({ periodEnd: e.value })}
            type="datetime"
            displayFormat="yyyy-MM-dd HH:mm"
            height={40}
            placeholder="Select end date..."
            min={wizard.periodStart}
            max={new Date()}
          />
        </div>
      </div>

      {/* Date Range Error */}
      {dateError && (
        <div className="tw-mt-4 tw-p-3 tw-bg-red-50 tw-rounded-lg tw-border tw-border-red-200">
          <p className="tw-text-sm tw-text-red-700 tw-flex tw-items-center">
            <i className="fa-light fa-exclamation-triangle tw-mr-2"></i>
            {dateError}
          </p>
        </div>
      )}

      {/* Date Range Info */}
      <div className="tw-mt-4 tw-p-3 tw-bg-gray-50 tw-rounded-lg tw-border">
        <p className="tw-text-xs tw-text-gray-500 tw-flex tw-items-center">
          <i className="fa-light fa-info-circle tw-mr-2"></i>
          Maximum audit period is {MAX_DAYS} days.
          {wizard.periodStart && wizard.periodEnd && (
            <span className="tw-ml-1 tw-font-medium">
              Currently: {getDaysBetween(wizard.periodStart, wizard.periodEnd)} days selected.
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default Step1SitePeriod;
