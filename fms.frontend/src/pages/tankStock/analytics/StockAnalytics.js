import React, { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useStockData } from '../shared/hooks/useStockData';
import InteractiveDashboard from './components/InteractiveDashboard';
import ReportingEngine from './components/ReportingEngine';
import PredictiveAnalytics from './components/PredictiveAnalytics';
import KPIDashboard from './components/KPIDashboard';
import { ToolbarAnalytics } from '../../../components/toolBar/toolBarAnalytic';
import LoadIndicator from 'devextreme-react/load-indicator';
import ScrollView from 'devextreme-react/scroll-view';
import TabPanel, { Item } from 'devextreme-react/tab-panel';
import './StockAnalytics.scss';

//Cursor - Stock Analytics - Reporting and analysis
const StockAnalytics = () => {
  const sites = useSelector((state) => state.site.sites);

  const [selectedSite, setSelectedSite] = useState(() => {
    const storedSite = localStorage.getItem('selectedSite');
    return storedSite && storedSite !== 'null' ? storedSite : 'all';
  });

  const [dateRange, setDateRange] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return [sevenDaysAgo, today];
  });

  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [loadedTabs, setLoadedTabs] = useState(new Set([0]));

  //Cursor - Use shared hook for data management
  const {
    isLoading,
    analyticsData,
    reports,
    forecasts,
    kpiMetrics,
    refreshData
  } = useStockData(selectedSite, dateRange);

  const handleSiteChange = useCallback((e) => {
    const newSite = e.value || 'all';
    setSelectedSite(newSite);
    localStorage.setItem('selectedSite', newSite);
  }, []);

  const handleDateRangeChange = useCallback((newDateRange) => {
    setDateRange(newDateRange);
  }, []);

  const handleTabSelectionChange = useCallback((e) => {
    const newIndex = e.selectedIndex;
    setActiveTabIndex(newIndex);
    setLoadedTabs(prev => new Set([...prev, newIndex]));
  }, []);

  return (
    <div className="tw-relative tw-bg-gray-50 tw-min-h-screen">
      {/* Cursor - Loading overlay instead of blocking entire screen */}
      {isLoading && (
        <div className="tw-absolute tw-top-0 tw-left-0 tw-right-0 tw-bottom-0 tw-bg-white tw-bg-opacity-75 tw-flex tw-justify-center tw-items-center tw-z-40">
          <div className="tw-text-center tw-bg-white tw-p-6 tw-rounded-lg tw-shadow-lg">
            <LoadIndicator width={'48px'} height={'48px'} visible={true} />
            <div className="tw-mt-4 tw-text-gray-600 tw-font-medium">
              Loading analytics...
            </div>
          </div>
        </div>
      )}

      <ScrollView className="stock-analytics">
        <ToolbarAnalytics
          title="Stock Analytics"
          additionalToolbarContent={
            <div className="tw-flex tw-items-center tw-space-x-3">
              <span className="tw-text-sm tw-text-gray-600">
                Period: {new Date(dateRange[0]).toLocaleDateString()} - {new Date(dateRange[1]).toLocaleDateString()}
              </span>
              <span className="tw-text-sm tw-text-gray-600">
                Site: {selectedSite === 'all' ? 'All Sites' : sites.find(s => s.id === selectedSite)?.name || 'Unknown'}
              </span>
            </div>
          }
          sites={sites}
          onSiteChange={handleSiteChange}
          selectedSite={selectedSite}
          isLoading={isLoading}
          onRefresh={refreshData}
        />

        <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-overflow-hidden">
          <TabPanel
            height={'auto'}
            focusStateEnabled={false}
            deferRendering={true}
            selectedIndex={activeTabIndex}
            onSelectionChanged={handleTabSelectionChange}
          >
            <Item title="Interactive Dashboard">
              {loadedTabs.has(0) && (
                <InteractiveDashboard
                  analyticsData={analyticsData}
                  selectedSite={selectedSite}
                  dateRange={dateRange}
                  onDateRangeChange={handleDateRangeChange}
                />
              )}
            </Item>
            <Item title="Reports">
              {loadedTabs.has(1) && (
                <ReportingEngine
                  reports={reports}
                  selectedSite={selectedSite}
                  dateRange={dateRange}
                />
              )}
            </Item>
            <Item title="Predictive Analytics">
              {loadedTabs.has(2) && (
                <PredictiveAnalytics
                  forecasts={forecasts}
                  selectedSite={selectedSite}
                  dateRange={dateRange}
                />
              )}
            </Item>
            <Item title="KPI Dashboard">
              {loadedTabs.has(3) && (
                <KPIDashboard
                  kpiMetrics={kpiMetrics}
                  selectedSite={selectedSite}
                  dateRange={dateRange}
                />
              )}
            </Item>
          </TabPanel>
        </div>
      </ScrollView>
    </div>
  );
};

export default StockAnalytics;