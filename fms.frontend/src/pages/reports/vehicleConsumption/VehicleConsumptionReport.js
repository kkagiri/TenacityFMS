import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Tabs from 'devextreme-react/tabs';
import DateBox from 'devextreme-react/date-box';
import SelectBox from 'devextreme-react/select-box';
import Button from 'devextreme-react/button';
import LoadIndicator from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';

import ConsumptionSummaryPanel from './components/ConsumptionSummaryPanel';
import ConsumptionDataGrid from './components/ConsumptionDataGrid';
import ConsumptionCharts from './components/ConsumptionCharts';

import { fetchConsumptionSummary, clearConsumptionSummary } from '../../../redux/actions/consumptionSummaryActions';
import { fetchSiteList } from '../../../redux/actions/siteActions';
import { fetchVehicleTypes } from '../../../redux/actions/vehicleTypeActions';

import './VehicleConsumptionReport.scss';

const VehicleConsumptionReport = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Redux state
    const { summaryData, loading, error } = useSelector((state) => state.consumptionSummary || {});
    const sites = useSelector((state) => state.site.sites);
    const vehicleTypes = useSelector((state) => state.vehicleType.vehicleTypes);

    // Local state
    const [activeTabIndex, setActiveTabIndex] = useState(0);
    const [loadedTabs, setLoadedTabs] = useState(new Set([0]));
    const [hasSearched, setHasSearched] = useState(false);

    // Filter state
    const [filters, setFilters] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
        endDate: new Date(),
        siteId: null,
        vehicleType: null,
        groupBy: 'week'
    });

    // Period options for grouping
    const periodOptions = [
        { value: 'week', text: 'Weekly' },
        { value: 'month', text: 'Monthly' },
        { value: 'quarter', text: 'Quarterly' },
        { value: 'year', text: 'Yearly' }
    ];

    // Tab data
    const tabData = [
        { text: "Summary", icon: "fa-light fa-chart-pie" },
        { text: "Data Grid", icon: "fa-light fa-table" },
        { text: "Charts", icon: "fa-light fa-chart-bar" }
    ];

    // Load initial data
    useEffect(() => {
        dispatch(fetchSiteList());
        dispatch(fetchVehicleTypes());

        return () => {
            dispatch(clearConsumptionSummary());
        };
    }, [dispatch]);

    // Handle error notifications
    useEffect(() => {
        if (error) {
            notify(`Error loading consumption data: ${error}`, 'error', 5000);
        }
    }, [error]);

    // Handle successful data load
    useEffect(() => {
        if (hasSearched && summaryData && !loading) {
            const vehicleCount = summaryData.overallSummary?.totalVehicles || 0;
            if (vehicleCount > 0) {
                notify(`Loaded consumption data for ${vehicleCount} vehicles`, 'success', 2000);
            } else {
                notify('No consumption data found for the selected filters', 'warning', 3000);
            }
        }
    }, [summaryData, loading, hasSearched]);

    // Fetch data handler
    const fetchData = useCallback(() => {
        if (filters.startDate && filters.endDate) {
            if (filters.startDate > filters.endDate) {
                notify('Start date cannot be after end date', 'error', 3000);
                return;
            }
            setHasSearched(true);
            dispatch(fetchConsumptionSummary(
                filters.startDate,
                filters.endDate,
                filters.siteId,
                filters.vehicleType,
                filters.groupBy
            ));
        }
    }, [dispatch, filters]);

    // Filter change handlers
    const handleFilterChange = useCallback((field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    // Tab change handler
    const handleTabSelectionChange = (e) => {
        const newIndex = e.itemIndex;
        setActiveTabIndex(newIndex);
        setLoadedTabs(prev => new Set([...prev, newIndex]));
    };

    // Navigate to vehicle details
    const handleVehicleClick = useCallback((vehicleId) => {
        const startDateStr = filters.startDate.toISOString().split('T')[0];
        const endDateStr = filters.endDate.toISOString().split('T')[0];
        navigate(`/reports/vehicle-consumption/details/${vehicleId}?startDate=${startDateStr}&endDate=${endDateStr}`);
    }, [navigate, filters]);

    // Custom tab item renderer
    const renderTabItem = (item) => {
        return (
            <div className="tw-flex tw-items-center tw-gap-2">
                <i className={item.icon}></i>
                <span>{item.text}</span>
            </div>
        );
    };

    // Render content based on active tab
    const renderContent = () => {
        if (!hasSearched) {
            return (
                <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-16 tw-text-gray-500">
                    <i className="fa-light fa-search tw-text-6xl tw-mb-4 tw-text-gray-300"></i>
                    <p className="tw-text-lg tw-mb-2">Select date range and click 'Apply' to load data</p>
                    <p className="tw-text-sm">Use filters to narrow down results by site or vehicle type</p>
                </div>
            );
        }

        switch (activeTabIndex) {
            case 0:
                return loadedTabs.has(0) && (
                    <ConsumptionSummaryPanel
                        summaryData={summaryData}
                        loading={loading}
                        onVehicleClick={handleVehicleClick}
                    />
                );
            case 1:
                return loadedTabs.has(1) && (
                    <ConsumptionDataGrid
                        summaryData={summaryData}
                        loading={loading}
                        onVehicleClick={handleVehicleClick}
                    />
                );
            case 2:
                return loadedTabs.has(2) && (
                    <ConsumptionCharts
                        summaryData={summaryData}
                        loading={loading}
                        groupBy={filters.groupBy}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="vehicle-consumption-report tw-relative tw-bg-gray-50 tw-min-h-full">
            {/* Loading overlay */}
            {loading && (
                <div className="tw-absolute tw-top-0 tw-left-0 tw-right-0 tw-bottom-0 tw-bg-white tw-bg-opacity-75 tw-flex tw-justify-center tw-items-center tw-z-40">
                    <div className="tw-text-center tw-bg-white tw-p-6 tw-rounded-lg tw-shadow-lg">
                        <LoadIndicator width={'48px'} height={'48px'} visible={true} />
                        <div className="tw-mt-4 tw-text-gray-600 tw-font-medium">
                            Loading consumption data...
                        </div>
                    </div>
                </div>
            )}

            <div className="tw-p-4">
                {/* Filters Section */}
                <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-p-4 tw-mb-4">
                    <div className="tw-flex tw-flex-wrap tw-items-end tw-gap-4">
                        {/* Date Range */}
                        <div className="tw-flex tw-items-center tw-gap-2">
                            <div>
                                <label className="tw-block tw-text-xs tw-text-gray-500 tw-mb-1">Start Date</label>
                                <DateBox
                                    value={filters.startDate}
                                    onValueChanged={(e) => handleFilterChange('startDate', e.value)}
                                    type="date"
                                    width={150}
                                    stylingMode="outlined"
                                />
                            </div>
                            <span className="tw-text-gray-400 tw-pt-5">to</span>
                            <div>
                                <label className="tw-block tw-text-xs tw-text-gray-500 tw-mb-1">End Date</label>
                                <DateBox
                                    value={filters.endDate}
                                    onValueChanged={(e) => handleFilterChange('endDate', e.value)}
                                    type="date"
                                    width={150}
                                    stylingMode="outlined"
                                />
                            </div>
                        </div>

                        {/* Site Filter */}
                        <div>
                            <label className="tw-block tw-text-xs tw-text-gray-500 tw-mb-1">Site</label>
                            <SelectBox
                                items={[{ id: null, name: 'All Sites' }, ...(sites || [])]}
                                displayExpr="name"
                                valueExpr="id"
                                value={filters.siteId}
                                onValueChanged={(e) => handleFilterChange('siteId', e.value)}
                                width={180}
                                stylingMode="outlined"
                                placeholder="Select Site"
                            />
                        </div>

                        {/* Vehicle Type Filter */}
                        <div>
                            <label className="tw-block tw-text-xs tw-text-gray-500 tw-mb-1">Vehicle Type</label>
                            <SelectBox
                                items={[{ name: null, displayName: 'All Types' }, ...(vehicleTypes || []).map(t => ({ name: t.name, displayName: t.name }))]}
                                displayExpr="displayName"
                                valueExpr="name"
                                value={filters.vehicleType}
                                onValueChanged={(e) => handleFilterChange('vehicleType', e.value)}
                                width={160}
                                stylingMode="outlined"
                                placeholder="Select Type"
                            />
                        </div>

                        {/* Period Grouping */}
                        <div>
                            <label className="tw-block tw-text-xs tw-text-gray-500 tw-mb-1">Group By</label>
                            <SelectBox
                                items={periodOptions}
                                displayExpr="text"
                                valueExpr="value"
                                value={filters.groupBy}
                                onValueChanged={(e) => handleFilterChange('groupBy', e.value)}
                                width={120}
                                stylingMode="outlined"
                            />
                        </div>

                        {/* Apply Button */}
                        <div className="tw-pt-5">
                            <Button
                                text={loading ? "Loading..." : "Apply"}
                                onClick={fetchData}
                                type="default"
                                stylingMode="contained"
                                disabled={loading}
                                icon={loading ? 'loading' : 'search'}
                            />
                        </div>

                        {/* Refresh Button */}
                        {hasSearched && (
                            <div className="tw-pt-5">
                                <Button
                                    icon="refresh"
                                    text="Refresh"
                                    stylingMode="text"
                                    onClick={fetchData}
                                    disabled={loading}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-overflow-hidden">
                    {/* Tabs Navigation */}
                    <Tabs
                        dataSource={tabData}
                        selectedIndex={activeTabIndex}
                        onItemClick={handleTabSelectionChange}
                        width="100%"
                        className="tw-mb-0"
                        itemRender={renderTabItem}
                    />

                    {/* Tab Content */}
                    <div className="tw-p-4 tw-min-h-[500px]">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VehicleConsumptionReport;
