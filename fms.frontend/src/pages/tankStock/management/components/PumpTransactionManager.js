import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DataGrid } from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { Popup } from 'devextreme-react/popup';
import { Form } from 'devextreme-react/form';
import notify from 'devextreme/ui/notify';
import {
    fetchPumpTransactions,
    clearPumpTransactions
} from '../../../../redux/actions/consumptionActions';
import './PumpTransactionManager.scss';

const PumpTransactionManager = ({ selectedSite, dateRange }) => {
    const dispatch = useDispatch();
    const {
        pumpTransactions,
        pumpTransactionsLoading,
        pumpTransactionsError,
        pumpTransactionsLastFetch,
        pumpTransactionsFilters
    } = useSelector(state => state.consumption);

    // Filter panel state
    const [filterPanelVisible, setFilterPanelVisible] = useState(false);
    const [filterValues, setFilterValues] = useState({
        vehicleId: null,
        tankId: null,
        ptsId: '',
        startDate: dateRange?.[0] || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: dateRange?.[1] || new Date(),
        processedOnly: null
    });

    // Update filter values when date range changes
    useEffect(() => {
        if (dateRange && dateRange.length >= 2) {
            setFilterValues(prev => ({
                ...prev,
                startDate: dateRange[0],
                endDate: dateRange[1]
            }));
        }
    }, [dateRange]);

    // DataGrid columns configuration
    const columns = useMemo(() => [
        {
            dataField: 'ptsId',
            caption: 'PTS ID',
            width: 120,
            filterOperations: ['contains', 'startswith', '=']
        },
        {
            dataField: 'pump',
            caption: 'Pump',
            width: 80,
            dataType: 'number'
        },
        {
            dataField: 'transaction',
            caption: 'Transaction',
            width: 120,
            dataType: 'number'
        },
        {
            dataField: 'nozzle',
            caption: 'Nozzle',
            width: 80,
            dataType: 'number'
        },
        {
            dataField: 'vehicleId',
            caption: 'Vehicle ID',
            width: 100,
            dataType: 'number'
        },
        {
            dataField: 'tankId',
            caption: 'Tank ID',
            width: 100,
            dataType: 'number'
        },
        {
            dataField: 'fuelGradeName',
            caption: 'Fuel Grade',
            width: 120
        },
        {
            dataField: 'volume',
            caption: 'Volume (L)',
            width: 120,
            dataType: 'number',
            format: { type: 'fixedPoint', precision: 2 },
            alignment: 'right'
        },
        {
            dataField: 'tcVolume',
            caption: 'TC Volume (L)',
            width: 130,
            dataType: 'number',
            format: { type: 'fixedPoint', precision: 2 },
            alignment: 'right'
        },
        {
            dataField: 'price',
            caption: 'Price',
            width: 100,
            dataType: 'number',
            format: { type: 'currency', precision: 3 },
            alignment: 'right'
        },
        {
            dataField: 'amount',
            caption: 'Amount',
            width: 120,
            dataType: 'number',
            format: { type: 'currency', precision: 2 },
            alignment: 'right'
        },
        {
            dataField: 'dateTime',
            caption: 'Date/Time',
            width: 160,
            dataType: 'datetime',
            format: 'dd/MM/yyyy HH:mm:ss'
        },
        {
            dataField: 'dateTimeStart',
            caption: 'Start Time',
            width: 160,
            dataType: 'datetime',
            format: 'dd/MM/yyyy HH:mm:ss'
        },
        {
            dataField: 'hasBeenProcessed',
            caption: 'Status',
            width: 120,
            cellRender: (data) => (
                <span className={`tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-font-medium ${
                    data.value
                        ? 'tw-bg-green-100 tw-text-green-800'
                        : 'tw-bg-yellow-100 tw-text-yellow-800'
                }`}>
                    {data.value ? 'Processed' : 'Pending'}
                </span>
            )
        }
    ], []);

    // Filter form items configuration
    const filterFormItems = useMemo(() => [
        {
            dataField: 'vehicleId',
            label: { text: 'Vehicle ID' },
            editorType: 'dxNumberBox',
            editorOptions: {
                placeholder: 'Enter vehicle ID',
                showClearButton: true
            }
        },
        {
            dataField: 'tankId',
            label: { text: 'Tank ID' },
            editorType: 'dxNumberBox',
            editorOptions: {
                placeholder: 'Enter tank ID',
                showClearButton: true
            }
        },
        {
            dataField: 'ptsId',
            label: { text: 'PTS ID' },
            editorType: 'dxTextBox',
            editorOptions: {
                placeholder: 'Enter PTS ID',
                showClearButton: true
            }
        },
        {
            dataField: 'startDate',
            label: { text: 'Start Date' },
            editorType: 'dxDateBox',
            editorOptions: {
                type: 'date',
                displayFormat: 'dd/MM/yyyy'
            }
        },
        {
            dataField: 'endDate',
            label: { text: 'End Date' },
            editorType: 'dxDateBox',
            editorOptions: {
                type: 'date',
                displayFormat: 'dd/MM/yyyy'
            }
        },
        {
            dataField: 'processedOnly',
            label: { text: 'Processing Status' },
            editorType: 'dxSelectBox',
            editorOptions: {
                dataSource: [
                    { value: null, text: 'All Transactions' },
                    { value: true, text: 'Processed Only' },
                    { value: false, text: 'Unprocessed Only' }
                ],
                displayExpr: 'text',
                valueExpr: 'value',
                placeholder: 'Select status'
            }
        }
    ], []);

    // Handle filter application
    const handleApplyFilters = useCallback(async () => {
        try {
            // Build filter object, excluding null/undefined values
            const filters = {};

            if (filterValues.vehicleId) filters.vehicleId = filterValues.vehicleId;
            if (filterValues.tankId) filters.tankId = filterValues.tankId;
            if (filterValues.ptsId && filterValues.ptsId.trim()) filters.ptsId = filterValues.ptsId.trim();
            if (filterValues.startDate) filters.startDate = filterValues.startDate;
            if (filterValues.endDate) filters.endDate = filterValues.endDate;
            if (filterValues.processedOnly !== null) filters.processedOnly = filterValues.processedOnly;

            // Validate at least one filter is provided
            if (Object.keys(filters).length === 0) {
                notify({
                    message: 'Please provide at least one filter parameter',
                    type: 'warning',
                    displayTime: 3000
                });
                return;
            }

            const result = await dispatch(fetchPumpTransactions(filters));

            if (result.success) {
                notify({
                    message: `Found ${result.data?.length || 0} pump transactions`,
                    type: 'success',
                    displayTime: 3000
                });
                setFilterPanelVisible(false);
            } else {
                notify({
                    message: result.message || 'Failed to fetch pump transactions',
                    type: 'error',
                    displayTime: 5000
                });
            }
        } catch (error) {
            notify({
                message: 'An error occurred while fetching transactions',
                type: 'error',
                displayTime: 5000
            });
        }
    }, [dispatch, filterValues]);

    // Handle filter reset
    const handleResetFilters = useCallback(() => {
        setFilterValues({
            vehicleId: null,
            tankId: null,
            ptsId: '',
            startDate: dateRange?.[0] || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: dateRange?.[1] || new Date(),
            processedOnly: null
        });
    }, [dateRange]);

    // Handle data refresh
    const handleRefresh = useCallback(async () => {
        if (pumpTransactionsFilters) {
            const result = await dispatch(fetchPumpTransactions(pumpTransactionsFilters));
            if (result.success) {
                notify({
                    message: 'Data refreshed successfully',
                    type: 'success',
                    displayTime: 2000
                });
            }
        }
    }, [dispatch, pumpTransactionsFilters]);

    // Handle data clear
    const handleClear = useCallback(() => {
        dispatch(clearPumpTransactions());
        notify({
            message: 'Pump transaction data cleared',
            type: 'info',
            displayTime: 2000
        });
    }, [dispatch]);

    // Handle data export
    const handleExport = useCallback(() => {
        notify({
            message: 'Export functionality triggered',
            type: 'info',
            displayTime: 2000
        });
    }, []);

    // Toolbar configuration
    const onToolbarPreparing = useCallback((e) => {
        e.toolbarOptions.items.unshift(
            {
                location: 'before',
                widget: 'dxButton',
                options: {
                    icon: 'filter',
                    text: 'Filters',
                    hint: 'Open filter panel',
                    onClick: () => setFilterPanelVisible(true)
                }
            },
            {
                location: 'before',
                widget: 'dxButton',
                options: {
                    icon: 'refresh',
                    text: 'Refresh',
                    hint: 'Refresh data',
                    disabled: !pumpTransactionsFilters,
                    onClick: handleRefresh
                }
            },
            {
                location: 'before',
                widget: 'dxButton',
                options: {
                    icon: 'exportxlsx',
                    text: 'Export',
                    hint: 'Export to Excel',
                    disabled: !pumpTransactions || pumpTransactions.length === 0,
                    onClick: handleExport
                }
            },
            {
                location: 'before',
                widget: 'dxButton',
                options: {
                    icon: 'clear',
                    text: 'Clear',
                    hint: 'Clear data',
                    onClick: handleClear
                }
            }
        );
    }, [handleRefresh, handleClear, handleExport, pumpTransactionsFilters, pumpTransactions]);

    // Calculate summary statistics
    const summaryStats = useMemo(() => {
        if (!pumpTransactions || pumpTransactions.length === 0) {
            return {
                totalTransactions: 0,
                totalVolume: 0,
                totalAmount: 0,
                processedCount: 0,
                pendingCount: 0,
                uniqueVehicles: 0,
                uniqueTanks: 0
            };
        }

        const processed = pumpTransactions.filter(t => t.hasBeenProcessed);
        const pending = pumpTransactions.filter(t => !t.hasBeenProcessed);
        const uniqueVehicles = new Set(pumpTransactions.filter(t => t.vehicleId).map(t => t.vehicleId));
        const uniqueTanks = new Set(pumpTransactions.filter(t => t.tankId).map(t => t.tankId));

        return {
            totalTransactions: pumpTransactions.length,
            totalVolume: pumpTransactions.reduce((sum, t) => sum + (t.volume || 0), 0),
            totalAmount: pumpTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
            processedCount: processed.length,
            pendingCount: pending.length,
            uniqueVehicles: uniqueVehicles.size,
            uniqueTanks: uniqueTanks.size
        };
    }, [pumpTransactions]);

    // Show error notification when error occurs
    useEffect(() => {
        if (pumpTransactionsError) {
            notify({
                message: pumpTransactionsError,
                type: 'error',
                displayTime: 5000
            });
        }
    }, [pumpTransactionsError]);

    return (
        <div className="pump-transaction-manager">
            {/* Header with summary information */}
            <div className="tw-mb-4 tw-p-4 tw-bg-gray-50 tw-rounded-lg">
                <div className="tw-flex tw-justify-between tw-items-center tw-mb-2">
                    <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
                        <i className="fa-light fa-gas-pump tw-mr-2"></i>
                        Pump Transactions
                    </h3>
                    <div className="tw-flex tw-gap-2">
                        <Button
                            text="Filter Transactions"
                            icon="filter"
                            type="default"
                            onClick={() => setFilterPanelVisible(true)}
                        />
                    </div>
                </div>

                <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-4 tw-gap-4 tw-text-sm tw-mb-4">
                    <div className="summary-card">
                        <div className="summary-value">{summaryStats.totalTransactions}</div>
                        <div className="summary-label">Total Transactions</div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-value">{summaryStats.totalVolume.toFixed(2)}L</div>
                        <div className="summary-label">Total Volume</div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-value">${summaryStats.totalAmount.toFixed(2)}</div>
                        <div className="summary-label">Total Amount</div>
                    </div>
                    <div className="summary-card">
                        <div className="tw-flex tw-justify-between tw-items-center">
                            <div>
                                <span className="tw-text-green-600 tw-font-semibold">{summaryStats.processedCount}</span>
                                <span className="tw-mx-1">/</span>
                                <span className="tw-text-yellow-600 tw-font-semibold">{summaryStats.pendingCount}</span>
                            </div>
                        </div>
                        <div className="summary-label">Processed / Pending</div>
                    </div>
                </div>

                <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4 tw-text-sm">
                    <div className="tw-flex tw-items-center tw-gap-2">
                        <span className="tw-text-gray-600">Unique Vehicles:</span>
                        <span className="tw-font-medium">{summaryStats.uniqueVehicles}</span>
                    </div>

                    <div className="tw-flex tw-items-center tw-gap-2">
                        <span className="tw-text-gray-600">Unique Tanks:</span>
                        <span className="tw-font-medium">{summaryStats.uniqueTanks}</span>
                    </div>

                    {pumpTransactionsLastFetch && (
                        <div className="tw-flex tw-items-center tw-gap-2">
                            <span className="tw-text-gray-600">Last Updated:</span>
                            <span className="tw-font-medium tw-text-xs">
                                {new Date(pumpTransactionsLastFetch).toLocaleString()}
                            </span>
                        </div>
                    )}
                </div>

                {pumpTransactionsFilters && (
                    <div className="tw-mt-3 tw-flex tw-items-center tw-gap-2">
                        <span className="tw-text-gray-600 tw-text-sm">Active Filters:</span>
                        <div className="tw-flex tw-flex-wrap tw-gap-1">
                            {Object.entries(pumpTransactionsFilters).map(([key, value]) => (
                                <span key={key} className="tw-px-2 tw-py-1 tw-bg-blue-100 tw-text-blue-800 tw-rounded tw-text-xs">
                                    {key}: {value instanceof Date ? value.toLocaleDateString() : String(value)}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* DataGrid */}
            <div className="tw-bg-white tw-rounded-lg tw-shadow-sm">
                <DataGrid
                    dataSource={pumpTransactions}
                    columns={columns}
                    loading={pumpTransactionsLoading}
                    showBorders={true}
                    showRowLines={true}
                    showColumnLines={true}
                    rowAlternationEnabled={true}
                    columnAutoWidth={true}
                    onToolbarPreparing={onToolbarPreparing}
                    filterRow={{ visible: true }}
                    headerFilter={{ visible: true }}
                    searchPanel={{ visible: true, width: 240, placeholder: "Search transactions..." }}
                    paging={{ pageSize: 20 }}
                    pager={{
                        visible: true,
                        allowedPageSizes: [10, 20, 50, 100],
                        showPageSizeSelector: true,
                        showInfo: true,
                        showNavigationButtons: true
                    }}
                    sorting={{ mode: 'multiple' }}
                    selection={{ mode: 'multiple' }}
                    export={{ enabled: true }}
                    columnChooser={{ enabled: true }}
                    stateStoring={{
                        enabled: true,
                        type: 'localStorage',
                        storageKey: 'pumpTransactionDataGrid'
                    }}
                    noDataText="No pump transactions found. Use filters to search for transactions."
                />
            </div>

            {/* Filter Panel Popup */}
            <Popup
                visible={filterPanelVisible}
                onHiding={() => setFilterPanelVisible(false)}
                dragEnabled={false}
                hideOnOutsideClick={true}
                showCloseButton={true}
                showTitle={true}
                title="Pump Transaction Filters"
                width="auto"
                height="auto"
                position={{ my: 'center', at: 'center', of: window }}
            >
                <div className="tw-p-6 tw-min-w-96">
                    {/* Quick Filter Buttons */}
                    <div className="tw-mb-6 tw-pb-4 tw-border-b tw-border-gray-200">
                        <div className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-3">Quick Filters:</div>
                        <div className="tw-flex tw-flex-wrap tw-gap-2">
                            <Button
                                text="Last 7 Days"
                                type="normal"
                                stylingMode="outlined"
                                onClick={() => {
                                    const endDate = new Date();
                                    const startDate = new Date();
                                    startDate.setDate(startDate.getDate() - 7);
                                    setFilterValues(prev => ({ ...prev, startDate, endDate }));
                                }}
                            />
                            <Button
                                text="Last 30 Days"
                                type="normal"
                                stylingMode="outlined"
                                onClick={() => {
                                    const endDate = new Date();
                                    const startDate = new Date();
                                    startDate.setDate(startDate.getDate() - 30);
                                    setFilterValues(prev => ({ ...prev, startDate, endDate }));
                                }}
                            />
                            <Button
                                text="Unprocessed Only"
                                type="normal"
                                stylingMode="outlined"
                                onClick={() => {
                                    setFilterValues(prev => ({ ...prev, processedOnly: false }));
                                }}
                            />
                            <Button
                                text="Today"
                                type="normal"
                                stylingMode="outlined"
                                onClick={() => {
                                    const today = new Date();
                                    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
                                    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
                                    setFilterValues(prev => ({ ...prev, startDate: startOfDay, endDate: endOfDay }));
                                }}
                            />
                        </div>
                    </div>

                    <Form
                        formData={filterValues}
                        onFieldDataChanged={(e) => {
                            setFilterValues(prev => ({
                                ...prev,
                                [e.dataField]: e.value
                            }));
                        }}
                        items={filterFormItems}
                        labelLocation="top"
                        colCount={1}
                        showColonAfterLabel={false}
                    />

                    <div className="tw-flex tw-justify-end tw-gap-3 tw-mt-6 tw-pt-4 tw-border-t tw-border-gray-200">
                        <Button
                            text="Reset"
                            type="normal"
                            onClick={handleResetFilters}
                        />
                        <Button
                            text="Cancel"
                            type="normal"
                            onClick={() => setFilterPanelVisible(false)}
                        />
                        <Button
                            text="Apply Filters"
                            type="default"
                            onClick={handleApplyFilters}
                        />
                    </div>
                </div>
            </Popup>
        </div>
    );
};

export default PumpTransactionManager;
