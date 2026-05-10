/**
 * File: VehicleConsumptionHistory.js
 * Purpose: Render vehicle fuel consumption history with filtering and detail views.
 * Dependencies: react, react-redux, notify, HeaderStockFilters.scss
 * Last Modified: 2026-03-13 - Replaced DevExtreme date filter with HSF-style date filter
 *
 * Key Functions/Components:
 * - VehicleConsumptionHistory: Main component managing filters, grid data, and details modal
 * - loadConsumptionHistory(): Fetches consumption data and normalizes it for the grid
 * - handleApplyFilter(): Triggers a data reload based on selected date range
 *
 * CRITICAL: Uses ImperativeDataGrid to bypass React reconciliation conflicts
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import notify from 'devextreme/ui/notify';
import '../../../tankStock/shared/components/HeaderStockFilters.scss';

import ImperativeDataGrid from '../../consumption/components/ImperativeDataGrid';
import ConsumptionTrendChart from '../../consumption/components/ConsumptionTrendChart';
import VehicleConsumptionHistoryDetails from '../../consumption/components/VehicleConsumptionHistoryDetails';
import { fetchVehicleConsumptionHistory, clearVehicleConsumptionHistory } from '../../../../redux/actions/vehicleActions';

// ── Date filter constants & helpers ───────────────────────────────────────────
const QUICK_DATE_RANGES = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7', label: 'Last 7D' },
  { key: 'last30', label: 'Last 30D' },
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const toDateKey = (d) => {
  const v = new Date(d);
  return `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, '0')}-${String(v.getDate()).padStart(2, '0')}`;
};
const toStartOfDay = (d) => { const v = new Date(d); v.setHours(0, 0, 0, 0); return v; };
const toEndOfDay = (d) => { const v = new Date(d); v.setHours(23, 59, 59, 999); return v; };
const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ── CalendarMonth sub-component ───────────────────────────────────────────────
const CalendarMonth = ({
  viewDate, fromDate, toDate,
  onPickDay, onNav,
  showLeftNav, showRightNav,
  showFooter, pickStep, onCancel, onConfirm,
}) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const from = fromDate ? (() => { const v = new Date(fromDate); v.setHours(0, 0, 0, 0); return v; })() : null;
  const to = toDate ? (() => { const v = new Date(toDate); v.setHours(0, 0, 0, 0); return v; })() : null;

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const dayClass = (t) => {
    if (!t) return 'hsf-cal-day hsf-cal-empty';
    t = new Date(t); t.setHours(0, 0, 0, 0);
    let cls = 'hsf-cal-day';
    if (t.getTime() === today.getTime()) cls += ' today';
    if (from && to && t.getTime() === from.getTime() && t.getTime() === to.getTime()) cls += ' selected';
    else if (from && t.getTime() === from.getTime()) cls += ' range-start';
    else if (to && t.getTime() === to.getTime()) cls += ' range-end';
    else if (from && to && t > from && t < to) cls += ' in-range';
    return cls;
  };

  return (
    <div className="hsf-cal-month">
      <div className="hsf-cal-month-header">
        {showLeftNav
          ? <button className="hsf-cal-nav" onClick={() => onNav(-1)} type="button"><i className="fa-light fa-chevron-left" /></button>
          : <div style={{ width: 24 }} />}
        <span className="hsf-cal-month-name">{MONTH_NAMES[month]} {year}</span>
        {showRightNav
          ? <button className="hsf-cal-nav" onClick={() => onNav(1)} type="button"><i className="fa-light fa-chevron-right" /></button>
          : <div style={{ width: 24 }} />}
      </div>
      <div className="hsf-cal-grid">
        {DAY_NAMES.map(d => <div key={d} className="hsf-cal-dow">{d}</div>)}
        {cells.map((t, i) => (
          <div key={i} className={dayClass(t)} onClick={t ? () => onPickDay(t.getFullYear(), t.getMonth(), t.getDate()) : undefined}>
            {t ? t.getDate() : null}
          </div>
        ))}
      </div>
      {showFooter && (
        <div className="hsf-cal-footer">
          <span className="hsf-cal-step-hint">
            {pickStep === 0 ? <>Pick <em>start</em> date</> : <>Pick <em>end</em> date</>}
          </span>
          <button className="hsf-btn hsf-btn-reset" style={{ fontSize: 11, padding: '4px 10px' }} onClick={onCancel} type="button">Cancel</button>
          <button className="hsf-btn hsf-btn-apply" style={{ fontSize: 11, padding: '4px 12px' }} onClick={onConfirm} type="button">Apply</button>
        </div>
      )}
    </div>
  );
};

const VehicleConsumptionHistory = ({ vehicleId }) => {
  const dispatch = useDispatch();

  // Memoize selectors to prevent new array references
  const consumptionData = useSelector(
    state => state.vehicle.consumptionHistory || []
  );
  const isLoading = useSelector(state => state.vehicle.consumptionHistoryLoading);

  // Debug logging
  useEffect(() => {
    console.log('🔄 VehicleConsumptionHistory rendered', {
      vehicleId,
      dataLength: consumptionData.length,
      isLoading,
      firstRecord: consumptionData[0],
      lastRecord: consumptionData[consumptionData.length - 1],
      dateRange: consumptionData.length > 0 ? {
        first: consumptionData[0]?.date,
        last: consumptionData[consumptionData.length - 1]?.date
      } : null
    });
  });

  // Track when vehicleId prop changes
  const prevVehicleIdRef = useRef(vehicleId);
  useEffect(() => {
    if (prevVehicleIdRef.current !== vehicleId) {
      console.log('🆔 vehicleId prop changed:', prevVehicleIdRef.current, '→', vehicleId);
      prevVehicleIdRef.current = vehicleId;
    }
  }, [vehicleId]);

  const [dateFrom, setDateFrom] = useState(() => toStartOfDay(new Date(new Date().setDate(new Date().getDate() - 29))));
  const [dateTo, setDateTo] = useState(() => toEndOfDay(new Date()));
  // HSF date filter state
  const [calOpen, setCalOpen] = useState(false);
  const [calViewLeft, setCalViewLeft] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 29);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [pickStep, setPickStep] = useState(0);

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const loadingRef = useRef(false);
  const requestControllerRef = useRef(null);
  const debounceRef = useRef(null);
  const dataSignatureRef = useRef('');
  const loadConsumptionHistoryRef = useRef(null);

  // DataGrid selection state
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // Define columns configuration for imperative DataGrid
  const gridColumns = useMemo(() => [
    {
      dataField: 'date',
      caption: 'Date',
      dataType: 'date',
      format: 'dd/MM/yyyy',
      width: 110,
      allowSorting: true,
      sortOrder: 'desc'
    },
    { dataField: 'site', caption: 'Site', width: 150 },
    { dataField: 'employee', caption: 'Driver/Operator', width: 150 },
    { dataField: 'fuelType', caption: 'Fuel Type', width: 120 },
    {
      dataField: 'totalDistance',
      caption: 'Distance (km)',
      dataType: 'number',
      format: { type: 'fixedPoint', precision: 2 },
      width: 120
    },
    {
      dataField: 'totalFuel',
      caption: 'Fuel Used (L)',
      dataType: 'number',
      format: { type: 'fixedPoint', precision: 2 },
      width: 120
    },
    {
      dataField: 'avgEfficiency',
      caption: 'Avg Efficiency',
      width: 140,
      calculateCellValue: (rowData) => {
        if (rowData.isAverageKm && rowData.totalDistance > 0 && rowData.totalFuel > 0) {
          const efficiency = rowData.totalDistance / rowData.totalFuel;
          return `${efficiency.toFixed(2)} km/L`;
        } else if (!rowData.isAverageKm && rowData.engHours > 0 && rowData.totalFuel > 0) {
          const efficiency = rowData.totalFuel / rowData.engHours;
          return `${efficiency.toFixed(2)} L/hr`;
        }
        return 'N/A';
      }
    },
    {
      dataField: 'openingMeter',
      caption: 'Opening Meter',
      dataType: 'number',
      format: { type: 'fixedPoint', precision: 2 },
      width: 130
    },
    {
      dataField: 'closingMeter',
      caption: 'Closing Meter',
      dataType: 'number',
      format: { type: 'fixedPoint', precision: 2 },
      width: 130
    },
    {
      dataField: 'engHours',
      caption: 'Engine Hours',
      dataType: 'number',
      format: { type: 'fixedPoint', precision: 2 },
      width: 120
    },
    {
      dataField: 'openingFuelLevel',
      caption: 'Opening Fuel (L)',
      dataType: 'number',
      format: { type: 'fixedPoint', precision: 2 },
      width: 140
    },
    {
      dataField: 'closingFuelLevel',
      caption: 'Closing Fuel (L)',
      dataType: 'number',
      format: { type: 'fixedPoint', precision: 2 },
      width: 140
    },
    {
      dataField: 'fuelLost',
      caption: 'Fuel Lost (L)',
      dataType: 'number',
      format: { type: 'fixedPoint', precision: 2 },
      width: 120,
      cellRender: (cellData) => {
        const value = cellData.value || 0;
        const className = value > 0 ? 'tw-text-red-600 tw-font-semibold' : '';
        return `<span class="${className}">${value.toFixed(2)}</span>`;
      }
    },
    {
      dataField: 'excessFuel',
      caption: 'Excess Fuel (L)',
      dataType: 'number',
      format: { type: 'fixedPoint', precision: 2 },
      width: 140,
      cellRender: (cellData) => {
        const value = cellData.value || 0;
        const className = value > 0 ? 'tw-text-green-600 tw-font-semibold' : '';
        return `<span class="${className}">${value.toFixed(2)}</span>`;
      }
    },
    {
      dataField: 'stockReceived',
      caption: 'Stock Received (L)',
      dataType: 'number',
      format: { type: 'fixedPoint', precision: 2 },
      width: 150
    },
    { dataField: 'remarks', caption: 'Remarks', width: 200 }
  ], []);

  // ── HSF date filter computed values ─────────────────────────────────────────
  const calViewRight = useMemo(
    () => new Date(calViewLeft.getFullYear(), calViewLeft.getMonth() + 1, 1),
    [calViewLeft]
  );

  const activeQuick = useMemo(() => {
    if (!dateFrom || !dateTo) return '';
    const todayKey = toDateKey(new Date());
    const startKey = toDateKey(dateFrom);
    const endKey = toDateKey(dateTo);
    const yest = new Date(); yest.setDate(yest.getDate() - 1);
    const l7 = new Date(); l7.setDate(l7.getDate() - 6);
    const l30 = new Date(); l30.setDate(l30.getDate() - 29);
    if (startKey === todayKey && endKey === todayKey) return 'today';
    if (startKey === toDateKey(yest) && endKey === toDateKey(yest)) return 'yesterday';
    if (startKey === toDateKey(l7) && endKey === todayKey) return 'last7';
    if (startKey === toDateKey(l30) && endKey === todayKey) return 'last30';
    return '';
  }, [dateFrom, dateTo]);

  // Selected rows data (fallback to all rows when nothing explicitly selected)
  const selectedData = useMemo(() => {
    if (!consumptionData || consumptionData.length === 0) return [];
    if (!selectedRowKeys || selectedRowKeys.length === 0) return consumptionData;
    const keySet = new Set(selectedRowKeys);
    return consumptionData.filter(item => keySet.has(item.rowKey));
  }, [consumptionData, selectedRowKeys]);

  // Calculate summary statistics based on selected rows
  const summaryStats = useMemo(() => {
    if (!selectedData || selectedData.length === 0) {
      return {
        totalDistance: 0,
        totalFuel: 0,
        totalFuelLost: 0,
        totalEngineHours: 0,
        avgEfficiencyKmL: 0,
        avgEfficiencyLHr: 0,
        numberOfDays: 0,
        kmLCount: 0,
        lHrCount: 0
      };
    }

    const uniqueDates = new Set(selectedData.map(item =>
      new Date(item.date).toDateString()
    ));

    // Separate km/L and L/hr records for proper averaging
    const kmLRecords = selectedData.filter(item =>
      item.isAverageKm && item.totalDistance > 0 && item.totalFuel > 0
    );
    const lHrRecords = selectedData.filter(item =>
      !item.isAverageKm && item.engHours > 0 && item.totalFuel > 0
    );

    // Calculate km/L average (ignore records with 0 distance or fuel)
    const avgKmL = kmLRecords.length > 0
      ? kmLRecords.reduce((sum, item) => sum + (item.totalDistance / item.totalFuel), 0) / kmLRecords.length
      : 0;

    // Calculate L/hr average (ignore records with 0 engine hours or fuel)
    const avgLHr = lHrRecords.length > 0
      ? lHrRecords.reduce((sum, item) => sum + (item.totalFuel / item.engHours), 0) / lHrRecords.length
      : 0;

    return {
      totalDistance: selectedData.reduce((sum, item) => sum + (item.totalDistance || 0), 0),
      totalFuel: selectedData.reduce((sum, item) => sum + (item.totalFuel || 0), 0),
      totalFuelLost: selectedData.reduce((sum, item) => sum + (item.fuelLost || 0), 0),
      totalEngineHours: selectedData.reduce((sum, item) => sum + (item.engHours || 0), 0),
      avgEfficiencyKmL: avgKmL,
      avgEfficiencyLHr: avgLHr,
      numberOfDays: uniqueDates.size,
      kmLCount: kmLRecords.length,
      lHrCount: lHrRecords.length
    };
  }, [selectedData]);

  // Auto-select all rows on initial load or when dataset changes
  useEffect(() => {
    const allKeys = (consumptionData || []).map(item => item.rowKey);
    const signature = `${allKeys.length}|${allKeys.join('|')}`;

    console.log('🔑 Auto-select check:', {
      dataLength: consumptionData?.length,
      keysLength: allKeys.length,
      newSignature: signature,
      oldSignature: dataSignatureRef.current,
      willUpdate: signature !== dataSignatureRef.current
    });

    if (!allKeys.length) {
      // Clear selection when no data
      setSelectedRowKeys([]);
      dataSignatureRef.current = '';
      return;
    }

    if (signature !== dataSignatureRef.current) {
      console.log('✅ Updating selection with all keys');
      dataSignatureRef.current = signature;
      setSelectedRowKeys(allKeys);
    }
  }, [consumptionData]);

  const loadConsumptionHistory = useCallback(async () => {
    if (!vehicleId || loadingRef.current) return;

    try {
      loadingRef.current = true;

      // Cancel any in-flight request before starting a new one
      if (requestControllerRef.current) {
        try { requestControllerRef.current.abort(); } catch (_) { }
      }
      const controller = new AbortController();
      requestControllerRef.current = controller;

      const diffTime = Math.abs(dateTo - dateFrom);
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const entry = Number.isFinite(days) ? Math.max(5, days) : 5; // Removed max limit

      console.log('📅 Loading consumption history:', {
        vehicleId,
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
        days,
        entry
      });

      const response = await dispatch(
        fetchVehicleConsumptionHistory(
          {
            vehicleId: parseInt(vehicleId),
            dateFrom: dateFrom,
            dateTo: dateTo,
            entry: entry
          },
          { signal: controller.signal }
        )
      );

      console.log('✅ Response received:', {
        success: response?.success,
        dataLength: response?.data?.length
      });

      if (!response?.success) {
        notify(response?.message || 'Failed to load consumption history', 'error', 3000);
      } else {
        notify(`Loaded ${response?.data?.length || 0} consumption records`, 'success', 2000);
      }
    } catch (error) {
      console.error('Error loading consumption history:', error);
      notify(error.message || 'Failed to load consumption history', 'error', 3000);
    } finally {
      loadingRef.current = false;
      if (!requestControllerRef.current?.signal?.aborted) {
        requestControllerRef.current = null;
      }
    }
  }, [dispatch, vehicleId, dateFrom, dateTo]);

  // Store stable reference
  useEffect(() => {
    loadConsumptionHistoryRef.current = loadConsumptionHistory;
  }, [loadConsumptionHistory]);

  useEffect(() => {
    if (vehicleId) {
      // Debounced load on vehicle switch to avoid races during fast navigation
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        loadConsumptionHistoryRef.current?.();
      }, 200);
    }

    return () => {
      // Cancel in-flight requests and clear state between vehicle switches/unmount
      if (requestControllerRef.current) {
        try { requestControllerRef.current.abort(); } catch (_) { }
        requestControllerRef.current = null;
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      dispatch(clearVehicleConsumptionHistory());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId, dispatch]);

  // ── HSF date filter handlers ──────────────────────────────────────────────
  const handleQuickDate = useCallback((key) => {
    const base = new Date(); let s = new Date(base), e = new Date(base);
    if (key === 'yesterday') { s.setDate(s.getDate() - 1); e.setDate(e.getDate() - 1); }
    else if (key === 'last7') { s.setDate(s.getDate() - 6); }
    else if (key === 'last30') { s.setDate(s.getDate() - 29); }
    setDateFrom(toStartOfDay(s));
    setDateTo(toEndOfDay(e));
  }, []);

  const handlePickDay = useCallback((y, m, d) => {
    const clicked = new Date(y, m, d); clicked.setHours(0, 0, 0, 0);
    if (pickStep === 0) {
      setDateFrom(toStartOfDay(clicked));
      setDateTo(toEndOfDay(clicked));
      setPickStep(1);
    } else {
      if (clicked < toStartOfDay(dateFrom)) {
        setDateFrom(toStartOfDay(clicked));
        setDateTo(toEndOfDay(dateFrom));
      } else {
        setDateTo(toEndOfDay(clicked));
      }
      setPickStep(0);
    }
  }, [pickStep, dateFrom]);

  const handleCalNav = useCallback((dir) => {
    setCalViewLeft(prev => new Date(prev.getFullYear(), prev.getMonth() + dir, 1));
  }, []);

  const toggleCal = useCallback((e) => {
    e.stopPropagation();
    if (!calOpen) {
      const d = dateFrom ? new Date(dateFrom) : new Date();
      setCalViewLeft(new Date(d.getFullYear(), d.getMonth(), 1));
      setPickStep(0);
    }
    setCalOpen(prev => !prev);
  }, [calOpen, dateFrom]);

  const handleResetFilter = useCallback(() => {
    const base = new Date();
    const s = new Date(base); s.setDate(s.getDate() - 29);
    setDateFrom(toStartOfDay(s));
    setDateTo(toEndOfDay(base));
    setCalOpen(false);
  }, []);

  const handleRefresh = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      if (!loadingRef.current) {
        loadConsumptionHistory();
      }
    }, 200);
  }, [loadConsumptionHistory]);

  const handleApplyFilter = useCallback(() => {
    console.log('🎯 Apply Filter clicked');
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Clear existing data first to show loading state
    dispatch(clearVehicleConsumptionHistory());

    debounceRef.current = setTimeout(() => {
      if (!loadingRef.current) {
        console.log('⏰ Executing loadConsumptionHistory after debounce');
        loadConsumptionHistory();
      } else {
        console.log('⚠️ Skipped load - already loading');
      }
    }, 200);
  }, [loadConsumptionHistory, dispatch]);

  const handleRowClick = useCallback((e) => {
    setSelectedRecord(e.data);
    setDetailsVisible(true);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setDetailsVisible(false);
    setSelectedRecord(null);
  }, []);

  return (
    <div className="vehicle-consumption-history">
      <div className="tw-mb-4">
        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-3">
          Fuel Consumption History
        </h3>

        {/* HSF-style date filter */}
        <div className="header-stock-filters">
          {calOpen && (
            <div className="hsf-overlay" onClick={() => setCalOpen(false)} />
          )}
          <div className="hsf-filter-bar" onClick={(e) => e.stopPropagation()}>

            {/* Quick date pills */}
            <div className="hsf-seg-pills">
              {QUICK_DATE_RANGES.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  className={`hsf-seg-pill${activeQuick === r.key ? ' active' : ''}`}
                  onClick={() => handleQuickDate(r.key)}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div className="hsf-bar-divider" />

            {/* Date range picker */}
            <div className={`hsf-date-range-btn${calOpen ? ' open' : ''}`} onClick={toggleCal}>
              <i className="fa-light fa-calendar hsf-date-icon" />
              <span className="hsf-date-val">{fmtDate(dateFrom)}</span>
              <span className="hsf-date-sep">→</span>
              <span className="hsf-date-val">{fmtDate(dateTo)}</span>
              <i className="fa-light fa-chevron-down hsf-select-caret" />

              {calOpen && (
                <div className="hsf-cal-dropdown" onClick={(e) => e.stopPropagation()}>
                  <div className="hsf-cal-months-row">
                    <CalendarMonth
                      viewDate={calViewLeft}
                      fromDate={dateFrom} toDate={dateTo}
                      pickStep={pickStep}
                      onPickDay={handlePickDay}
                      onNav={handleCalNav}
                      showLeftNav showRightNav={false}
                      showFooter={false}
                    />
                    <div className="hsf-cal-separator" />
                    <CalendarMonth
                      viewDate={calViewRight}
                      fromDate={dateFrom} toDate={dateTo}
                      pickStep={pickStep}
                      onPickDay={handlePickDay}
                      onNav={handleCalNav}
                      showLeftNav={false} showRightNav
                      showFooter
                      onCancel={() => setCalOpen(false)}
                      onConfirm={() => setCalOpen(false)}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="hsf-bar-spacer" />

            {isLoading && (
              <span style={{ fontSize: 11, color: 'var(--hsf-text-muted)', fontFamily: 'var(--hsf-font-mono)' }}>Loading…</span>
            )}

            <button className="hsf-btn hsf-btn-reset" type="button" onClick={handleRefresh} disabled={isLoading}>
              <i className="fa-light fa-rotate-right" />
              Refresh
            </button>

            <button className="hsf-btn hsf-btn-reset" type="button" onClick={handleResetFilter}>
              <i className="fa-light fa-rotate-left" />
              Reset
            </button>

            <button className="hsf-btn hsf-btn-apply" type="button" onClick={handleApplyFilter} disabled={isLoading}>
              <i className="fa-light fa-filter" />
              Apply
            </button>

          </div>
        </div>
      </div>

      {/* IMPERATIVE DATAGRID - Manages lifecycle outside React */}
      <ImperativeDataGrid
        data={consumptionData}
        onRowClick={handleRowClick}
        selectedRowKeys={selectedRowKeys}
        onSelectionChanged={(e) => setSelectedRowKeys(e.selectedRowKeys)}
        columns={gridColumns}
      />

      {/* Summary Cards - Compact Design */}
      <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-3 lg:tw-grid-cols-7 tw-gap-3 tw-mt-6">
        <div className="tw-bg-blue-50 tw-p-3 tw-rounded-lg tw-border tw-border-blue-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-xs tw-text-blue-600 tw-font-medium">Days</p>
              <p className="tw-text-xl tw-font-bold tw-text-blue-900">
                {summaryStats.numberOfDays}
              </p>
            </div>
            <i className="fa-light fa-calendar-days tw-text-xl tw-text-blue-600"></i>
          </div>
        </div>

        <div className="tw-bg-purple-50 tw-p-3 tw-rounded-lg tw-border tw-border-purple-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-xs tw-text-purple-600 tw-font-medium">Distance</p>
              <p className="tw-text-xl tw-font-bold tw-text-purple-900">
                {summaryStats.totalDistance.toFixed(0)} <span className="tw-text-sm">km</span>
              </p>
            </div>
            <i className="fa-light fa-route tw-text-xl tw-text-purple-600"></i>
          </div>
        </div>

        <div className="tw-bg-green-50 tw-p-3 tw-rounded-lg tw-border tw-border-green-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-xs tw-text-green-600 tw-font-medium">Fuel Used</p>
              <p className="tw-text-xl tw-font-bold tw-text-green-900">
                {summaryStats.totalFuel.toFixed(0)} <span className="tw-text-sm">L</span>
              </p>
            </div>
            <i className="fa-light fa-gas-pump tw-text-xl tw-text-green-600"></i>
          </div>
        </div>

        <div className="tw-bg-indigo-50 tw-p-3 tw-rounded-lg tw-border tw-border-indigo-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-xs tw-text-indigo-600 tw-font-medium">Engine Hrs</p>
              <p className="tw-text-xl tw-font-bold tw-text-indigo-900">
                {summaryStats.totalEngineHours.toFixed(1)} <span className="tw-text-sm">hr</span>
              </p>
            </div>
            <i className="fa-light fa-engine tw-text-xl tw-text-indigo-600"></i>
          </div>
        </div>

        <div className="tw-bg-yellow-50 tw-p-3 tw-rounded-lg tw-border tw-border-yellow-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-xs tw-text-yellow-600 tw-font-medium">Avg km/L</p>
              <p className="tw-text-xl tw-font-bold tw-text-yellow-900">
                {summaryStats.avgEfficiencyKmL > 0 ? summaryStats.avgEfficiencyKmL.toFixed(2) : '-'}
              </p>
              <p className="tw-text-xs tw-text-yellow-600">({summaryStats.kmLCount} records)</p>
            </div>
            <i className="fa-light fa-gauge-high tw-text-xl tw-text-yellow-600"></i>
          </div>
        </div>

        <div className="tw-bg-orange-50 tw-p-3 tw-rounded-lg tw-border tw-border-orange-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-xs tw-text-orange-600 tw-font-medium">Avg L/hr</p>
              <p className="tw-text-xl tw-font-bold tw-text-orange-900">
                {summaryStats.avgEfficiencyLHr > 0 ? summaryStats.avgEfficiencyLHr.toFixed(2) : '-'}
              </p>
              <p className="tw-text-xs tw-text-orange-600">({summaryStats.lHrCount} records)</p>
            </div>
            <i className="fa-light fa-droplet tw-text-xl tw-text-orange-600"></i>
          </div>
        </div>

        <div className="tw-bg-red-50 tw-p-3 tw-rounded-lg tw-border tw-border-red-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-xs tw-text-red-600 tw-font-medium">Fuel Lost</p>
              <p className="tw-text-xl tw-font-bold tw-text-red-900">
                {summaryStats.totalFuelLost.toFixed(1)} <span className="tw-text-sm">L</span>
              </p>
            </div>
            <i className="fa-light fa-exclamation-triangle tw-text-xl tw-text-red-600"></i>
          </div>
        </div>
      </div>

      {/* Trend Analysis Chart */}
      <ConsumptionTrendChart selectedData={selectedData} />

      {/* Details Modal */}
      {detailsVisible && selectedRecord && (
        <VehicleConsumptionHistoryDetails
          record={selectedRecord}
          visible={detailsVisible}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
};

export default React.memo(VehicleConsumptionHistory, (prevProps, nextProps) => {
  // Only re-render if vehicleId changes
  return prevProps.vehicleId === nextProps.vehicleId;
});
