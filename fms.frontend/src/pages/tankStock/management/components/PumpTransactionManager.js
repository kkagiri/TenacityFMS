import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DataGrid } from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { ScrollView } from 'devextreme-react/scroll-view';
import { SelectBox, TagBox } from 'devextreme-react';
import notify from 'devextreme/ui/notify';
import { useStockFilters } from '../../shared/context/StockFilterContext';
import {
    fetchPumpTransactions,
    clearPumpTransactions
} from '../../../../redux/actions/consumptionActions';
import { fetchVehicleList } from '../../../../redux/actions/vehicleActions';
import { fetchPTSDeviceList } from '../../../../redux/actions/ptsActions/ptsDeviceActions';
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

    // Get vehicles and PTS devices from Redux
    const vehicles = useSelector(state => state.vehicle?.vehicles || []);
    const ptsDevices = useSelector(state => state.pts?.ptsDeviceList || []);

    // Get filters from shared context (header filters)
    const { startDate: headerStartDate, endDate: headerEndDate, selectedSiteIds, selectedTankIds } = useStockFilters();

    // Filter panel state - only tab-specific filters (no dates, sites, tanks)
    const [filterPanelVisible, setFilterPanelVisible] = useState(false);
    const [filterValues, setFilterValues] = useState({
        vehicleIds: [],
        ptsIds: [],
        processedOnly: null
    });

    // Load vehicles and PTS devices on mount
    useEffect(() => {
        dispatch(fetchVehicleList());
        dispatch(fetchPTSDeviceList());
    }, [dispatch]);

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

    // Processing status options
    const processingStatusOptions = useMemo(() => [
        { value: null, text: 'All Transactions' },
        { value: true, text: 'Processed Only' },
        { value: false, text: 'Unprocessed Only' }
    ], []);

    // Handle filter application - uses header filters + tab-specific filters
    const handleApplyFilters = useCallback(async () => {
        try {
            // Build filter object using header filters + tab-specific filters
            const filters = {};

            // Header filters
            if (headerStartDate) filters.startDate = headerStartDate;
            if (headerEndDate) filters.endDate = headerEndDate;
            if (selectedSiteIds && selectedSiteIds.length > 0) {
                filters.siteIds = selectedSiteIds;
            }
            if (selectedTankIds && selectedTankIds.length > 0) {
                filters.tankIds = selectedTankIds;
            }

            // Tab-specific filters - now arrays
            if (filterValues.vehicleIds && filterValues.vehicleIds.length > 0) {
                filters.vehicleIds = filterValues.vehicleIds;
            }
            if (filterValues.ptsIds && filterValues.ptsIds.length > 0) {
                filters.ptsIds = filterValues.ptsIds;
            }
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
    }, [dispatch, filterValues, headerStartDate, headerEndDate, selectedSiteIds, selectedTankIds]);

    // Handle filter reset - only resets tab-specific filters
    const handleResetFilters = useCallback(() => {
        setFilterValues({
            vehicleIds: [],
            ptsIds: [],
            processedOnly: null
        });
    }, []);

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

    // React to header filter changes and reload data
    useEffect(() => {
        if (pumpTransactionsFilters && (headerStartDate || headerEndDate || selectedSiteIds || selectedTankIds)) {
            // Automatically refresh data when header filters change
            const filters = { ...pumpTransactionsFilters };

            // Update with new header filters
            if (headerStartDate) filters.startDate = headerStartDate;
            if (headerEndDate) filters.endDate = headerEndDate;
            if (selectedSiteIds && selectedSiteIds.length > 0) {
                filters.siteIds = selectedSiteIds;
            }
            if (selectedTankIds && selectedTankIds.length > 0) {
                filters.tankIds = selectedTankIds;
            }

            dispatch(fetchPumpTransactions(filters));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [headerStartDate, headerEndDate, selectedSiteIds, selectedTankIds]);

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
                            text={filterPanelVisible ? "Hide Filters" : "Show Filters"}
                            icon={filterPanelVisible ? "fa-light fa-chevron-up" : "fa-light fa-filter"}
                            type="default"
                            stylingMode="outlined"
                            onClick={() => setFilterPanelVisible(!filterPanelVisible)}
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

            {/* Inline Filter Panel - Collapsible */}
            {filterPanelVisible && (
                <div className="tw-mb-4 tw-p-4 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg">
                    <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
                        <h4 className="tw-text-md tw-font-semibold tw-text-gray-800">
                            <i className="fa-light fa-filter tw-mr-2"></i>
                            Additional Filters
                        </h4>
                        <Button
                            icon="fa-light fa-times"
                            stylingMode="text"
                            onClick={() => setFilterPanelVisible(false)}
                            hint="Close filter panel"
                        />
                    </div>

                    <ScrollView height="auto" width="100%" showScrollbar="onScroll">
                        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4 tw-mb-4">
                            {/* Vehicle Filter - Multi-select with search */}
                            <div>
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                                    Vehicles
                                </label>
                                <TagBox
                                    value={filterValues.vehicleIds}
                                    onValueChanged={(e) => setFilterValues(prev => ({ ...prev, vehicleIds: e.value }))}
                                    dataSource={vehicles}
                                    displayExpr="registrationNumber"
                                    valueExpr="id"
                                    placeholder="Select vehicles"
                                    showClearButton={true}
                                    searchEnabled={true}
                                    width="100%"
                                    noDataText="No vehicles available"
                                />
                            </div>

                            {/* PTS Device Filter - Multi-select with search */}
                            <div>
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                                    PTS Devices
                                </label>
                                <TagBox
                                    value={filterValues.ptsIds}
                                    onValueChanged={(e) => setFilterValues(prev => ({ ...prev, ptsIds: e.value }))}
                                    dataSource={ptsDevices}
                                    displayExpr="ptsId"
                                    valueExpr="ptsId"
                                    placeholder="Select PTS devices"
                                    showClearButton={true}
                                    searchEnabled={true}
                                    width="100%"
                                    noDataText="No PTS devices available"
                                />
                            </div>

                            {/* Processing Status Filter */}
                            <div>
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                                    Processing Status
                                </label>
                                <SelectBox
                                    value={filterValues.processedOnly}
                                    onValueChanged={(e) => setFilterValues(prev => ({ ...prev, processedOnly: e.value }))}
                                    dataSource={processingStatusOptions}
                                    displayExpr="text"
                                    valueExpr="value"
                                    placeholder="Select status"
                                    width="100%"
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="tw-flex tw-justify-end tw-gap-3">
                            <Button
                                text="Reset"
                                type="normal"
                                stylingMode="outlined"
                                onClick={handleResetFilters}
                            />
                            <Button
                                text="Apply Filters"
                                type="default"
                                stylingMode="contained"
                                onClick={handleApplyFilters}
                            />
                        </div>
                    </ScrollView>
                </div>
            )}

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
        </div>
    );
};

export default PumpTransactionManager;
