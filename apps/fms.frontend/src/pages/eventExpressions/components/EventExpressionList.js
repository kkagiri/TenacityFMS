/**
 * File: EventExpressionList.js
 * Purpose: Displays all event expressions in a DataGrid with filtering, and actions
 *          for create, edit, delete, and viewing execution history.
 * Dependencies: react-redux, react-router-dom, devextreme-react, eventExpressionSlice
 * Last Modified: 2026-02-06
 *
 * Key Features:
 * - Filterable DataGrid with event type, site, status columns
 * - Toolbar with Create button and filter dropdowns
 * - Row actions: Edit, Delete, View Executions
 * - Status toggle for active/inactive
 */

import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import DataGrid, {
    Column,
    Paging,
    Pager,
    FilterRow,
    HeaderFilter,
    SearchPanel,
    Toolbar,
    Item
} from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { confirm } from 'devextreme/ui/dialog';
import {
    fetchEventExpressions,
    deleteEventExpression,
    setFilters
} from '../../../redux/slices/eventExpressionSlice';
import { usePermissions } from '../../../hooks/usePermissions';
import { eventExpressionPermissions } from '../utils/navigationHelper';
import './EventExpressionList.scss';

const EventExpressionList = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { hasAnyPermission } = usePermissions();
    const { expressions, loading, filters } = useSelector(
        (state) => state.eventExpressions
    );
    const canCreateExpressions = hasAnyPermission(eventExpressionPermissions.create);
    const canEditExpressions = hasAnyPermission(eventExpressionPermissions.edit);
    const canDeleteExpressions = hasAnyPermission(eventExpressionPermissions.delete);
    const canViewExecutions = hasAnyPermission(eventExpressionPermissions.read);

    useEffect(() => {
        dispatch(fetchEventExpressions(filters));
    }, [dispatch, filters]);

    const handleRefresh = useCallback(() => {
        dispatch(fetchEventExpressions(filters));
    }, [dispatch, filters]);

    const handleCreate = useCallback(() => {
        navigate('/event-expressions/create');
    }, [navigate]);

    const handleEdit = useCallback(
        (id) => {
            navigate(`/event-expressions/${id}/edit`);
        },
        [navigate]
    );

    const handleViewExecutions = useCallback(
        (id) => {
            navigate(`/event-expressions/${id}/executions`);
        },
        [navigate]
    );

    const handleDelete = useCallback(
        async (id, name) => {
            const result = await confirm(
                `Are you sure you want to deactivate "${name}"?`,
                'Confirm Deactivation'
            );
            if (result) {
                dispatch(deleteEventExpression(id));
            }
        },
        [dispatch]
    );

    const renderActions = useCallback(
        (cellData) => {
            const { id, name, isSystem } = cellData.data;
            return (
                <div className="tw-flex tw-gap-2">
                    {canEditExpressions && (
                        <Button
                            icon="fa-light fa-pen-to-square"
                            hint="Edit"
                            stylingMode="text"
                            onClick={() => handleEdit(id)}
                        />
                    )}
                    {canViewExecutions && (
                        <Button
                            icon="fa-light fa-clock-rotate-left"
                            hint="Execution History"
                            stylingMode="text"
                            onClick={() => handleViewExecutions(id)}
                        />
                    )}
                    {!isSystem && canDeleteExpressions && (
                        <Button
                            icon="fa-light fa-trash"
                            hint="Deactivate"
                            stylingMode="text"
                            onClick={() => handleDelete(id, name)}
                        />
                    )}
                </div>
            );
        },
        [canDeleteExpressions, canEditExpressions, canViewExecutions, handleDelete, handleEdit, handleViewExecutions]
    );

    const renderStatus = useCallback((cellData) => {
        const isActive = cellData.value;
        return (
            <span
                className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${isActive
                    ? 'tw-bg-green-100 tw-text-green-800'
                    : 'tw-bg-gray-100 tw-text-gray-500'
                    }`}
            >
                {isActive ? 'Active' : 'Inactive'}
            </span>
        );
    }, []);

    const renderPriority = useCallback((cellData) => {
        const priority = cellData.value;
        const colorMap = {
            Low: 'tw-bg-blue-100 tw-text-blue-700',
            Medium: 'tw-bg-yellow-100 tw-text-yellow-700',
            High: 'tw-bg-orange-100 tw-text-orange-700',
            Critical: 'tw-bg-red-100 tw-text-red-700'
        };
        return (
            <span
                className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${colorMap[priority] || 'tw-bg-gray-100 tw-text-gray-700'
                    }`}
            >
                {priority}
            </span>
        );
    }, []);

    const renderTriggerCount = useCallback((cellData) => {
        const count = cellData.value || 0;
        return (
            <span className="tw-font-mono tw-text-sm">{count.toLocaleString()}</span>
        );
    }, []);

    const renderName = useCallback((cellData) => {
        const { name, isSystem } = cellData.data;
        return (
            <div className="tw-flex tw-items-center tw-gap-2">
                <span>{name}</span>
                {isSystem && (
                    <span className="tw-px-1.5 tw-py-0.5 tw-rounded tw-text-[10px] tw-font-semibold tw-bg-indigo-100 tw-text-indigo-700 tw-uppercase tw-tracking-wide">
                        System
                    </span>
                )}
            </div>
        );
    }, []);

    return (
        <div className="event-expression-list tw-p-4">
            <div className="tw-flex tw-items-center tw-justify-end tw-gap-2 tw-mb-4">
                <Button
                    icon="fa-light fa-rotate-right"
                    hint="Refresh"
                    stylingMode="outlined"
                    onClick={handleRefresh}
                />
                {canCreateExpressions && (
                    <Button
                        text="Create Expression"
                        icon="fa-light fa-plus"
                        type="default"
                        stylingMode="contained"
                        onClick={handleCreate}
                    />
                )}
            </div>

            <DataGrid
                dataSource={expressions}
                keyExpr="id"
                showBorders={true}
                showRowLines={true}
                showColumnLines={false}
                rowAlternationEnabled={true}
                width="100%"
                wordWrapEnabled={false}
                noDataText={loading ? 'Loading...' : 'No event expressions configured'}
                className="event-expression-grid"
            >
                <SearchPanel visible={true} width={250} placeholder="Search expressions..." />
                <FilterRow visible={true} />
                <HeaderFilter visible={true} />
                <Paging defaultPageSize={20} />
                <Pager
                    showPageSizeSelector={true}
                    allowedPageSizes={[10, 20, 50]}
                    showInfo={true}
                />

                <Column dataField="name" caption="Name" width={200} cellRender={renderName} />
                <Column dataField="eventType" caption="Event Type" width={160} />
                <Column dataField="siteName" caption="Site" width={140} />
                <Column dataField="tankName" caption="Tank" width={140} />
                <Column dataField="policyName" caption="Policy" minWidth={160} />
                <Column
                    dataField="priority"
                    caption="Priority"
                    width={100}
                    cellRender={renderPriority}
                />
                <Column
                    dataField="isActive"
                    caption="Status"
                    width={90}
                    cellRender={renderStatus}
                />

                <Column
                    dataField="triggerCount"
                    caption="Triggers"
                    width={90}
                    cellRender={renderTriggerCount}
                    alignment="center"
                />
                <Column
                    caption="Actions"
                    width={130}
                    cellRender={renderActions}
                    alignment="center"
                    allowFiltering={false}
                    allowSorting={false}
                />
            </DataGrid>
        </div>
    );
};

export default EventExpressionList;
