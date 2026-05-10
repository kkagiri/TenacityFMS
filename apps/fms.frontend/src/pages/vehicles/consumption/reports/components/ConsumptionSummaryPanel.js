import React from 'react';
import LoadIndicator from 'devextreme-react/load-indicator';

const ConsumptionSummaryPanel = ({ summaryData, loading, onVehicleClick }) => {
    if (loading) {
        return (
            <div className="tw-flex tw-justify-center tw-items-center tw-py-16">
                <LoadIndicator width={48} height={48} />
            </div>
        );
    }

    if (!summaryData || !summaryData.overallSummary) {
        return (
            <div className="empty-state">
                <i className="fa-light fa-chart-pie"></i>
                <h3>No Data Available</h3>
                <p>Apply filters and search to view consumption summary</p>
            </div>
        );
    }

    const { overallSummary, siteSummaries } = summaryData;

    // Format number with commas
    const formatNumber = (num, decimals = 0) => {
        if (num === null || num === undefined) return '0';
        return Number(num).toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    };

    return (
        <div className="consumption-summary-panel">
            {/* Overall Summary Cards */}
            <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-3 lg:tw-grid-cols-6 tw-gap-4 tw-mb-6">
                {/* Total Fuel */}
                <div className="consumption-summary-card">
                    <div className="tw-flex tw-items-start tw-justify-between">
                        <div>
                            <div className="card-value">{formatNumber(overallSummary.totalFuelConsumed)}</div>
                            <div className="card-label">Total Fuel (L)</div>
                        </div>
                        <div className="card-icon fuel">
                            <i className="fa-solid fa-gas-pump"></i>
                        </div>
                    </div>
                </div>

                {/* Total Distance */}
                <div className="consumption-summary-card">
                    <div className="tw-flex tw-items-start tw-justify-between">
                        <div>
                            <div className="card-value">{formatNumber(overallSummary.totalDistance)}</div>
                            <div className="card-label">Distance (km)</div>
                        </div>
                        <div className="card-icon distance">
                            <i className="fa-solid fa-road"></i>
                        </div>
                    </div>
                </div>

                {/* Total Engine Hours */}
                <div className="consumption-summary-card">
                    <div className="tw-flex tw-items-start tw-justify-between">
                        <div>
                            <div className="card-value">{formatNumber(overallSummary.totalEngineHours, 1)}</div>
                            <div className="card-label">Engine Hours</div>
                        </div>
                        <div className="card-icon efficiency">
                            <i className="fa-solid fa-clock"></i>
                        </div>
                    </div>
                </div>

                {/* Total Vehicles */}
                <div className="consumption-summary-card">
                    <div className="tw-flex tw-items-start tw-justify-between">
                        <div>
                            <div className="card-value">{formatNumber(overallSummary.totalVehicles)}</div>
                            <div className="card-label">Vehicles</div>
                        </div>
                        <div className="card-icon vehicles">
                            <i className="fa-solid fa-truck"></i>
                        </div>
                    </div>
                </div>

                {/* Total Sites */}
                <div className="consumption-summary-card">
                    <div className="tw-flex tw-items-start tw-justify-between">
                        <div>
                            <div className="card-value">{formatNumber(overallSummary.totalSites)}</div>
                            <div className="card-label">Sites</div>
                        </div>
                        <div className="card-icon sites">
                            <i className="fa-solid fa-location-dot"></i>
                        </div>
                    </div>
                </div>

                {/* Total Refills */}
                <div className="consumption-summary-card">
                    <div className="tw-flex tw-items-start tw-justify-between">
                        <div>
                            <div className="card-value">{formatNumber(overallSummary.totalRefills)}</div>
                            <div className="card-label">Refills</div>
                        </div>
                        <div className="card-icon refills">
                            <i className="fa-solid fa-fill-drip"></i>
                        </div>
                    </div>
                </div>
            </div>

            {/* Average Metrics Row */}
            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4 tw-mb-6">
                <div className="tw-bg-gradient-to-r tw-from-purple-500 tw-to-indigo-600 tw-rounded-xl tw-p-5 tw-text-white">
                    <div className="tw-flex tw-items-center tw-justify-between">
                        <div>
                            <div className="tw-text-3xl tw-font-bold">
                                {formatNumber(overallSummary.averageConsumption, 2)}
                            </div>
                            <div className="tw-text-purple-100 tw-text-sm tw-mt-1">
                                Average Consumption
                            </div>
                        </div>
                        <div className="tw-text-purple-200 tw-text-4xl">
                            <i className="fa-light fa-gauge-high"></i>
                        </div>
                    </div>
                    <div className="tw-mt-3 tw-text-xs tw-text-purple-200">
                        km/L or L/hr depending on vehicle type
                    </div>
                </div>

                <div className="tw-bg-gradient-to-r tw-from-emerald-500 tw-to-teal-600 tw-rounded-xl tw-p-5 tw-text-white">
                    <div className="tw-flex tw-items-center tw-justify-between">
                        <div>
                            <div className="tw-text-3xl tw-font-bold">
                                {formatNumber(overallSummary.averageEfficiency, 2)}
                            </div>
                            <div className="tw-text-emerald-100 tw-text-sm tw-mt-1">
                                Average Efficiency
                            </div>
                        </div>
                        <div className="tw-text-emerald-200 tw-text-4xl">
                            <i className="fa-light fa-leaf"></i>
                        </div>
                    </div>
                    <div className="tw-mt-3 tw-text-xs tw-text-emerald-200">
                        Overall fleet efficiency rating
                    </div>
                </div>
            </div>

            {/* Site Summary Cards */}
            <div className="tw-mb-4">
                <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-3 tw-flex tw-items-center tw-gap-2">
                    <i className="fa-light fa-building tw-text-purple-600"></i>
                    Consumption by Site
                </h3>
            </div>

            {siteSummaries && siteSummaries.length > 0 ? (
                <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-4">
                    {siteSummaries.map((site) => (
                        <div
                            key={site.siteId}
                            className="site-summary-card"
                            onClick={() => {
                                // Expand to show vehicles or navigate
                            }}
                        >
                            <div className="site-header">
                                <span className="site-name">{site.siteName}</span>
                                <span className="vehicle-count">{site.vehicleCount} vehicles</span>
                            </div>
                            <div className="site-metrics">
                                <div className="metric">
                                    <div className="metric-value">{formatNumber(site.totalFuelConsumed)}</div>
                                    <div className="metric-label">Fuel (L)</div>
                                </div>
                                <div className="metric">
                                    <div className="metric-value">{site.refillCount}</div>
                                    <div className="metric-label">Refills</div>
                                </div>
                                <div className="metric">
                                    <div className="metric-value">{formatNumber(site.averageConsumption, 1)}</div>
                                    <div className="metric-label">Avg Cons.</div>
                                </div>
                            </div>

                            {/* Top 3 vehicles in this site */}
                            {site.vehicles && site.vehicles.length > 0 && (
                                <div className="tw-mt-3 tw-pt-3 tw-border-t tw-border-gray-100">
                                    <div className="tw-text-xs tw-text-gray-500 tw-mb-2">Top Vehicles</div>
                                    {site.vehicles.slice(0, 3).map((vehicle) => (
                                        <div
                                            key={vehicle.vehicleId}
                                            className="tw-flex tw-justify-between tw-items-center tw-py-1 tw-text-sm tw-cursor-pointer hover:tw-bg-gray-50 tw-rounded tw-px-1"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onVehicleClick(vehicle.vehicleId);
                                            }}
                                        >
                                            <span className="tw-text-gray-700">{vehicle.vehicleCode}</span>
                                            <span className="tw-text-gray-500 tw-text-xs">
                                                {formatNumber(vehicle.totalFuelConsumed)} L
                                            </span>
                                        </div>
                                    ))}
                                    {site.vehicles.length > 3 && (
                                        <div className="tw-text-xs tw-text-purple-600 tw-mt-1">
                                            +{site.vehicles.length - 3} more vehicles
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="tw-text-center tw-py-8 tw-text-gray-500">
                    <i className="fa-light fa-building tw-text-4xl tw-mb-2 tw-text-gray-300"></i>
                    <p>No site data available</p>
                </div>
            )}
        </div>
    );
};

export default ConsumptionSummaryPanel;
