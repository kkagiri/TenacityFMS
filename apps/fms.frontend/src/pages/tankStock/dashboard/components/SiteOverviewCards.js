import React from 'react';
import PropTypes from 'prop-types';
import StockMetricCard from '../../shared/components/StockMetricCard';

//Cursor - Site Overview Cards component for site-wise metrics (Phase 1 placeholder)
const SiteOverviewCards = ({ siteMetrics = {}, selectedSite }) => {
  const sitesToDisplay = selectedSite === 'all'
    ? Object.values(siteMetrics)
    : Object.values(siteMetrics).filter(site => site.siteId === selectedSite);

  if (sitesToDisplay.length === 0) {
    return (
      <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-6">
        <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800 tw-mb-4">
          <i className="fa-light fa-building tw-mr-2 tw-text-blue-600"></i>
          Site Overview
        </h2>
        <div className="tw-text-gray-500 tw-text-center tw-py-8">
          No site data available
        </div>
      </div>
    );
  }

  const getOverallMetrics = () => {
    if (selectedSite !== 'all') {
      return sitesToDisplay[0];
    }

    return sitesToDisplay.reduce((acc, site) => ({
      totalCapacity: acc.totalCapacity + site.totalCapacity,
      currentStock: acc.currentStock + site.currentStock,
      tankCount: acc.tankCount + site.tankCount,
      criticalTanks: acc.criticalTanks + site.criticalTanks
    }), { totalCapacity: 0, currentStock: 0, tankCount: 0, criticalTanks: 0 });
  };

  const overallMetrics = getOverallMetrics();
  const overallFillPercentage = overallMetrics.totalCapacity > 0
    ? (overallMetrics.currentStock / overallMetrics.totalCapacity) * 100
    : 0;

  return (
    <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-6">
      <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800 tw-mb-6">
        <i className="fa-light fa-building tw-mr-2 tw-text-blue-600"></i>
        Site Overview
      </h2>

      {/* Overall Metrics */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4 tw-mb-6">
        <StockMetricCard
          title="Total Capacity"
          value={overallMetrics.totalCapacity}
          unit="L"
          icon="fa-light fa-gas-pump"
          status="normal"
        />
        <StockMetricCard
          title="Current Stock"
          value={overallMetrics.currentStock}
          unit="L"
          icon="fa-light fa-droplet"
          status={overallFillPercentage < 30 ? 'warning' : 'normal'}
        />
        <StockMetricCard
          title="Fill Percentage"
          value={overallFillPercentage.toFixed(1)}
          unit="%"
          icon="fa-light fa-gauge"
          status={overallFillPercentage < 30 ? 'warning' : overallFillPercentage < 15 ? 'critical' : 'normal'}
        />
        <StockMetricCard
          title="Critical Tanks"
          value={overallMetrics.criticalTanks}
          unit={`of ${overallMetrics.tankCount}`}
          icon="fa-light fa-exclamation-triangle"
          status={overallMetrics.criticalTanks > 0 ? 'critical' : 'success'}
        />
      </div>

      {/* Individual Site Cards (only show if viewing all sites) */}
      {selectedSite === 'all' && sitesToDisplay.length > 1 && (
        <>
          <h3 className="tw-text-lg tw-font-medium tw-text-gray-700 tw-mb-4">
            Site Details
          </h3>
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-4">
            {sitesToDisplay.map((site) => (
              <div
                key={site.siteId}
                className={`tw-border-2 tw-rounded-lg tw-p-4 tw-transition-all tw-duration-200 ${
                  site.status === 'critical'
                    ? 'tw-border-red-200 tw-bg-red-50'
                    : site.status === 'warning'
                    ? 'tw-border-yellow-200 tw-bg-yellow-50'
                    : 'tw-border-green-200 tw-bg-green-50'
                }`}
              >
                <div className="tw-flex tw-items-center tw-justify-between tw-mb-3">
                  <h4 className="tw-font-semibold tw-text-gray-800">{site.siteName}</h4>
                  <span className={`tw-w-3 tw-h-3 tw-rounded-full ${
                    site.status === 'critical'
                      ? 'tw-bg-red-500'
                      : site.status === 'warning'
                      ? 'tw-bg-yellow-500'
                      : 'tw-bg-green-500'
                  }`}></span>
                </div>

                <div className="tw-space-y-2 tw-text-sm">
                  <div className="tw-flex tw-justify-between">
                    <span className="tw-text-gray-600">Tanks:</span>
                    <span className="tw-font-medium">{site.tankCount}</span>
                  </div>
                  <div className="tw-flex tw-justify-between">
                    <span className="tw-text-gray-600">Fill Rate:</span>
                    <span className="tw-font-medium">{site.fillPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="tw-flex tw-justify-between">
                    <span className="tw-text-gray-600">Stock:</span>
                    <span className="tw-font-medium">{site.currentStock.toLocaleString()}L</span>
                  </div>
                  {site.criticalTanks > 0 && (
                    <div className="tw-flex tw-justify-between tw-text-red-600">
                      <span>Critical:</span>
                      <span className="tw-font-medium">{site.criticalTanks} tanks</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

SiteOverviewCards.propTypes = {
  siteMetrics: PropTypes.object,
  selectedSite: PropTypes.string
};

export default SiteOverviewCards;