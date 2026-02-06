/**
 * File: AlarmList.js
 * Purpose: Displays a filterable, sortable DataGrid of all active alarms with inline actions
 *          for acknowledge, resolve, suppress, and escalate. Supports bulk selection,
 *          quick-filter presets, real-time updates via Redux, and export.
 * Dependencies: devextreme-react DataGrid, Redux (activeAlarmActions), activeAlarmTypes
 * Last Modified: 2026-02-06
 *
 * Key Components:
 * - AlarmList: Main grid component with toolbar, quick filters, and action popups
 */
import React, { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import DataGrid, {
  Column,
  Selection,
  SearchPanel,
  HeaderFilter,
  FilterRow,
  Paging,
  Pager,
  Export,
  ColumnChooser,
  LoadPanel,
  Sorting,
} from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { Popup } from 'devextreme-react/popup';
import { TextArea } from 'devextreme-react/text-area';
import { SelectBox } from 'devextreme-react/select-box';
import notify from 'devextreme/ui/notify';

import {
  fetchActiveAlarms,
  acknowledgeAlarm,
  resolveAlarm,
  suppressAlarm,
  escalateAlarm,
  bulkAcknowledgeAlarms,
  clearSelection,
  selectMultipleAlarms,
  refreshAlarms,
} from '../../../../redux/actions/activeAlarmActions';

import {
  ALARM_STATES,
  ALARM_PRIORITIES,
  PRIORITY_COLORS,
  STATE_COLORS,
  ALARM_TYPE_ICONS,
  QUICK_FILTERS,
  FILTER_OPTIONS,
  PRIORITY_ORDER,
} from '../../../../redux/types/activeAlarmTypes';

import './AlarmList.scss';

const AlarmList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const dataGridRef = useRef(null);

  // Redux state
  const {
    alarms,
    totalCount,
    loadingStates,
    selectedAlarms,
    filters: savedFilters,
  } = useSelector((state) => state.activeAlarm);

  // Local state
  const [activeQuickFilter, setActiveQuickFilter] = useState(null);
  const [actionPopup, setActionPopup] = useState({ visible: false, type: null, alarm: null });
  const [actionNotes, setActionNotes] = useState('');
  const [filterState, setFilterState] = useState(null);
  const [filterPriority, setFilterPriority] = useState(null);

  // ──────────────────────────── Data Loading ────────────────────────────

  useEffect(() => {
    dispatch(fetchActiveAlarms({ take: 100 }));
  }, [dispatch]);

  const handleRefresh = useCallback(() => {
    dispatch(fetchActiveAlarms({
      take: 100,
      state: filterState,
      priority: filterPriority,
      ...savedFilters,
    }));
    notify('Alarms refreshed', 'info', 1500);
  }, [dispatch, filterState, filterPriority, savedFilters]);

  // ──────────────────────────── Quick Filters ────────────────────────────

  const handleQuickFilter = useCallback((filterKey) => {
    if (activeQuickFilter === filterKey) {
      // Toggle off
      setActiveQuickFilter(null);
      setFilterState(null);
      setFilterPriority(null);
      dispatch(fetchActiveAlarms({ take: 100 }));
      return;
    }

    setActiveQuickFilter(filterKey);
    const preset = QUICK_FILTERS[filterKey];
    if (!preset) return;

    const params = { take: 100 };
    if (preset.state) {
      params.state = preset.state;
      setFilterState(preset.state);
    } else {
      setFilterState(null);
    }
    if (preset.priority && !Array.isArray(preset.priority)) {
      params.priority = preset.priority;
      setFilterPriority(preset.priority);
    } else {
      setFilterPriority(null);
    }

    dispatch(fetchActiveAlarms(params));
  }, [dispatch, activeQuickFilter]);

  // ──────────────────────────── Selection ────────────────────────────

  const onSelectionChanged = useCallback((e) => {
    const ids = e.selectedRowsData.map((r) => r.id);
    dispatch(clearSelection());
    if (ids.length > 0) {
      dispatch(selectMultipleAlarms(ids));
    }
  }, [dispatch]);

  // ──────────────────────────── Actions ────────────────────────────

  const openActionPopup = useCallback((type, alarm) => {
    setActionPopup({ visible: true, type, alarm });
    setActionNotes('');
  }, []);

  const closeActionPopup = useCallback(() => {
    setActionPopup({ visible: false, type: null, alarm: null });
    setActionNotes('');
  }, []);

  const executeAction = useCallback(async () => {
    const { type, alarm } = actionPopup;
    if (!alarm) return;

    try {
      switch (type) {
        case 'acknowledge':
          await dispatch(acknowledgeAlarm(alarm.id, actionNotes));
          break;
        case 'resolve':
          await dispatch(resolveAlarm(alarm.id, actionNotes));
          break;
        case 'suppress':
          await dispatch(suppressAlarm(alarm.id));
          break;
        case 'escalate':
          await dispatch(escalateAlarm(alarm.id));
          break;
        default:
          break;
      }
      closeActionPopup();
      dispatch(refreshAlarms());
    } catch {
      // Error handled by Redux action
    }
  }, [actionPopup, actionNotes, dispatch, closeActionPopup]);

  const handleBulkAcknowledge = useCallback(async () => {
    if (selectedAlarms.length === 0) {
      notify('No alarms selected', 'warning', 2000);
      return;
    }
    try {
      await dispatch(bulkAcknowledgeAlarms(selectedAlarms));
      dispatch(clearSelection());
      dispatch(refreshAlarms());
      if (dataGridRef.current) {
        dataGridRef.current.instance.clearSelection();
      }
    } catch {
      // Error handled by Redux action
    }
  }, [selectedAlarms, dispatch]);

  // ──────────────────────────── Navigation ────────────────────────────

  const handleViewDetails = useCallback((alarm) => {
    navigate(`/active-alarms/${alarm.id}/details`);
  }, [navigate]);

  // ──────────────────────────── Custom Cell Renderers ────────────────────────────

  const priorityCellRender = useCallback((cellData) => {
    const priority = cellData.value;
    const color = PRIORITY_COLORS[priority] || '#6c757d';
    return (
      <span
        className="alarm-priority-badge"
        style={{ backgroundColor: `${color}20`, color, borderColor: color }}
      >
        <i className="fa-light fa-flag tw-mr-1" style={{ fontSize: '10px' }} />
        {priority}
      </span>
    );
  }, []);

  const stateCellRender = useCallback((cellData) => {
    const state = cellData.value;
    const color = STATE_COLORS[state] || '#6c757d';
    return (
      <span
        className="alarm-state-badge"
        style={{ backgroundColor: `${color}20`, color, borderColor: color }}
      >
        {state}
      </span>
    );
  }, []);

  const alarmTypeCellRender = useCallback((cellData) => {
    const type = cellData.value;
    const icon = ALARM_TYPE_ICONS[type] || 'fa-light fa-bell';
    return (
      <div className="tw-flex tw-items-center tw-gap-2">
        <i className={icon} style={{ fontSize: '14px', opacity: 0.7 }} />
        <span className="tw-text-sm">{type}</span>
      </div>
    );
  }, []);

  const messageCellRender = useCallback((cellData) => {
    return (
      <div className="tw-max-w-xs tw-truncate" title={cellData.value}>
        {cellData.value}
      </div>
    );
  }, []);

  const dateCellRender = useCallback((cellData) => {
    if (!cellData.value) return <span className="tw-text-gray-400">—</span>;
    return (
      <span className="tw-text-sm tw-text-gray-600">
        {new Date(cellData.value).toLocaleString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </span>
    );
  }, []);

  const triggerSourceCellRender = useCallback((cellData) => {
    const sourceIcons = {
      Manual: 'fa-light fa-hand',
      Policy: 'fa-light fa-file-shield',
      Hardware: 'fa-light fa-microchip',
      System: 'fa-light fa-server',
      AlarmHandler: 'fa-light fa-robot',
      'FMS-System': 'fa-light fa-gears',
    };
    const icon = sourceIcons[cellData.value] || 'fa-light fa-circle-info';
    return (
      <div className="tw-flex tw-items-center tw-gap-1">
        <i className={icon} style={{ fontSize: '12px', opacity: 0.6 }} />
        <span className="tw-text-sm">{cellData.value || '—'}</span>
      </div>
    );
  }, []);

  const actionsCellRender = useCallback((cellData) => {
    const alarm = cellData.data;
    const isActive = alarm.state === ALARM_STATES.ACTIVE;
    const isAcknowledged = alarm.state === ALARM_STATES.ACKNOWLEDGED;

    return (
      <div className="alarm-actions-cell">
        <Button
          icon="fa-light fa-eye"
          hint="View Details"
          stylingMode="text"
          type="default"
          onClick={() => handleViewDetails(alarm)}
        />
        {isActive && (
          <Button
            icon="fa-light fa-check"
            hint="Acknowledge"
            stylingMode="text"
            type="success"
            onClick={() => openActionPopup('acknowledge', alarm)}
          />
        )}
        {isAcknowledged && (
          <Button
            icon="fa-light fa-check-double"
            hint="Resolve"
            stylingMode="text"
            type="success"
            onClick={() => openActionPopup('resolve', alarm)}
          />
        )}
        {isActive && (
          <Button
            icon="fa-light fa-arrow-up"
            hint="Escalate"
            stylingMode="text"
            type="danger"
            onClick={() => openActionPopup('escalate', alarm)}
          />
        )}
        {(isActive || isAcknowledged) && (
          <Button
            icon="fa-light fa-volume-slash"
            hint="Suppress"
            stylingMode="text"
            type="normal"
            onClick={() => openActionPopup('suppress', alarm)}
          />
        )}
      </div>
    );
  }, [handleViewDetails, openActionPopup]);

  // ──────────────────────────── Priority sort ────────────────────────────

  const prioritySortingMethod = useCallback((a, b) => {
    return (PRIORITY_ORDER[b] || 0) - (PRIORITY_ORDER[a] || 0);
  }, []);

  // ──────────────────────────── Row styling ────────────────────────────

  const onRowPrepared = useCallback((e) => {
    if (e.rowType !== 'data') return;
    const priority = e.data?.priority;
    if (priority === 'Critical') {
      e.rowElement.classList.add('alarm-row-critical');
    } else if (priority === 'High') {
      e.rowElement.classList.add('alarm-row-high');
    }
    if (e.data?.state === ALARM_STATES.RESOLVED) {
      e.rowElement.classList.add('alarm-row-resolved');
    }
  }, []);

  // ──────────────────────────── Popup helpers ────────────────────────────

  const actionTitles = {
    acknowledge: 'Acknowledge Alarm',
    resolve: 'Resolve Alarm',
    suppress: 'Suppress Alarm',
    escalate: 'Escalate Alarm',
  };

  const actionDescriptions = {
    acknowledge: 'Acknowledge this alarm to indicate you are aware and working on it.',
    resolve: 'Mark this alarm as resolved. Please provide resolution notes.',
    suppress: 'Suppress this alarm to prevent further notifications.',
    escalate: 'Escalate this alarm to a higher priority level for immediate attention.',
  };

  const showNotesField = actionPopup.type === 'acknowledge' || actionPopup.type === 'resolve';

  // ──────────────────────────── Filter options ────────────────────────────

  const stateFilterOptions = useMemo(() => [
    { value: null, text: 'All States' },
    ...FILTER_OPTIONS.states.map((s) => ({ value: s, text: s })),
  ], []);

  const priorityFilterOptions = useMemo(() => [
    { value: null, text: 'All Priorities' },
    ...FILTER_OPTIONS.priorities.map((p) => ({ value: p, text: p })),
  ], []);

  // ──────────────────────────── Render ────────────────────────────

  return (
    <div className="alarm-list-page tw-h-full tw-flex tw-flex-col">
      {/* ── Quick-Filter Chips ── */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200 tw-p-3 tw-mb-3">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
          <span className="tw-text-sm tw-font-medium tw-text-gray-500 tw-mr-1">
            <i className="fa-light fa-filter tw-mr-1" />Quick Filters:
          </span>
          {Object.entries(QUICK_FILTERS).map(([key, preset]) => (
            <button
              key={key}
              className={`alarm-quick-filter-chip ${activeQuickFilter === key ? 'active' : ''}`}
              style={{
                '--chip-color': preset.color,
                borderColor: activeQuickFilter === key ? preset.color : undefined,
                backgroundColor: activeQuickFilter === key ? `${preset.color}15` : undefined,
              }}
              onClick={() => handleQuickFilter(key)}
            >
              <i className={preset.icon} />
              <span>{preset.name}</span>
            </button>
          ))}

          <div className="tw-ml-auto tw-flex tw-items-center tw-gap-2">
            <SelectBox
              items={stateFilterOptions}
              displayExpr="text"
              valueExpr="value"
              value={filterState}
              onValueChanged={(e) => {
                setFilterState(e.value);
                setActiveQuickFilter(null);
                dispatch(fetchActiveAlarms({ take: 100, state: e.value, priority: filterPriority }));
              }}
              placeholder="State"
              width={140}
              stylingMode="outlined"
            />
            <SelectBox
              items={priorityFilterOptions}
              displayExpr="text"
              valueExpr="value"
              value={filterPriority}
              onValueChanged={(e) => {
                setFilterPriority(e.value);
                setActiveQuickFilter(null);
                dispatch(fetchActiveAlarms({ take: 100, state: filterState, priority: e.value }));
              }}
              placeholder="Priority"
              width={140}
              stylingMode="outlined"
            />
          </div>
        </div>
      </div>

      {/* ── Toolbar Bar ── */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200 tw-p-3 tw-mb-3">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2">
          <div className="tw-flex tw-items-center tw-gap-3">
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-flex tw-items-center tw-m-0">
              <i className="fa-light fa-bell tw-mr-2 tw-text-red-600" />
              Active Alarms
              <span className="tw-ml-2 tw-text-sm tw-font-normal tw-text-gray-500">
                ({totalCount} total)
              </span>
            </h3>
          </div>

          <div className="tw-flex tw-items-center tw-gap-2">
            {selectedAlarms.length > 0 && (
              <Button
                text={`Acknowledge (${selectedAlarms.length})`}
                icon="fa-light fa-check-double"
                type="success"
                stylingMode="outlined"
                onClick={handleBulkAcknowledge}
              />
            )}
            <Button
              icon="fa-light fa-rotate"
              hint="Refresh"
              type="default"
              stylingMode="outlined"
              onClick={handleRefresh}
            />
            <Button
              text="Create Alarm"
              icon="fa-light fa-plus"
              type="default"
              stylingMode="contained"
              onClick={() => navigate('/active-alarms/create')}
            />
          </div>
        </div>
      </div>

      {/* ── DataGrid ── */}
      <div className="tw-flex-1 tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-shadow-sm tw-overflow-hidden">
        <DataGrid
          ref={dataGridRef}
          dataSource={alarms}
          keyExpr="id"
          showBorders={false}
          showRowLines={true}
          columnAutoWidth={true}
          wordWrapEnabled={false}
          height="100%"
          hoverStateEnabled={true}
          rowAlternationEnabled={true}
          onRowDblClick={(e) => handleViewDetails(e.data)}
          onSelectionChanged={onSelectionChanged}
          onRowPrepared={onRowPrepared}
        >
          <LoadPanel enabled={loadingStates.fetchingAlarms} />
          <Selection mode="multiple" showCheckBoxesMode="always" />
          <SearchPanel visible={true} width={250} placeholder="Search alarms..." />
          <HeaderFilter visible={true} />
          <FilterRow visible={true} />
          <Sorting mode="multiple" />
          <Paging defaultPageSize={25} />
          <Pager
            showPageSizeSelector={true}
            allowedPageSizes={[10, 25, 50, 100]}
            showInfo={true}
            showNavigationButtons={true}
            infoText="Page {0} of {1} ({2} alarms)"
          />
          <ColumnChooser enabled={true} mode="select" />
          <Export enabled={true} allowExportSelectedData={true} />

          <Column
            dataField="priority"
            caption="Priority"
            width={110}
            cellRender={priorityCellRender}
            sortingMethod={prioritySortingMethod}
            defaultSortOrder="desc"
            defaultSortIndex={0}
          />
          <Column
            dataField="state"
            caption="State"
            width={120}
            cellRender={stateCellRender}
          />
          <Column
            dataField="alarmType"
            caption="Alarm Type"
            width={200}
            cellRender={alarmTypeCellRender}
          />
          <Column
            dataField="message"
            caption="Message"
            minWidth={200}
            cellRender={messageCellRender}
          />
          <Column
            dataField="triggerSource"
            caption="Source"
            width={130}
            cellRender={triggerSourceCellRender}
          />
          <Column
            dataField="siteName"
            caption="Site"
            width={130}
            calculateCellValue={(rowData) => rowData.site?.name || rowData.siteName || '—'}
          />
          <Column
            dataField="triggeredAt"
            caption="Triggered"
            width={160}
            dataType="datetime"
            cellRender={dateCellRender}
            defaultSortOrder="desc"
            defaultSortIndex={1}
          />
          <Column
            dataField="acknowledgedAt"
            caption="Acknowledged"
            width={160}
            dataType="datetime"
            cellRender={dateCellRender}
            visible={false}
          />
          <Column
            dataField="resolvedAt"
            caption="Resolved"
            width={160}
            dataType="datetime"
            cellRender={dateCellRender}
            visible={false}
          />
          <Column
            dataField="triggeredBy"
            caption="Triggered By"
            width={120}
            visible={false}
          />
          <Column
            dataField="acknowledgedBy"
            caption="Acknowledged By"
            width={130}
            visible={false}
          />
          <Column
            caption="Actions"
            width={160}
            fixed={true}
            fixedPosition="right"
            cellRender={actionsCellRender}
            allowFiltering={false}
            allowSorting={false}
            allowHeaderFiltering={false}
          />
        </DataGrid>
      </div>

      {/* ── Action Confirmation Popup ── */}
      <Popup
        visible={actionPopup.visible}
        onHiding={closeActionPopup}
        title={actionTitles[actionPopup.type] || 'Alarm Action'}
        width={480}
        height="auto"
        showCloseButton={true}
        dragEnabled={false}
      >
        <div className="tw-p-4">
          {/* Alarm summary */}
          {actionPopup.alarm && (
            <div className="tw-bg-gray-50 tw-rounded-lg tw-p-3 tw-mb-4">
              <div className="tw-flex tw-items-center tw-gap-2 tw-mb-2">
                <span
                  className="alarm-priority-badge"
                  style={{
                    backgroundColor: `${PRIORITY_COLORS[actionPopup.alarm.priority]}20`,
                    color: PRIORITY_COLORS[actionPopup.alarm.priority],
                    borderColor: PRIORITY_COLORS[actionPopup.alarm.priority],
                  }}
                >
                  {actionPopup.alarm.priority}
                </span>
                <span className="tw-text-sm tw-font-medium tw-text-gray-700">
                  {actionPopup.alarm.alarmType}
                </span>
              </div>
              <p className="tw-text-sm tw-text-gray-600 tw-m-0">{actionPopup.alarm.message}</p>
            </div>
          )}

          {/* Description */}
          <p className="tw-text-sm tw-text-gray-500 tw-mb-4">
            {actionDescriptions[actionPopup.type]}
          </p>

          {/* Notes field */}
          {showNotesField && (
            <div className="tw-mb-4">
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                {actionPopup.type === 'resolve' ? 'Resolution Notes' : 'Notes'} (optional)
              </label>
              <TextArea
                value={actionNotes}
                onValueChanged={(e) => setActionNotes(e.value)}
                placeholder={
                  actionPopup.type === 'resolve'
                    ? 'Describe how this alarm was resolved...'
                    : 'Add any notes about this alarm...'
                }
                height={100}
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="tw-flex tw-justify-end tw-gap-2 tw-pt-2 tw-border-t tw-border-gray-200">
            <Button
              text="Cancel"
              type="default"
              stylingMode="outlined"
              onClick={closeActionPopup}
            />
            <Button
              text={actionTitles[actionPopup.type]?.replace('Alarm', '') || 'Confirm'}
              type={actionPopup.type === 'escalate' ? 'danger' : 'success'}
              stylingMode="contained"
              onClick={executeAction}
            />
          </div>
        </div>
      </Popup>
    </div>
  );
};

export default AlarmList;
