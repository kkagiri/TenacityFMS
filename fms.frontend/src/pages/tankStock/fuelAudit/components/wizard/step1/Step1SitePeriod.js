/**
 * Step1SitePeriod.js
 * Step 1: Multi-Site & Audit Period Selection
 *
 * REFACTORED: Using native React components instead of DevExtreme
 * to avoid DOM manipulation conflicts during wizard transitions.
 *
 * Site data uses: id, name (from SiteDTO.cs)
 * Supports multiple site selection
 * Date range: Max 1 month, default is 1 month ending today
 */

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setWizardSiteAndPeriod,
  selectWizardSiteIds,
  selectWizard,
} from '../../../../../../redux/slices/fuelAuditSlice';
import { fetchSitebyUserId } from '../../../../../../redux/actions/siteActions';
import './Step1SitePeriod.scss';

const MAX_DAYS = 31;

const Step1SitePeriod = () => {
  const dispatch = useDispatch();
  const isMountedRef = useRef(true);

  // Redux state
  const wizardSiteIds = useSelector(selectWizardSiteIds);
  const wizardState = useSelector(selectWizard);
  // Note: siteReducer is registered as "site" in the Redux store, not "sites"
  const { sites, loading: sitesLoading } = useSelector((state) => state.site || { sites: [], loading: false });

  // Local state for form inputs
  const [searchTerm, setSearchTerm] = useState('');
  const [localSelectedIds, setLocalSelectedIds] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateError, setDateError] = useState('');

  // Set mounted flag
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch sites on mount
  useEffect(() => {
    dispatch(fetchSitebyUserId());
  }, [dispatch]);

  // Format date for input element (YYYY-MM-DD) - moved before useEffect that uses it
  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Initialize local state from Redux - runs once on mount
  useEffect(() => {
    // Initialize site IDs from wizard state
    if (wizardSiteIds && wizardSiteIds.length > 0) {
      setLocalSelectedIds(wizardSiteIds);
    }

    // Initialize dates - check if wizard has saved dates, otherwise use defaults
    const hasStartDate = wizardState?.periodStart;
    const hasEndDate = wizardState?.periodEnd;

    if (hasStartDate) {
      const start = new Date(wizardState.periodStart);
      const formattedStart = formatDateForInput(start);
      if (formattedStart) {
        setStartDate(formattedStart);
      }
    } else {
      // Default: 1 month ago
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      setStartDate(formatDateForInput(monthAgo));
    }

    if (hasEndDate) {
      const end = new Date(wizardState.periodEnd);
      const formattedEnd = formatDateForInput(end);
      if (formattedEnd) {
        setEndDate(formattedEnd);
      }
    } else {
      // Default: today
      const today = new Date();
      setEndDate(formatDateForInput(today));
    }
    // Only run on mount - don't re-run when wizardState changes to avoid overwriting user input
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter sites based on search
  const filteredSites = useMemo(() => {
    if (!sites || !Array.isArray(sites)) return [];
    if (!searchTerm.trim()) return sites;

    const term = searchTerm.toLowerCase();
    return sites.filter(
      (site) => site.name && site.name.toLowerCase().includes(term)
    );
  }, [sites, searchTerm]);

  // Handle site selection toggle
  const handleSiteToggle = useCallback(
    (siteId) => {
      if (!isMountedRef.current) return;

      setLocalSelectedIds((prev) => {
        const newIds = prev.includes(siteId)
          ? prev.filter((id) => id !== siteId)
          : [...prev, siteId];

        // Update Redux
        dispatch(setWizardSiteAndPeriod({
          siteIds: newIds,
          periodStart: wizardState.periodStart,
          periodEnd: wizardState.periodEnd,
          auditType: wizardState.auditType
        }));

        return newIds;
      });
    },
    [wizardState, dispatch]
  );

  // Handle select all (filtered)
  const handleSelectAll = useCallback(() => {
    if (!isMountedRef.current) return;

    const filteredIds = filteredSites.map((s) => s.id);
    const allSelected = filteredIds.every((id) => localSelectedIds.includes(id));

    let newIds;
    if (allSelected) {
      // Deselect all filtered
      newIds = localSelectedIds.filter((id) => !filteredIds.includes(id));
    } else {
      // Select all filtered
      newIds = [...new Set([...localSelectedIds, ...filteredIds])];
    }

    setLocalSelectedIds(newIds);
    dispatch(setWizardSiteAndPeriod({
      siteIds: newIds,
      periodStart: wizardState.periodStart,
      periodEnd: wizardState.periodEnd,
      auditType: wizardState.auditType
    }));
  }, [filteredSites, localSelectedIds, wizardState, dispatch]);

  // Validate and update dates
  const validateDates = useCallback(
    (start, end) => {
      if (!start || !end) {
        setDateError('');
        return;
      }

      const startDt = new Date(start);
      const endDt = new Date(end);

      if (startDt > endDt) {
        setDateError('Start date must be before end date');
        return false;
      }

      const diffTime = Math.abs(endDt - startDt);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > MAX_DAYS) {
        setDateError(`Date range cannot exceed ${MAX_DAYS} days`);
        return false;
      }

      setDateError('');
      return true;
    },
    []
  );

  // Handle start date change
  const handleStartDateChange = useCallback(
    (e) => {
      if (!isMountedRef.current) return;

      const newStart = e.target.value;
      setStartDate(newStart);

      if (validateDates(newStart, endDate)) {
        dispatch(
          setWizardSiteAndPeriod({
            siteIds: localSelectedIds,
            periodStart: new Date(newStart).toISOString(),
            periodEnd: endDate ? new Date(endDate).toISOString() : null,
            auditType: wizardState.auditType
          })
        );
      }
    },
    [endDate, localSelectedIds, wizardState, dispatch, validateDates]
  );

  // Handle end date change
  const handleEndDateChange = useCallback(
    (e) => {
      if (!isMountedRef.current) return;

      const newEnd = e.target.value;
      setEndDate(newEnd);

      if (validateDates(startDate, newEnd)) {
        dispatch(
          setWizardSiteAndPeriod({
            siteIds: localSelectedIds,
            periodStart: startDate ? new Date(startDate).toISOString() : null,
            periodEnd: new Date(newEnd).toISOString(),
            auditType: wizardState.auditType
          })
        );
      }
    },
    [startDate, localSelectedIds, wizardState, dispatch, validateDates]
  );

  // Check if all filtered sites are selected
  const allFilteredSelected = useMemo(() => {
    if (filteredSites.length === 0) return false;
    return filteredSites.every((s) => localSelectedIds.includes(s.id));
  }, [filteredSites, localSelectedIds]);

  return (
    <div className="step1-site-period tw-p-4">
      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6">
        {/* Site Selection Panel */}
        <div className="site-selection-panel tw-border tw-rounded-lg tw-p-4">
          <h3 className="tw-text-lg tw-font-semibold tw-mb-4">
            <i className="fa-light fa-building tw-mr-2"></i>
            Select Sites
          </h3>

          {/* Search Box */}
          <div className="tw-mb-4">
            <input
              type="text"
              className="tw-w-full tw-px-3 tw-py-2 tw-border tw-rounded-md tw-text-sm"
              placeholder="Search sites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Select All Checkbox */}
          <div className="tw-mb-2 tw-border-b tw-pb-2">
            <label className="tw-flex tw-items-center tw-cursor-pointer tw-text-sm tw-font-medium">
              <input
                type="checkbox"
                className="tw-mr-2 tw-w-4 tw-h-4"
                checked={allFilteredSelected && filteredSites.length > 0}
                onChange={handleSelectAll}
              />
              Select All ({filteredSites.length})
            </label>
          </div>

          {/* Sites List */}
          <div className="sites-list tw-max-h-64 tw-overflow-y-auto">
            {sitesLoading ? (
              <div className="tw-text-center tw-py-4 tw-text-gray-500">
                <i className="fa-light fa-spinner fa-spin tw-mr-2"></i>
                Loading sites...
              </div>
            ) : filteredSites.length === 0 ? (
              <div className="tw-text-center tw-py-4 tw-text-gray-500">
                No sites found
              </div>
            ) : (
              filteredSites.map((site) => (
                <label
                  key={site.id}
                  className="tw-flex tw-items-center tw-py-2 tw-px-2 tw-cursor-pointer hover:tw-bg-gray-50 tw-rounded"
                >
                  <input
                    type="checkbox"
                    className="tw-mr-3 tw-w-4 tw-h-4"
                    checked={localSelectedIds.includes(site.id)}
                    onChange={() => handleSiteToggle(site.id)}
                  />
                  <span className="tw-text-sm">{site.name}</span>
                </label>
              ))
            )}
          </div>

          {/* Selected Count */}
          <div className="tw-mt-3 tw-pt-3 tw-border-t tw-text-sm tw-text-gray-600">
            <i className="fa-light fa-check-circle tw-mr-1"></i>
            {localSelectedIds.length} site(s) selected
          </div>
        </div>

        {/* Date Range Panel */}
        <div className="date-range-panel tw-border tw-rounded-lg tw-p-4">
          <h3 className="tw-text-lg tw-font-semibold tw-mb-4">
            <i className="fa-light fa-calendar tw-mr-2"></i>
            Audit Period
          </h3>

          <div className="tw-space-y-4">
            {/* Start Date */}
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
                Start Date
              </label>
              <input
                type="date"
                className="tw-w-full tw-px-3 tw-py-2 tw-border tw-rounded-md"
                value={startDate}
                onChange={handleStartDateChange}
                max={endDate || undefined}
              />
            </div>

            {/* End Date */}
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
                End Date
              </label>
              <input
                type="date"
                className="tw-w-full tw-px-3 tw-py-2 tw-border tw-rounded-md"
                value={endDate}
                onChange={handleEndDateChange}
                min={startDate || undefined}
              />
            </div>

            {/* Date Error */}
            {dateError && (
              <div className="tw-text-red-500 tw-text-sm tw-flex tw-items-center">
                <i className="fa-light fa-exclamation-triangle tw-mr-1"></i>
                {dateError}
              </div>
            )}

            {/* Info Box */}
            <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-md tw-p-3 tw-text-sm tw-text-blue-700">
              <i className="fa-light fa-info-circle tw-mr-2"></i>
              Maximum audit period is {MAX_DAYS} days. Default is 1 month ending today.
            </div>

            {/* Period Summary */}
            {startDate && endDate && !dateError && (
              <div className="tw-bg-gray-50 tw-rounded-md tw-p-3 tw-text-sm">
                <div className="tw-font-medium tw-mb-1">Selected Period:</div>
                <div>
                  {new Date(startDate).toLocaleDateString()} to{' '}
                  {new Date(endDate).toLocaleDateString()}
                </div>
                <div className="tw-text-gray-500 tw-mt-1">
                  (
                  {Math.ceil(
                    Math.abs(new Date(endDate) - new Date(startDate)) /
                      (1000 * 60 * 60 * 24)
                  )}{' '}
                  days)
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Validation Summary */}
      <div className="tw-mt-6 tw-p-4 tw-bg-gray-50 tw-rounded-lg">
        <h4 className="tw-font-medium tw-mb-2">Step Completion Status:</h4>
        <ul className="tw-text-sm tw-space-y-1">
          <li
            className={
              localSelectedIds.length > 0
                ? 'tw-text-green-600'
                : 'tw-text-red-500'
            }
          >
            <i
              className={`fa-light ${
                localSelectedIds.length > 0 ? 'fa-check' : 'fa-times'
              } tw-mr-2`}
            ></i>
            {localSelectedIds.length > 0
              ? `${localSelectedIds.length} site(s) selected`
              : 'No sites selected'}
          </li>
          <li
            className={
              startDate && endDate && !dateError
                ? 'tw-text-green-600'
                : 'tw-text-red-500'
            }
          >
            <i
              className={`fa-light ${
                startDate && endDate && !dateError ? 'fa-check' : 'fa-times'
              } tw-mr-2`}
            ></i>
            {startDate && endDate && !dateError
              ? 'Valid date range selected'
              : 'Date range incomplete or invalid'}
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Step1SitePeriod;
