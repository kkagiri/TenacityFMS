import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { CheckBox } from 'devextreme-react/check-box';
import { Button } from 'devextreme-react/button';

// Utility functions for issue calculation
const calculateTankIssueMetrics = (tanks = []) => {
  if (!tanks || tanks.length === 0) {
    return {
      lowStock: 0,
      negativeStock: 0,
      overCapacity: 0,
      inactive: 0,
      totalIssues: 0,
      healthyTanks: 0,
      systemStatus: 'healthy'
    };
  }

  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  let lowStock = 0;
  let negativeStock = 0;
  let overCapacity = 0;
  let inactive = 0;

  tanks.forEach(tank => {
    const fillPercentage = (tank.currentStock / tank.tankVolume) * 100;

    if (fillPercentage < 30 && tank.currentStock >= 0) {
      lowStock++;
    }

    if (tank.currentStock < 0) {
      negativeStock++;
    }

    if (tank.currentStock > tank.tankVolume) {
      overCapacity++;
    }

    const lastUpdate = new Date(tank.lastStockUpdate);
    if (lastUpdate < oneMonthAgo) {
      inactive++;
    }
  });

  const totalIssues = lowStock + negativeStock + overCapacity + inactive;
  const healthyTanks = tanks.length - totalIssues;

  let systemStatus = 'healthy';
  if (negativeStock > 0 || overCapacity > 0) {
    systemStatus = 'critical';
  } else if (lowStock > tanks.length * 0.3 || inactive > tanks.length * 0.2) {
    systemStatus = 'warning';
  } else if (totalIssues > 0) {
    systemStatus = 'caution';
  }

  return {
    lowStock,
    negativeStock,
    overCapacity,
    inactive,
    totalIssues,
    healthyTanks,
    systemStatus,
    totalTanks: tanks.length
  };
};

const getSiteSystemStatus = (siteMetrics) => {
  const { systemStatus, totalIssues, totalTanks } = siteMetrics;

  return {
    status: systemStatus,
    hasIssues: totalIssues > 0,
    issuePercentage: totalTanks > 0 ? (totalIssues / totalTanks) * 100 : 0,
    severity: systemStatus === 'critical' ? 'critical' :
              systemStatus === 'warning' ? 'warning' :
              systemStatus === 'caution' ? 'caution' : 'normal'
  };
};

const getIssueIcon = (issueType) => {
  const icons = {
    lowStock: 'fa-light fa-droplet-slash',
    negativeStock: 'fa-light fa-exclamation-triangle',
    overCapacity: 'fa-light fa-warning',
    inactive: 'fa-light fa-clock'
  };
  return icons[issueType] || 'fa-light fa-question-circle';
};

const getIssueColor = (issueType) => {
  const colors = {
    lowStock: 'tw-text-yellow-600',
    negativeStock: 'tw-text-red-600',
    overCapacity: 'tw-text-red-600',
    inactive: 'tw-text-gray-500'
  };
  return colors[issueType] || 'tw-text-gray-500';
};

