/**
 * File: ActiveEventsList.js
 * Purpose: Lists active events with filtering, acknowledge, resolve, and bulk actions.
 *          Uses the /api/v1/active-events backend endpoint directly (no Redux slice yet).
 * Dependencies: react, devextreme-react, activeEventApi
 * Last Modified: 2026-02-18
 *
 * Key Features:
 * - DataGrid with state/severity/type filters
 * - Acknowledge and Resolve single-row actions
 * - Bulk acknowledge via checkbox selection
 * - Color-coded severity and state badges
 * - Auto-refresh with manual refresh button
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DataGrid, {
    Column,
    Paging,
    Pager,
    FilterRow,
    HeaderFilter,
    SearchPanel,
    Selection,
    Toolbar,
    Item,
} from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { SelectBox } from 'devextreme-react/select-box';
import { confirm } from 'devextreme/ui/dialog';
import { Popup, ToolbarItem } from 'devextreme-react/popup';
import { TextArea } from 'devextreme-react/text-area';
import activeEventApi from '../../../dataservice/activeEventApi';
import './ActiveEventsList.scss';

const STATE_OPTIONS = ['Active', 'Acknowledged', 'Resolved', 'Suppressed'];
const SEVERITY_OPTIONS = [
    { text: 'Critical (4)', value: 4 },
    { text: 'High (3)', value: 3 },
    { text: 'Medium (2)', value: 2 },
    { text: 'Low (1)', value: 1 },
];

const ActiveEventsList = () => {
    const navigate = useNavigate();
    const gridRef = useRef(null);

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stateFilter, setStateFilter] = useState('Active');
    const [severityFilter, setSeverityFilter] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);

    // Resolve popup state
    const [resolvePopupVisible, setResolvePopupVisible] = useState(false);
    const [resolveTargetId, setResolveTargetId] = useState(null);
    const [resolveNotes, setResolveNotes] = useState('');

    // ── Fetch ───────────────────────────────────
    const loadEvents = useCallback(async () => {
        setLoading(true);
        try {
            const params = { take: 200 };
            if (stateFilter) params.state = stateFilter;
            if (severityFilter) params.severity = severityFilter;
            const res = await activeEventApi.getActiveEvents(params);
            const data = res?.data || res;
            setEvents(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('[ActiveEvents] load failed:', err);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    }, [stateFilter, severityFilter]);

    useEffect(() => {
        loadEvents();
    }, [loadEvents]);

    // ── Actions ─────────────────────────────────
    const handleAcknowledge = useCallback(
        async (id) => {
            try {
                await activeEventApi.acknowledgeEvent(id);
                loadEvents();
            } catch (err) {
                console.error('[ActiveEvents] acknowledge failed:', err);
            }
        },
        [loadEvents]
    );

    const handleResolveOpen = useCallback((id) => {
        setResolveTargetId(id);
        setResolveNotes('');
        setResolvePopupVisible(true);
    }, []);

    const handleResolveConfirm = useCallback(async () => {
        if (!resolveTargetId) return;
        try {
            await activeEventApi.resolveEvent(resolveTargetId, resolveNotes);
            setResolvePopupVisible(false);
            loadEvents();
        } catch (err) {
            console.error('[ActiveEvents] resolve failed:', err);
        }
    }, [resolveTargetId, resolveNotes, loadEvents]);

    const handleBulkAcknowledge = useCallback(async () => {
        if (selectedIds.length === 0) return;
        const result = await confirm(
            `Acknowledge ${selectedIds.length} event(s)?`,
            'Bulk Acknowledge'
        );
        if (!result) return;
        try {
            await activeEventApi.bulkAcknowledge(selectedIds);
            setSelectedIds([]);
            loadEvents();
        } catch (err) {
            console.error('[ActiveEvents] bulk acknowledge failed:', err);
        }
    }, [selectedIds, loadEvents]);

    const handleSelectionChanged = useCallback((e) => {
        setSelectedIds(e.selectedRowKeys || []);
    }, []);

    // ── Renderers ───────────────────────────────
    const renderState = useCallback((cellData) => {
        const state = cellData.value;
        const colorMap = {
            Active: 'tw-bg-red-100 tw-text-red-700',
            Acknowledged: 'tw-bg-yellow-100 tw-text-yellow-700',
            Resolved: 'tw-bg-green-100 tw-text-green-700',
            Suppressed: 'tw-bg-gray-100 tw-text-gray-500',
        };
        return (
            <span
                className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${colorMap[state] || 'tw-bg-gray-100 tw-text-gray-700'
                    }`}
            >
                {state}
            </span>
        );
    }, []);

    const renderSeverity = useCallback((cellData) => {
        const sev = cellData.value;
        const map = {
            1: { label: 'Low', cls: 'tw-bg-blue-100 tw-text-blue-700' },
            2: { label: 'Medium', cls: 'tw-bg-yellow-100 tw-text-yellow-700' },
            3: { label: 'High', cls: 'tw-bg-orange-100 tw-text-orange-700' },
            4: { label: 'Critical', cls: 'tw-bg-red-100 tw-text-red-700' },
        };
        const meta = map[sev] || { label: sev, cls: 'tw-bg-gray-100 tw-text-gray-500' };
        return (
            <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${meta.cls}`}>
                {meta.label}
            </span>
        );
    }, []);

    const renderActions = useCallback(
        (cellData) => {
            const { id, state } = cellData.data;
            return (
                <div className="tw-flex tw-gap-1">
                    {state === 'Active' && (
                        <Button
                            icon="fa-light fa-eye"
                            hint="Acknowledge"
                            stylingMode="text"
                            onClick={() => handleAcknowledge(id)}
                        />
                    )}
                    {(state === 'Active' || state === 'Acknowledged') && (
                        <Button
                            icon="fa-light fa-circle-check"
                            hint="Resolve"
                            stylingMode="text"
                            onClick={() => handleResolveOpen(id)}
                        />
                    )}
                </div>
            );
        },
        [handleAcknowledge, handleResolveOpen]
    );

    const renderTime = useCallback((cellData) => {
        if (!cellData.value) return '—';
        return new Date(cellData.value).toLocaleString();
    }, []);

    // ── Render ──────────────────────────────────
    return (
        <div className="active-events-list tw-p-4">
            {/* Filter bar */}
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3 tw-mb-4">
                <SelectBox
                    items={STATE_OPTIONS}
                    value={stateFilter}
                    onValueChanged={(e) => setStateFilter(e.value)}
                    placeholder="Filter by state"
                    showClearButton={true}
                    width={180}
                />
                <SelectBox
                    items={SEVERITY_OPTIONS}
                    valueExpr="value"
                    displayExpr="text"
                    value={severityFilter}
                    onValueChanged={(e) => setSeverityFilter(e.value)}
                    placeholder="Filter by severity"
                    showClearButton={true}
                    width={180}
                />
                <Button
                    icon="fa-light fa-arrows-rotate"
                    hint="Refresh"
                    stylingMode="text"
                    onClick={loadEvents}
                />
                {selectedIds.length > 0 && (
                    <Button
                        text={`Acknowledge (${selectedIds.length})`}
                        icon="fa-light fa-check-double"
                        type="default"
                        stylingMode="contained"
                        onClick={handleBulkAcknowledge}
                    />
                )}
            </div>

            <DataGrid
                ref={gridRef}
                dataSource={events}
                keyExpr="id"
                showBorders={true}
                showRowLines={true}
                showColumnLines={false}
                rowAlternationEnabled={true}
                columnAutoWidth={true}
                wordWrapEnabled={true}
                noDataText={loading ? 'Loading...' : 'No events found'}
                onSelectionChanged={handleSelectionChanged}
                className="active-events-grid"
            >
                <Selection mode="multiple" showCheckBoxesMode="always" />
                <SearchPanel visible={true} width={250} placeholder="Search events..." />
                <FilterRow visible={true} />
                <HeaderFilter visible={true} />
                <Paging defaultPageSize={20} />
                <Pager
                    showPageSizeSelector={true}
                    allowedPageSizes={[10, 20, 50]}
                    showInfo={true}
                />

                <Column dataField="eventType" caption="Event Type" width={160} />
                <Column dataField="message" caption="Message" minWidth={200} />
                <Column
                    dataField="state"
                    caption="State"
                    width={120}
                    cellRender={renderState}
                />
                <Column
                    dataField="severity"
                    caption="Severity"
                    width={100}
                    cellRender={renderSeverity}
                />
                <Column dataField="priority" caption="Priority" width={90} />
                <Column
                    dataField="triggeredAt"
                    caption="Triggered"
                    width={170}
                    cellRender={renderTime}
                    sortOrder="desc"
                />
                <Column
                    dataField="acknowledgedAt"
                    caption="Acknowledged"
                    width={170}
                    cellRender={renderTime}
                />
                <Column
                    dataField="resolvedAt"
                    caption="Resolved"
                    width={170}
                    cellRender={renderTime}
                />
                <Column
                    caption="Actions"
                    width={100}
                    cellRender={renderActions}
                    alignment="center"
                    allowFiltering={false}
                    allowSorting={false}
                />
            </DataGrid>

            {/* Resolve Popup */}
            <Popup
                visible={resolvePopupVisible}
                onHiding={() => setResolvePopupVisible(false)}
                title="Resolve Event"
                width={450}
                height={280}
                showCloseButton={true}
            >
                <div className="tw-p-4">
                    <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                        Resolution Notes (optional)
                    </label>
                    <TextArea
                        value={resolveNotes}
                        onValueChanged={(e) => setResolveNotes(e.value)}
                        height={100}
                        placeholder="Describe how this event was resolved..."
                    />
                </div>
                <ToolbarItem
                    widget="dxButton"
                    toolbar="bottom"
                    location="after"
                    options={{
                        text: 'Resolve',
                        type: 'success',
                        stylingMode: 'contained',
                        onClick: handleResolveConfirm,
                    }}
                />
                <ToolbarItem
                    widget="dxButton"
                    toolbar="bottom"
                    location="after"
                    options={{
                        text: 'Cancel',
                        stylingMode: 'outlined',
                        onClick: () => setResolvePopupVisible(false),
                    }}
                />
            </Popup>
        </div>
    );
};

export default ActiveEventsList;
