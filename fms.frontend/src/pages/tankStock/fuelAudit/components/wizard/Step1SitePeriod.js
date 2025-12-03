/**
 * Step1SitePeriod.js
 * Step 1: Multi-Site & Audit Period Selection
 *
 * Site data uses: id, name (from SiteDTO.cs)
 * Supports multiple site selection using TagBox
 * Date range: Max 1 month, default is 1 month ending today
 */

import React, { useEffect, useState, memo, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TagBox } from 'devextreme-react/tag-box';
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

const Step1SitePeriod = memo(() => {
  const dispatch = useDispatch();
  const wizard = useSelector(selectWizard);
  const sites = useSelector((state) => state.site?.sites || []);
  const siteLoading = useSelector((state) => state.site?.loading || false);

  // Date validation error
  const [dateError, setDateError] = useState(null);

  // Get selected site IDs (ensure it's always an array)
  const selectedSiteIds = useMemo(() => {
    return Array.isArray(wizard.siteIds) ? wizard.siteIds : [];
  }, [wizard.siteIds]);

  // Set default dates on mount if not already set
  useEffect(() => {
    // Always set defaults if periodStart or periodEnd is not set
    if (!wizard.periodStart || !wizard.periodEnd) {
      const { startDate, endDate } = getDefaultDates();
      dispatch(setWizardSiteAndPeriod({
        siteIds: wizard.siteIds || [],
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
    const newSiteIds = updates.siteIds !== undefined ? updates.siteIds : selectedSiteIds;
    const newStart = updates.periodStart !== undefined ? updates.periodStart : wizard.periodStart;
    const newEnd = updates.periodEnd !== undefined ? updates.periodEnd : wizard.periodEnd;

    // Validate date range
    if (updates.periodStart !== undefined || updates.periodEnd !== undefined) {
      validateDateRange(newStart, newEnd);
    }

    dispatch(setWizardSiteAndPeriod({
      siteIds: newSiteIds,
      periodStart: newStart,
      periodEnd: newEnd,
      auditType: updates.auditType !== undefined ? updates.auditType : wizard.auditType
    }));
  };

  // Handle site selection change
  const handleSiteSelectionChanged = (e) => {
    updateWizard({ siteIds: e.value || [] });
  };

  return (
    <div className="wizard-step tw-p-4 tw-max-w-3xl tw-mx-auto">
      <h3 className="tw-text-base tw-font-semibold tw-mb-4">
        <i className="fa-light fa-building tw-mr-2"></i>
        Select Sites & Audit Period
      </h3>

      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
        {/* Multi-Site Selection */}
        <div className="tw-space-y-1 md:tw-col-span-2">
          <label className="tw-block tw-text-xs tw-font-medium tw-text-gray-700">
            Sites <span className="tw-text-red-500">*</span>
            <span className="tw-text-xs tw-text-gray-500 tw-ml-2">(Select one or more)</span>
          </label>
          {siteLoading ? (
            <div className="tw-flex tw-items-center tw-h-9">
              <LoadIndicator height={20} width={20} />
              <span className="tw-ml-2 tw-text-xs tw-text-gray-500">Loading sites...</span>
            </div>
          ) : (
            <TagBox
              dataSource={sites}
              displayExpr={(item) => item?.name || item?.siteName || ''}
              valueExpr={(item) => item?.id ?? item?.siteId}
              value={selectedSiteIds}
              onValueChanged={handleSiteSelectionChanged}
              placeholder="Select sites..."
              searchEnabled={true}
              showSelectionControls={true}
              showClearButton={true}
              multiline={false}
              applyValueMode="instantly"
              height={36}
              stylingMode="outlined"
            />
          )}
          {/* Selected sites summary */}
          {selectedSiteIds.length > 0 && (
            <div className="tw-p-1.5 tw-bg-blue-50 tw-rounded tw-border tw-border-blue-200">
              <span className="tw-text-xs tw-text-blue-700">
                <i className="fa-light fa-check-circle tw-mr-1"></i>
                <strong>{selectedSiteIds.length}</strong> site{selectedSiteIds.length !== 1 ? 's' : ''} selected
              </span>
            </div>
          )}
        </div>

        {/* Audit Type */}
        <div className="tw-space-y-1">
          <label className="tw-block tw-text-xs tw-font-medium tw-text-gray-700">
            Audit Type
          </label>
          <SelectBox
            dataSource={AUDIT_TYPES}
            displayExpr="label"
            valueExpr="value"
            value={wizard.auditType || 'Weekly'}
            onValueChanged={(e) => updateWizard({ auditType: e.value })}
            height={36}
          />
        </div>

        {/* Empty spacer for grid alignment */}
        <div className="tw-hidden md:tw-block"></div>

        {/* Period Start */}
        <div className="tw-space-y-1">
          <label className="tw-block tw-text-xs tw-font-medium tw-text-gray-700">
            Period Start <span className="tw-text-red-500">*</span>
          </label>
          <DateBox
            value={wizard.periodStart}
            onValueChanged={(e) => updateWizard({ periodStart: e.value })}
            type="datetime"
            displayFormat="yyyy-MM-dd HH:mm"
            height={36}
            placeholder="Select start date..."
            max={wizard.periodEnd || new Date()}
          />
        </div>

        {/* Period End */}
        <div className="tw-space-y-1">
          <label className="tw-block tw-text-xs tw-font-medium tw-text-gray-700">
            Period End <span className="tw-text-red-500">*</span>
          </label>
          <DateBox
            value={wizard.periodEnd}
            onValueChanged={(e) => updateWizard({ periodEnd: e.value })}
            type="datetime"
            displayFormat="yyyy-MM-dd HH:mm"
            height={36}
            placeholder="Select end date..."
            min={wizard.periodStart}
            max={new Date()}
          />
        </div>
      </div>

      {/* Date Range Error */}
      {dateError && (
        <div className="tw-mt-3 tw-p-2 tw-bg-red-50 tw-rounded tw-border tw-border-red-200">
          <p className="tw-text-xs tw-text-red-700 tw-flex tw-items-center">
            <i className="fa-light fa-exclamation-triangle tw-mr-2"></i>
            {dateError}
          </p>
        </div>
      )}

      {/* Date Range Info */}
      <div className="tw-mt-3 tw-p-2 tw-bg-gray-50 tw-rounded tw-border">
        <p className="tw-text-xs tw-text-gray-500 tw-flex tw-items-center">
          <i className="fa-light fa-info-circle tw-mr-2"></i>
          Max {MAX_DAYS} days.
          {wizard.periodStart && wizard.periodEnd && (
            <span className="tw-ml-1 tw-font-medium">
              Currently: {getDaysBetween(wizard.periodStart, wizard.periodEnd)} days.
            </span>
          )}
        </p>
      </div>

      {/* Multi-site notice */}
      {selectedSiteIds.length > 1 && (
        <div className="tw-mt-3 tw-p-2 tw-bg-amber-50 tw-rounded tw-border tw-border-amber-200">
          <p className="tw-text-xs tw-text-amber-700 tw-flex tw-items-start">
            <i className="fa-light fa-info-circle tw-mr-2 tw-mt-0.5"></i>
            <span>
              <strong>Multi-site:</strong> Tanks from all sites will be grouped for selection.
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
);

Step1SitePeriod.displayName = 'Step1SitePeriod';

export default Step1SitePeriod;