//Cursor - Enhanced Site Details component with filtering capabilities
const SiteDetailsWithFilter = ({
  siteMetrics = {},
  sitesFromRedux = [], // Fallback sites data from Redux
  tankData = [],
  selectedSite,
  onSiteSelect
}) => {
  // Filter states
  const [filters, setFilters] = useState({
    sitesWithIssues: false,
    criticalSites: false,
    warningSites: false,
    healthySites: false,
    sitesWithTanks: false,
    allSites: true
  });

  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [filteredSites, setFilteredSites] = useState([]);

  // Safely handle siteMetrics data structure - Memoized to prevent recalculation
  const safeSiteMetrics = useMemo(() => {
    console.log('Debug: Raw siteMetrics received:', siteMetrics);
    console.log('Debug: Redux sites fallback:', sitesFromRedux);

    let sitesData = [];

    if (!siteMetrics || (typeof siteMetrics === 'object' && Object.keys(siteMetrics).length === 0)) {
      console.log('Debug: siteMetrics is empty, using Redux sites as fallback');
      sitesData = sitesFromRedux || [];
    } else if (Array.isArray(siteMetrics)) {
      console.log('Debug: siteMetrics is array:', siteMetrics);
      sitesData = siteMetrics;
    } else if (typeof siteMetrics === 'object') {
      const values = Object.values(siteMetrics);
      console.log('Debug: Converting siteMetrics object to array:', {
        originalObject: siteMetrics,
        keysAvailable: Object.keys(siteMetrics),
        valuesCount: values.length,
        sampleKeys: Object.keys(siteMetrics).slice(0, 5),
        sampleValues: values.slice(0, 3)
      });
      sitesData = values;
    }

    console.log('Debug: Final sites data:', sitesData);
    return sitesData;
  }, [siteMetrics, sitesFromRedux]);

  // Memoized sites to display based on selection
  const sitesToDisplay = useMemo(() => {
    console.log('Debug: Filtering sites for display:', {
      selectedSite,
      safeSiteMetricsLength: safeSiteMetrics.length,
      allSiteKeys: safeSiteMetrics.map(site => ({
        id: site.id,
        siteId: site.siteId,
        name: site.name || site.siteName
      }))
    });

    if (selectedSite === 'all') {
      return safeSiteMetrics;
    }

    // Try to find the site by different ID fields
    const filtered = safeSiteMetrics.filter(site => {
      const matches = site.siteId === selectedSite ||
                     site.id === selectedSite ||
                     site.siteId === parseInt(selectedSite) ||
                     site.id === parseInt(selectedSite) ||
                     String(site.siteId) === selectedSite ||
                     String(site.id) === selectedSite;

      if (matches) {
        console.log('Debug: Found matching site:', site);
      }
      return matches;
    });

    console.log('Debug: After filtering:', {
      selectedSite,
      filteredCount: filtered.length,
      filteredSites: filtered.map(s => ({ id: s.id, siteId: s.siteId, name: s.name || s.siteName }))
    });

    // If no site found and we have sites available, auto-correct to show all sites
    if (filtered.length === 0 && safeSiteMetrics.length > 0) {
      console.log('Debug: No matching site found, auto-correcting to show all sites');
      // Trigger site selection change to 'all' after a short delay
      setTimeout(() => {
        if (onSiteSelect) {
          console.log('Debug: Auto-correcting selectedSite from', selectedSite, 'to "all"');
          onSiteSelect('all');
        }
      }, 100);
    }

    return filtered;
  }, [safeSiteMetrics, selectedSite, onSiteSelect]);

  // Calculate site metrics with issue data - Memoized to prevent recalculation
  const getSiteWithIssues = useCallback((site) => {
    const siteTanks = tankData.filter(tank => tank.siteId === site.siteId || tank.siteId === site.id);
    const issueMetrics = calculateTankIssueMetrics(siteTanks);
    const systemStatus = getSiteSystemStatus(issueMetrics);

    return {
      ...site,
      issueMetrics,
      systemStatus
    };
  }, [tankData]);

  // Memoized enriched sites to prevent infinite re-renders
  const enrichedSites = useMemo(() => {
    return sitesToDisplay.map(getSiteWithIssues);
  }, [sitesToDisplay, getSiteWithIssues]);

  // Calculate filter counts - Memoized and only recalculated when enrichedSites changes
  const filterCounts = useMemo(() => {
    const counts = {
      sitesWithIssues: 0,
      criticalSites: 0,
      warningSites: 0,
      healthySites: 0,
      sitesWithTanks: 0,
      total: enrichedSites.length
    };

    enrichedSites.forEach(site => {
      // Count sites with tanks
      const siteTanks = tankData.filter(tank => tank.siteId === site.siteId || tank.siteId === site.id);
      if (siteTanks.length > 0) {
        counts.sitesWithTanks++;
      }

      if (site.issueMetrics.totalIssues > 0) {
        counts.sitesWithIssues++;
      }

      if (site.systemStatus.severity === 'critical') {
        counts.criticalSites++;
      } else if (site.systemStatus.severity === 'warning') {
        counts.warningSites++;
      } else {
        counts.healthySites++;
      }
    });

    return counts;
  }, [enrichedSites, tankData]);

  // Apply filters - Memoized to prevent re-calculation on every render
  const filteredSitesData = useMemo(() => {
    if (filters.allSites) {
      return enrichedSites;
    }

    return enrichedSites.filter(site => {
      // Check if site has tanks
      const siteTanks = tankData.filter(tank => tank.siteId === site.siteId || tank.siteId === site.id);
      const hasTanks = siteTanks.length > 0;

      const matchesSitesWithTanks = filters.sitesWithTanks && hasTanks;
      const matchesIssues = filters.sitesWithIssues && site.issueMetrics.totalIssues > 0;
      const matchesCritical = filters.criticalSites && site.systemStatus.severity === 'critical';
      const matchesWarning = filters.warningSites && site.systemStatus.severity === 'warning';
      const matchesHealthy = filters.healthySites && site.systemStatus.severity === 'normal';

      return matchesSitesWithTanks || matchesIssues || matchesCritical || matchesWarning || matchesHealthy;
    });
  }, [filters, enrichedSites, tankData]);

  // Update filteredSites state only when filteredSitesData changes
  useEffect(() => {
    setFilteredSites(filteredSitesData);
  }, [filteredSitesData]);

  const handleFilterChange = useCallback((filterKey, value) => {
    if (filterKey === 'allSites' && value) {
      // If "All Sites" is selected, disable other filters
      setFilters({
        sitesWithIssues: false,
        criticalSites: false,
        warningSites: false,
        healthySites: false,
        sitesWithTanks: false,
        allSites: true
      });
    } else {
      // If any specific filter is selected, disable "All Sites"
      setFilters(prev => ({
        ...prev,
        [filterKey]: value,
        allSites: false
      }));
    }
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({
      sitesWithIssues: false,
      criticalSites: false,
      warningSites: false,
      healthySites: false,
      sitesWithTanks: false,
      allSites: true
    });
  }, []);

  const selectIssuesOnly = useCallback(() => {
    setFilters({
      sitesWithIssues: true,
      criticalSites: true,
      warningSites: true,
      healthySites: false,
      sitesWithTanks: false,
      allSites: false
    });
  }, []);

  const selectSitesWithTanks = useCallback(() => {
    setFilters({
      sitesWithIssues: false,
      criticalSites: false,
      warningSites: false,
      healthySites: false,
      sitesWithTanks: true,
      allSites: false
    });
  }, []);

  const getActiveFiltersCount = useMemo(() => {
    if (filters.allSites) return 0;
    return Object.values(filters).filter(Boolean).length;
  }, [filters]);

  // Debug logging moved to useEffect to prevent spam (only log when data actually changes)
  useEffect(() => {
    console.log('Debug SiteDetailsWithFilter - Data Changed:', {
      sitesToDisplayLength: sitesToDisplay.length,
      filteredSitesLength: filteredSites.length,
      selectedSite,
      tankDataLength: tankData.length,
      siteMetricsType: typeof siteMetrics,
      siteMetricsKeys: siteMetrics && typeof siteMetrics === 'object' ? Object.keys(siteMetrics).slice(0, 10) : 'not-object',
      tankDataSample: tankData.slice(0, 3).map(t => ({ id: t.id, siteId: t.siteId, name: t.name })),
      sitesToDisplaySample: sitesToDisplay.slice(0, 3).map(s => ({ id: s.id, siteId: s.siteId, name: s.name || s.siteName })),
      filters
    });
  }, [sitesToDisplay.length, filteredSites.length, selectedSite, tankData.length, siteMetrics, filters, sitesToDisplay, tankData]);

  // Don't show site details if no sites available
  if (sitesToDisplay.length === 0) {
    const hasDataButNoMatch = safeSiteMetrics.length > 0 && selectedSite !== 'all';

    return (
      <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-6">
        <div className="tw-flex tw-items-center tw-justify-between tw-mb-6">
          <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800">
            <i className="fa-light fa-building-columns tw-mr-2 tw-text-blue-600"></i>
            Site Details
          </h2>
          {hasDataButNoMatch && (
            <Button
              text="Show All Sites"
              icon="fa-light fa-eye"
              onClick={() => onSiteSelect && onSiteSelect('all')}
              type="default"
              stylingMode="contained"
            />
          )}
        </div>
        <div className="tw-text-center tw-py-12">
          <i className="fa-light fa-building-columns tw-text-4xl tw-text-gray-300 tw-mb-4"></i>
          {hasDataButNoMatch ? (
            <>
              <p className="tw-text-gray-500 tw-text-lg tw-font-medium">
                No site found with ID "{selectedSite}"
              </p>
              <p className="tw-text-gray-400 tw-text-sm tw-mt-2">
                Found {safeSiteMetrics.length} total sites available.
                <button
                  onClick={() => onSiteSelect && onSiteSelect('all')}
                  className="tw-text-blue-600 tw-underline tw-ml-1"
                >
                  View all sites
                </button>
              </p>
              <div className="tw-mt-4 tw-text-xs tw-text-gray-400">
                Available sites: {safeSiteMetrics.slice(0, 5).map(s => s.name || s.siteName || `Site ${s.siteId || s.id}`).join(', ')}
                {safeSiteMetrics.length > 5 && '...'}
              </div>
            </>
          ) : (
            <>
              <p className="tw-text-gray-500 tw-text-lg tw-font-medium">No site data available</p>
              <p className="tw-text-gray-400 tw-text-sm tw-mt-2">
                {siteMetrics ? 'Site data is loading or empty' : 'Please check data connection and refresh the page'}
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-6">
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-6">
        <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800">
          <i className="fa-light fa-building-columns tw-mr-2 tw-text-blue-600"></i>
          Site Details
        </h2>
        <div className="tw-text-sm tw-text-gray-500">
          {filteredSites.length} of {sitesToDisplay.length} Sites
        </div>
      </div>

      {/* Site Filter Panel */}
      <div className="tw-bg-gray-50 tw-rounded-lg tw-mb-6">
        <div
          className={`tw-flex tw-items-center tw-justify-between tw-p-4 tw-cursor-pointer tw-border-b tw-border-gray-200 ${isFilterExpanded ? 'tw-border-b' : ''}`}
          onClick={() => setIsFilterExpanded(!isFilterExpanded)}
        >
          <div className="tw-flex tw-items-center">
            <i className="fa-light fa-filter tw-mr-2 tw-text-blue-600"></i>
            <h3 className="tw-text-lg tw-font-medium tw-text-gray-800">Site Filters</h3>
            {getActiveFiltersCount > 0 && (
              <span className="tw-ml-2 tw-bg-blue-100 tw-text-blue-800 tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium">
                {getActiveFiltersCount} active
              </span>
            )}
          </div>
          <div className="tw-flex tw-items-center">
            <span className="tw-text-sm tw-text-gray-500 tw-mr-3">
              {filteredSites.length} sites shown
            </span>
            <i className={`fa-light ${isFilterExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} tw-text-gray-400`}></i>
          </div>
        </div>

        {/* Filter Content */}
        {isFilterExpanded && (
          <div className="tw-p-4">
            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-4 tw-mb-4">
              {/* Sites with Issues Filter */}
              <div className={`tw-flex tw-items-center tw-justify-between tw-p-3 tw-border tw-border-gray-200 tw-rounded-lg ${filters.sitesWithIssues ? 'tw-border-orange-300 tw-bg-orange-50' : ''}`}>
                <div className="tw-flex tw-items-center">
                  <CheckBox
                    value={filters.sitesWithIssues}
                    onValueChanged={(e) => handleFilterChange('sitesWithIssues', e.value)}
                  />
                  <div className="tw-ml-3">
                    <div className="tw-font-medium tw-text-gray-800">Sites with Issues</div>
                    <div className="tw-text-sm tw-text-gray-600">Any tank problems</div>
                  </div>
                </div>
                <div className="tw-bg-orange-100 tw-text-orange-800 tw-px-2 tw-py-1 tw-rounded tw-text-sm tw-font-medium">
                  {filterCounts.sitesWithIssues}
                </div>
              </div>

              {/* Critical Sites Filter */}
              <div className={`tw-flex tw-items-center tw-justify-between tw-p-3 tw-border tw-border-gray-200 tw-rounded-lg ${filters.criticalSites ? 'tw-border-red-300 tw-bg-red-50' : ''}`}>
                <div className="tw-flex tw-items-center">
                  <CheckBox
                    value={filters.criticalSites}
                    onValueChanged={(e) => handleFilterChange('criticalSites', e.value)}
                  />
                  <div className="tw-ml-3">
                    <div className="tw-font-medium tw-text-gray-800">Critical Sites</div>
                    <div className="tw-text-sm tw-text-gray-600">Urgent attention needed</div>
                  </div>
                </div>
                <div className="tw-bg-red-100 tw-text-red-800 tw-px-2 tw-py-1 tw-rounded tw-text-sm tw-font-medium">
                  {filterCounts.criticalSites}
                </div>
              </div>

              {/* Warning Sites Filter */}
              <div className={`tw-flex tw-items-center tw-justify-between tw-p-3 tw-border tw-border-gray-200 tw-rounded-lg ${filters.warningSites ? 'tw-border-yellow-300 tw-bg-yellow-50' : ''}`}>
                <div className="tw-flex tw-items-center">
                  <CheckBox
                    value={filters.warningSites}
                    onValueChanged={(e) => handleFilterChange('warningSites', e.value)}
                  />
                  <div className="tw-ml-3">
                    <div className="tw-font-medium tw-text-gray-800">Warning Sites</div>
                    <div className="tw-text-sm tw-text-gray-600">Moderate issues</div>
                  </div>
                </div>
                <div className="tw-bg-yellow-100 tw-text-yellow-800 tw-px-2 tw-py-1 tw-rounded tw-text-sm tw-font-medium">
                  {filterCounts.warningSites}
                </div>
              </div>

              {/* Healthy Sites Filter */}
              <div className={`tw-flex tw-items-center tw-justify-between tw-p-3 tw-border tw-border-gray-200 tw-rounded-lg ${filters.healthySites ? 'tw-border-green-300 tw-bg-green-50' : ''}`}>
                <div className="tw-flex tw-items-center">
                  <CheckBox
                    value={filters.healthySites}
                    onValueChanged={(e) => handleFilterChange('healthySites', e.value)}
                  />
                  <div className="tw-ml-3">
                    <div className="tw-font-medium tw-text-gray-800">Healthy Sites</div>
                    <div className="tw-text-sm tw-text-gray-600">No issues detected</div>
                  </div>
                </div>
                <div className="tw-bg-green-100 tw-text-green-800 tw-px-2 tw-py-1 tw-rounded tw-text-sm tw-font-medium">
                  {filterCounts.healthySites}
                </div>
              </div>

              {/* Sites with Tanks Filter */}
              <div className={`tw-flex tw-items-center tw-justify-between tw-p-3 tw-border tw-border-gray-200 tw-rounded-lg ${filters.sitesWithTanks ? 'tw-border-indigo-300 tw-bg-indigo-50' : ''}`}>
                <div className="tw-flex tw-items-center">
                  <CheckBox
                    value={filters.sitesWithTanks}
                    onValueChanged={(e) => handleFilterChange('sitesWithTanks', e.value)}
                  />
                  <div className="tw-ml-3">
                    <div className="tw-font-medium tw-text-gray-800">Sites with Tanks</div>
                    <div className="tw-text-sm tw-text-gray-600">Only sites containing tanks</div>
                  </div>
                </div>
                <div className="tw-bg-indigo-100 tw-text-indigo-800 tw-px-2 tw-py-1 tw-rounded tw-text-sm tw-font-medium">
                  {filterCounts.sitesWithTanks}
                </div>
              </div>

              {/* All Sites Filter */}
              <div className={`tw-flex tw-items-center tw-justify-between tw-p-3 tw-border tw-border-gray-200 tw-rounded-lg ${filters.allSites ? 'tw-border-blue-300 tw-bg-blue-50' : ''}`}>
                <div className="tw-flex tw-items-center">
                  <CheckBox
                    value={filters.allSites}
                    onValueChanged={(e) => handleFilterChange('allSites', e.value)}
                  />
                  <div className="tw-ml-3">
                    <div className="tw-font-medium tw-text-gray-800">All Sites</div>
                    <div className="tw-text-sm tw-text-gray-600">Show all sites</div>
                  </div>
                </div>
                <div className="tw-bg-blue-100 tw-text-blue-800 tw-px-2 tw-py-1 tw-rounded tw-text-sm tw-font-medium">
                  {filterCounts.total}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="tw-flex tw-justify-end tw-space-x-3 tw-pt-4 tw-border-t tw-border-gray-200">
              <Button
                text="Show All Sites"
                icon="fa-light fa-eye"
                onClick={clearAllFilters}
                type="default"
                stylingMode="outlined"
              />
              <Button
                text="Sites with Tanks"
                icon="fa-light fa-storage-tank"
                onClick={selectSitesWithTanks}
                type="default"
                stylingMode="outlined"
              />
              <Button
                text="Issues Only"
                icon="fa-light fa-exclamation-triangle"
                onClick={selectIssuesOnly}
                type="default"
                stylingMode="contained"
              />
            </div>
          </div>
        )}
      </div>

      {/* Sites Grid */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-4">
        {filteredSites.length === 0 ? (
          <div className="tw-col-span-full tw-text-center tw-py-12">
            <i className="fa-light fa-building-columns tw-text-4xl tw-text-gray-300 tw-mb-4"></i>
            <p className="tw-text-gray-500 tw-text-lg tw-font-medium">No sites match the current filters</p>
            <p className="tw-text-gray-400 tw-text-sm tw-mt-2">
              {sitesToDisplay.length > 0
                ? `${sitesToDisplay.length} sites available - try adjusting your filter criteria`
                : 'No site data available - please check data connection'}
            </p>
            <div className="tw-mt-4 tw-text-xs tw-text-gray-400">
              Debug: Sites: {sitesToDisplay.length} | Tanks: {tankData.length} | Selected: {selectedSite}
            </div>
          </div>
        ) : (
          filteredSites.map((site) => (
            <div
              key={site.siteId || site.id}
              className={`tw-border-2 tw-rounded-lg tw-p-4 tw-transition-all tw-duration-200 tw-cursor-pointer ${
                site.systemStatus.severity === 'critical'
                  ? 'tw-border-red-200 tw-bg-red-50 hover:tw-border-red-300'
                  : site.systemStatus.severity === 'warning'
                  ? 'tw-border-yellow-200 tw-bg-yellow-50 hover:tw-border-yellow-300'
                  : 'tw-border-green-200 tw-bg-green-50 hover:tw-border-green-300'
              }`}
              onClick={() => onSiteSelect && onSiteSelect(site.siteId || site.id)}
            >
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-3">
                <h4 className="tw-font-semibold tw-text-gray-800">{site.siteName || site.name}</h4>
                <div className="tw-flex tw-items-center tw-space-x-2">
                  {/* System Status Indicator */}
                  <span
                    className={`tw-w-3 tw-h-3 tw-rounded-full ${
                      site.systemStatus.severity === 'critical'
                        ? 'tw-bg-red-500'
                        : site.systemStatus.severity === 'warning'
                        ? 'tw-bg-yellow-500'
                        : 'tw-bg-green-500'
                    }`}
                    title={`System Status: ${site.systemStatus.status}`}
                  ></span>

                  {/* Issue Indicators */}
                  {site.systemStatus.hasIssues && (
                    <div className="tw-flex tw-items-center tw-space-x-1">
                      {site.issueMetrics.negativeStock > 0 && (
                        <i
                          className={`${getIssueIcon('negativeStock')} ${getIssueColor('negativeStock')} tw-text-sm`}
                          title={`${site.issueMetrics.negativeStock} tanks with negative stock`}
                        ></i>
                      )}
                      {site.issueMetrics.overCapacity > 0 && (
                        <i
                          className={`${getIssueIcon('overCapacity')} ${getIssueColor('overCapacity')} tw-text-sm`}
                          title={`${site.issueMetrics.overCapacity} tanks over capacity`}
                        ></i>
                      )}
                      {site.issueMetrics.lowStock > 0 && (
                        <i
                          className={`${getIssueIcon('lowStock')} ${getIssueColor('lowStock')} tw-text-sm`}
                          title={`${site.issueMetrics.lowStock} tanks with low stock`}
                        ></i>
                      )}
                      {site.issueMetrics.inactive > 0 && (
                        <i
                          className={`${getIssueIcon('inactive')} ${getIssueColor('inactive')} tw-text-sm`}
                          title={`${site.issueMetrics.inactive} inactive tanks`}
                        ></i>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Site Metrics */}
              <div className="tw-space-y-2 tw-text-sm">
                <div className="tw-flex tw-justify-between">
                  <span className="tw-text-gray-600">Tanks:</span>
                  <div className="tw-flex tw-items-center">
                    <span className="tw-font-medium">{site.tankCount || tankData.filter(t => t.siteId === site.siteId || t.siteId === site.id).length}</span>
                    {site.issueMetrics.totalIssues > 0 && (
                      <span className={`tw-ml-2 tw-px-2 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium ${
                        site.systemStatus.severity === 'critical'
                          ? 'tw-bg-red-100 tw-text-red-800'
                          : 'tw-bg-yellow-100 tw-text-yellow-800'
                      }`}>
                        {site.issueMetrics.totalIssues} issues
                      </span>
                    )}
                  </div>
                </div>

                <div className="tw-flex tw-justify-between">
                  <span className="tw-text-gray-600">Fill Rate:</span>
                  <span className={`tw-font-medium ${
                    (site.fillPercentage || 0) < 15
                      ? 'tw-text-red-600'
                      : (site.fillPercentage || 0) < 30
                      ? 'tw-text-yellow-600'
                      : 'tw-text-green-600'
                  }`}>
                    {(site.fillPercentage || 0).toFixed(1)}%
                  </span>
                </div>

                <div className="tw-flex tw-justify-between">
                  <span className="tw-text-gray-600">Stock:</span>
                  <span className="tw-font-medium">{(site.currentStock || 0).toLocaleString()}L</span>
                </div>

                {/* Issue Breakdown */}
                {site.issueMetrics.totalIssues > 0 && (
                  <div className="tw-mt-3 tw-pt-3 tw-border-t tw-border-gray-200">
                    <div className="tw-text-xs tw-text-gray-500 tw-mb-1">Issues:</div>
                    <div className="tw-grid tw-grid-cols-2 tw-gap-1 tw-text-xs">
                      {site.issueMetrics.lowStock > 0 && (
                        <div className="tw-text-yellow-600">
                          Low: {site.issueMetrics.lowStock}
                        </div>
                      )}
                      {site.issueMetrics.negativeStock > 0 && (
                        <div className="tw-text-red-600">
                          Negative: {site.issueMetrics.negativeStock}
                        </div>
                      )}
                      {site.issueMetrics.overCapacity > 0 && (
                        <div className="tw-text-red-600">
                          Over: {site.issueMetrics.overCapacity}
                        </div>
                      )}
                      {site.issueMetrics.inactive > 0 && (
                        <div className="tw-text-gray-500">
                          Inactive: {site.issueMetrics.inactive}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

SiteDetailsWithFilter.propTypes = {
  siteMetrics: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  sitesFromRedux: PropTypes.array,
  tankData: PropTypes.array,
  selectedSite: PropTypes.string,
  onSiteSelect: PropTypes.func
};

export default SiteDetailsWithFilter;
