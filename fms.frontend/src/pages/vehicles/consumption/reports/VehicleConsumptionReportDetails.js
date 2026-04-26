import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Button from 'devextreme-react/button';
import LoadIndicator from 'devextreme-react/load-indicator';
import DateBox from 'devextreme-react/date-box';
import DataGrid, {
    Column,
    Paging,
    HeaderFilter,
    Export,
    Summary,
    TotalItem
} from 'devextreme-react/data-grid';
import {
    Chart,
    Series,
    CommonSeriesSettings,
    Legend,
    ArgumentAxis,
    ValueAxis,
    Tooltip,
    Title,
    Label
} from 'devextreme-react/chart';
import notify from 'devextreme/ui/notify';

import { fetchVehicleConsumptionDetail, clearVehicleConsumptionDetail } from '../../../../redux/actions/consumptionSummaryActions';

import './VehicleConsumptionReportDetails.scss';

const VehicleConsumptionDetails = () => {
    const { vehicleId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Get dates from URL params or use defaults
    const [startDate, setStartDate] = useState(() => {
        const urlStartDate = searchParams.get('startDate');
        return urlStartDate ? new Date(urlStartDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    });
    const [endDate, setEndDate] = useState(() => {
        const urlEndDate = searchParams.get('endDate');
        return urlEndDate ? new Date(urlEndDate) : new Date();
    });

    // Redux state
    const { vehicleDetail, detailLoading, detailError } = useSelector((state) => state.consumptionSummary || {});

    // Fetch vehicle detail on mount and when dates change
    useEffect(() => {
        if (vehicleId) {
            dispatch(fetchVehicleConsumptionDetail(vehicleId, startDate, endDate));
        }

        return () => {
            dispatch(clearVehicleConsumptionDetail());
        };
    }, [dispatch, vehicleId, startDate, endDate]);

    // Handle errors
    useEffect(() => {
        if (detailError) {
            notify(`Error loading vehicle details: ${detailError}`, 'error', 5000);
        }
    }, [detailError]);

    // Navigate back
    const handleBack = useCallback(() => {
        navigate('/reports/vehicle-consumption');
    }, [navigate]);

    // Refresh data
    const handleRefresh = useCallback(() => {
        if (vehicleId) {
            dispatch(fetchVehicleConsumptionDetail(vehicleId, startDate, endDate));
        }
    }, [dispatch, vehicleId, startDate, endDate]);

    // Format number
    const formatNumber = (num, decimals = 0) => {
        if (num === null || num === undefined) return '0';
        return Number(num).toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    };

    // Render loading state
    if (detailLoading) {
        return (
            <div className="tw-flex tw-justify-center tw-items-center tw-min-h-screen">
                <div className="tw-text-center">
                    <LoadIndicator width={48} height={48} />
                    <div className="tw-mt-4 tw-text-gray-600">Loading vehicle details...</div>
                </div>
            </div>
        );
    }

    // Render not found state
    if (!vehicleDetail && !detailLoading) {
        return (
            <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-min-h-screen">
                <i className="fa-light fa-truck-slash tw-text-6xl tw-text-gray-300 tw-mb-4"></i>
                <h2 className="tw-text-xl tw-text-gray-600 tw-mb-2">Vehicle Not Found</h2>
                <p className="tw-text-gray-500 tw-mb-4">The requested vehicle could not be found or has no consumption data.</p>
                <Button text="Go Back" icon="back" onClick={handleBack} />
            </div>
        );
    }

    const detail = vehicleDetail || {};
    const consumptionUnit = detail.isKmPerLiter ? 'km/L' : 'L/hr';

    return (
        <div className="vehicle-consumption-details tw-min-h-full tw-bg-gray-50 tw-p-4">
            {/* Header */}
            <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-p-4 tw-mb-4">
                <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-4">
                    <div className="tw-flex tw-items-center tw-gap-4">
                        <Button icon="back" onClick={handleBack} stylingMode="text" hint="Go Back" />
                        <div>
                            <h1 className="tw-text-xl tw-font-bold tw-text-gray-800 tw-flex tw-items-center tw-gap-2">
                                <i className="fa-light fa-truck tw-text-purple-600"></i>
                                {detail.vehicleCode || 'Vehicle'}
                            </h1>
                            <p className="tw-text-sm tw-text-gray-500">
                                {detail.manufacturer} {detail.vehicleModel} | {detail.vehicleType}
                            </p>
                        </div>
                    </div>

                    {/* Date Filter */}
                    <div className="tw-flex tw-items-center tw-gap-3">
                        <div className="tw-flex tw-items-center tw-gap-2">
                            <DateBox
                                value={startDate}
                                onValueChanged={(e) => setStartDate(e.value)}
                                type="date"
                                width={130}
                                stylingMode="outlined"
                            />
                            <span className="tw-text-gray-400">to</span>
                            <DateBox
                                value={endDate}
                                onValueChanged={(e) => setEndDate(e.value)}
                                type="date"
                                width={130}
                                stylingMode="outlined"
                            />
                        </div>
                        <Button icon="refresh" onClick={handleRefresh} stylingMode="text" hint="Refresh" />
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 lg:tw-grid-cols-6 tw-gap-4 tw-mb-4">
                <div className="detail-metric-card">
                    <div className="metric-icon tw-bg-purple-100 tw-text-purple-600">
                        <i className="fa-solid fa-gas-pump"></i>
                    </div>
                    <div className="metric-content">
                        <div className="metric-value">{formatNumber(detail.totalFuelConsumed)}</div>
                        <div className="metric-label">Total Fuel (L)</div>
                    </div>
                </div>

                <div className="detail-metric-card">
                    <div className="metric-icon tw-bg-green-100 tw-text-green-600">
                        <i className="fa-solid fa-road"></i>
                    </div>
                    <div className="metric-content">
                        <div className="metric-value">{formatNumber(detail.totalDistance)}</div>
                        <div className="metric-label">Distance (km)</div>
                    </div>
                </div>

                <div className="detail-metric-card">
                    <div className="metric-icon tw-bg-blue-100 tw-text-blue-600">
                        <i className="fa-solid fa-clock"></i>
                    </div>
                    <div className="metric-content">
                        <div className="metric-value">{formatNumber(detail.totalEngineHours, 1)}</div>
                        <div className="metric-label">Engine Hours</div>
                    </div>
                </div>

                <div className="detail-metric-card">
                    <div className="metric-icon tw-bg-amber-100 tw-text-amber-600">
                        <i className="fa-solid fa-gauge-high"></i>
                    </div>
                    <div className="metric-content">
                        <div className="metric-value">{formatNumber(detail.averageConsumption, 2)}</div>
                        <div className="metric-label">{consumptionUnit}</div>
                    </div>
                </div>

                <div className="detail-metric-card">
                    <div className="metric-icon tw-bg-rose-100 tw-text-rose-600">
                        <i className="fa-solid fa-fill-drip"></i>
                    </div>
                    <div className="metric-content">
                        <div className="metric-value">{detail.refillHistory?.length || 0}</div>
                        <div className="metric-label">Refills</div>
                    </div>
                </div>

                <div className="detail-metric-card">
                    <div className="metric-icon tw-bg-indigo-100 tw-text-indigo-600">
                        <i className="fa-solid fa-location-dot"></i>
                    </div>
                    <div className="metric-content">
                        <div className="metric-value tw-text-sm">{detail.workingSiteName || '-'}</div>
                        <div className="metric-label">Site</div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-4 tw-mb-4">
                {/* Fuel Consumption Chart */}
                <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-p-4">
                    <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4 tw-flex tw-items-center tw-gap-2">
                        <i className="fa-light fa-chart-area tw-text-purple-600"></i>
                        Fuel Consumption Over Time
                    </h3>
                    {detail.dailyConsumption && detail.dailyConsumption.length > 0 ? (
                        <Chart dataSource={detail.dailyConsumption} height={300}>
                            <CommonSeriesSettings argumentField="date" type="area" />
                            <Series
                                valueField="fuelConsumed"
                                name="Fuel (L)"
                                color="#8b5cf6"
                            />
                            <ArgumentAxis>
                                <Label format="dd/MM" overlappingBehavior="rotate" rotationAngle={-45} />
                            </ArgumentAxis>
                            <ValueAxis>
                                <Title text="Liters" />
                            </ValueAxis>
                            <Tooltip enabled={true} />
                            <Legend visible={false} />
                        </Chart>
                    ) : (
                        <div className="tw-text-center tw-py-12 tw-text-gray-400">
                            <i className="fa-light fa-chart-area tw-text-4xl tw-mb-2"></i>
                            <p>No daily consumption data available</p>
                        </div>
                    )}
                </div>

                {/* Consumption Rate Chart */}
                <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-p-4">
                    <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4 tw-flex tw-items-center tw-gap-2">
                        <i className="fa-light fa-gauge tw-text-green-600"></i>
                        Consumption Rate ({consumptionUnit})
                    </h3>
                    {detail.dailyConsumption && detail.dailyConsumption.length > 0 ? (
                        <Chart dataSource={detail.dailyConsumption} height={300}>
                            <CommonSeriesSettings argumentField="date" type="spline" />
                            <Series
                                valueField="consumption"
                                name={`Consumption (${consumptionUnit})`}
                                color="#10b981"
                            />
                            <ArgumentAxis>
                                <Label format="dd/MM" overlappingBehavior="rotate" rotationAngle={-45} />
                            </ArgumentAxis>
                            <ValueAxis>
                                <Title text={consumptionUnit} />
                            </ValueAxis>
                            <Tooltip enabled={true} />
                            <Legend visible={false} />
                        </Chart>
                    ) : (
                        <div className="tw-text-center tw-py-12 tw-text-gray-400">
                            <i className="fa-light fa-gauge tw-text-4xl tw-mb-2"></i>
                            <p>No consumption rate data available</p>
                        </div>
                    )}
                </div>
            </div>

            {/* GPS Data Placeholder */}
            <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-p-4 tw-mb-4">
                <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4 tw-flex tw-items-center tw-gap-2">
                    <i className="fa-light fa-satellite tw-text-blue-600"></i>
                    GPS Tracking Data
                    <span className="tw-text-xs tw-bg-yellow-100 tw-text-yellow-700 tw-px-2 tw-py-1 tw-rounded-full">
                        Coming Soon
                    </span>
                </h3>
                <div className="tw-bg-gray-50 tw-rounded-lg tw-p-8 tw-text-center">
                    <i className="fa-light fa-map-location-dot tw-text-5xl tw-text-gray-300 tw-mb-4"></i>
                    <h4 className="tw-text-gray-600 tw-font-medium tw-mb-2">GPS Data Integration</h4>
                    <p className="tw-text-gray-500 tw-text-sm tw-max-w-md tw-mx-auto">
                        GPS tracking data from the VehicleTrackingController will be displayed here,
                        including real-time location, route history, and odometer data.
                    </p>
                    <div className="tw-mt-4 tw-grid tw-grid-cols-3 tw-gap-4 tw-max-w-md tw-mx-auto">
                        <div className="tw-bg-white tw-rounded tw-p-3">
                            <i className="fa-light fa-location-crosshairs tw-text-gray-400 tw-text-xl"></i>
                            <div className="tw-text-xs tw-text-gray-500 tw-mt-1">Location</div>
                        </div>
                        <div className="tw-bg-white tw-rounded tw-p-3">
                            <i className="fa-light fa-route tw-text-gray-400 tw-text-xl"></i>
                            <div className="tw-text-xs tw-text-gray-500 tw-mt-1">Routes</div>
                        </div>
                        <div className="tw-bg-white tw-rounded tw-p-3">
                            <i className="fa-light fa-tachometer-alt tw-text-gray-400 tw-text-xl"></i>
                            <div className="tw-text-xs tw-text-gray-500 tw-mt-1">Odometer</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Refill History Grid */}
            <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-p-4">
                <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4 tw-flex tw-items-center tw-gap-2">
                    <i className="fa-light fa-list tw-text-amber-600"></i>
                    Refill History
                </h3>
                {detail.refillHistory && detail.refillHistory.length > 0 ? (
                    <DataGrid
                        dataSource={detail.refillHistory}
                        keyExpr="id"
                        showBorders={true}
                        showRowLines={true}
                        rowAlternationEnabled={true}
                        height={400}
                    >
                        <Paging defaultPageSize={10} />
                        <HeaderFilter visible={true} />
                        <Export enabled={true} formats={['xlsx']} />

                        <Column dataField="date" caption="Date" dataType="date" format="dd/MM/yyyy HH:mm" width={150} />
                        <Column dataField="fuelAmount" caption="Fuel (L)" dataType="number" format="#,##0.0" width={100} />
                        <Column dataField="previousMeterReading" caption="Prev Reading" dataType="number" format="#,##0.0" width={120} />
                        <Column dataField="currentMeterReading" caption="Curr Reading" dataType="number" format="#,##0.0" width={120} />
                        <Column dataField="distanceOrEngineHours" caption="Diff" dataType="number" format="#,##0.0" width={100} />
                        <Column dataField="consumption" caption={consumptionUnit} dataType="number" format="#0.00" width={100} />
                        <Column dataField="siteName" caption="Site" width={150} />
                        <Column dataField="driverName" caption="Driver" width={150} />
                        <Column dataField="fuelBy" caption="Fuel By" width={120} />
                        <Column dataField="comment" caption="Comment" minWidth={150} />

                        <Summary>
                            <TotalItem column="fuelAmount" summaryType="sum" displayFormat="Total: {0} L" valueFormat="#,##0.0" />
                            <TotalItem column="id" summaryType="count" displayFormat="Total: {0} refills" />
                        </Summary>
                    </DataGrid>
                ) : (
                    <div className="tw-text-center tw-py-12 tw-text-gray-400">
                        <i className="fa-light fa-list tw-text-4xl tw-mb-2"></i>
                        <p>No refill history available for this period</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VehicleConsumptionDetails;
