/**
 * File: PolicyTriggersManager.js
 * Purpose: Displays and manages EventExpressions (triggers) linked to a notification policy.
 *          Embedded inside the PolicyEdit "Policy Triggers" tab.
 * Dependencies: devextreme-react, eventExpressionApi
 * Last Modified: 2026-02-11
 *
 * Key Features:
 * - Lists event expressions linked to the current policy
 * - Navigate to create/edit expressions pre-filtered by policyId
 * - Shows trigger count, last triggered, active status
 */

import React, { useState, useEffect, useCallback } from 'react';
import DataGrid, {
    Column,
    Paging,
    Pager,
    SearchPanel,
} from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import notify from 'devextreme/ui/notify';
import { useNavigate } from 'react-router-dom';
import eventExpressionApi from '../../../dataservice/eventExpressionApi';

const PolicyTriggersManager = ({ policyId, categoryId }) => {
    const [expressions, setExpressions] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const loadExpressions = useCallback(async () => {
        if (!policyId || policyId <= 0) return;
        setLoading(true);
        try {
            const result = await eventExpressionApi.getEventExpressions({ take: 200 });
            if (result?.isSuccess && result.data) {
                // Filter to expressions linked to this policy
                const filtered = result.data.filter(
                    (expr) => expr.notificationPolicyId === policyId
                );
                setExpressions(filtered);
            } else {
                setExpressions([]);
            }
        } catch (err) {
            console.error('Failed to load event expressions', err);
            notify('Failed to load event expressions', 'error', 3000);
        } finally {
            setLoading(false);
        }
    }, [policyId]);

    useEffect(() => {
        loadExpressions();
    }, [loadExpressions]);

    const handleCreateNew = useCallback(() => {
        // Navigate to event expression create, passing policyId as query param
        navigate(`/event-expressions/create?policyId=${policyId}`);
    }, [navigate, policyId]);

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

    const renderActions = useCallback(
        (cellData) => {
            return (
                <div className="tw-flex tw-gap-1">
                    <Button
                        icon="fa-light fa-pen-to-square"
                        hint="Edit Expression"
                        stylingMode="text"
                        onClick={() => handleEdit(cellData.data.id)}
                    />
                    <Button
                        icon="fa-light fa-clock-rotate-left"
                        hint="View Execution History"
                        stylingMode="text"
                        onClick={() => handleViewExecutions(cellData.data.id)}
                    />
                </div>
            );
        },
        [handleEdit, handleViewExecutions]
    );

    const renderStatus = useCallback((cellData) => {
        const isActive = cellData.value;
        return (
            <span
                className={`tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-font-medium ${isActive
                        ? 'tw-bg-green-100 tw-text-green-800'
                        : 'tw-bg-gray-100 tw-text-gray-500'
                    }`}
            >
                {isActive ? 'Active' : 'Inactive'}
            </span>
        );
    }, []);

    const renderSeverity = useCallback((cellData) => {
        const severity = cellData.value || 'N/A';
        const colorMap = {
            Low: 'tw-text-blue-600',
            Medium: 'tw-text-yellow-600',
            High: 'tw-text-orange-600',
            Critical: 'tw-text-red-600',
        };
        return (
            <span className={`tw-font-medium ${colorMap[severity] || 'tw-text-gray-500'}`}>
                {severity}
            </span>
        );
    }, []);

    const renderTriggerCount = useCallback((cellData) => {
        const count = cellData.data.triggerCount || 0;
        const lastTriggered = cellData.data.lastTriggeredAt;
        return (
            <div className="tw-flex tw-flex-col">
                <span className="tw-font-medium">{count}</span>
                {lastTriggered && (
                    <span className="tw-text-xs tw-text-gray-400">
                        {new Date(lastTriggered).toLocaleDateString()}
                    </span>
                )}
            </div>
        );
    }, []);

    return (
        <div>
            <div className="tw-flex tw-justify-between tw-items-center tw-mb-4">
                <div>
                    <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-m-0">
                        Event Expression Triggers
                    </h3>
                    <p className="tw-text-sm tw-text-gray-500 tw-mt-1 tw-mb-0">
                        Expressions that trigger notifications through this policy.
                    </p>
                </div>
                <Button
                    text="Add Trigger"
                    icon="fa-light fa-plus"
                    type="default"
                    stylingMode="contained"
                    onClick={handleCreateNew}
                />
            </div>

            {expressions.length === 0 && !loading ? (
                <div className="tw-text-center tw-py-12 tw-bg-gray-50 tw-rounded-lg tw-border tw-border-dashed tw-border-gray-300">
                    <i className="fa-light fa-function tw-text-4xl tw-text-gray-300 tw-mb-3" />
                    <p className="tw-text-gray-500 tw-mb-3">
                        No event expressions are linked to this policy yet.
                    </p>
                    <Button
                        text="Create First Expression"
                        icon="fa-light fa-plus"
                        type="default"
                        stylingMode="outlined"
                        onClick={handleCreateNew}
                    />
                </div>
            ) : (
                <DataGrid
                    dataSource={expressions}
                    showBorders={true}
                    showRowLines={true}
                    columnAutoWidth={true}
                    wordWrapEnabled={true}
                    noDataText="No expressions linked to this policy"
                    loadPanel={{ enabled: loading }}
                >
                    <SearchPanel visible={true} width={240} placeholder="Search expressions..." />
                    <Paging defaultPageSize={10} />
                    <Pager showPageSizeSelector={true} allowedPageSizes={[5, 10, 20]} showInfo={true} />

                    <Column dataField="name" caption="Expression Name" />
                    <Column dataField="eventType" caption="Event Type" width={150} />
                    <Column
                        dataField="minimumSeverity"
                        caption="Min Severity"
                        width={120}
                        cellRender={renderSeverity}
                    />
                    <Column dataField="cooldownMinutes" caption="Cooldown (min)" width={120} alignment="center" />
                    <Column
                        dataField="isActive"
                        caption="Status"
                        width={100}
                        cellRender={renderStatus}
                    />
                    <Column
                        caption="Triggers"
                        width={100}
                        cellRender={renderTriggerCount}
                        alignment="center"
                    />
                    <Column caption="Actions" width={100} cellRender={renderActions} alignment="center" />
                </DataGrid>
            )}
        </div>
    );
};

export default PolicyTriggersManager;
