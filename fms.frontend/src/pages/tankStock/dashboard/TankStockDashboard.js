import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTankStockSignalR } from '../../../hooks/useTankStockSignalR';
import { useStockData } from '../shared/hooks/useStockData';
import TankLevelGauge from './components/TankLevelGauge';
//Cursor - QuickActionPanel moved to manual refill page
// import QuickActionPanel from './components/QuickActionPanel';
import AlertsPanel from './components/AlertsPanel';
import SiteOverviewCards from './components/SiteOverviewCards';
import { ToolbarAnalytics } from '../../../components/toolBar/toolBarAnalytic';
import LoadIndicator from 'devextreme-react/load-indicator';
import ScrollView from 'devextreme-react/scroll-view';
import './TankStockDashboard.scss';

//Cursor - Tank Stock Dashboard - Real-time monitoring and quick operations
const TankStockDashboard = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const sites = useSelector((state) => state.site.sites);
  const tanks = useSelector((state) => state.tank.tanks);

  const [selectedSite, setSelectedSite] = useState(() => {
    const storedSite = localStorage.getItem('selectedSite');
    return storedSite && storedSite !== 'null' ? storedSite : 'all';
  });

  const [dateRange] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    return [today, today];
  });

  //Cursor - Use SignalR for real-time updates
  const { isConnected: signalRConnected, requestTankDataRefresh } = useTankStockSignalR(
    selectedSite,
    dateRange,
    true
  );

  //Cursor - Use shared hook for data management
  const {
    isLoading,
    tankLevels,
    criticalAlerts,
    siteMetrics,
    refreshData
  } = useStockData(selectedSite, dateRange);

  const handleSiteChange = useCallback((e) => {
    const newSite = e.value || 'all';
    setSelectedSite(newSite);
    localStorage.setItem('selectedSite', newSite);
  }, []);

  //Cursor - Quick action handling removed as it's moved to manual refill page
  // const handleQuickAction = useCallback(async (actionData) => {
  //   try {
  //     // Action will be handled by QuickActionPanel
  //     await refreshData();
  //     if (signalRConnected && requestTankDataRefresh) {
  //       setTimeout(() => requestTankDataRefresh(), 1000);
  //     }
  //   } catch (error) {
  //     console.error('Error performing quick action:', error);
  //   }
  // }, [refreshData, signalRConnected, requestTankDataRefresh]);

  return (
    <div className="tw-relative tw-bg-gray-50 tw-min-h-screen">
      {/* Cursor - Loading overlay instead of blocking entire screen */}
      {isLoading && (
        <div className="tw-absolute tw-top-0 tw-left-0 tw-right-0 tw-bottom-0 tw-bg-white tw-bg-opacity-75 tw-flex tw-justify-center tw-items-center tw-z-40">
          <div className="tw-text-center tw-bg-white tw-p-6 tw-rounded-lg tw-shadow-lg">
            <LoadIndicator width={'48px'} height={'48px'} visible={true} />
            <div className="tw-mt-4 tw-text-gray-600 tw-font-medium">
              Loading dashboard...
            </div>
          </div>
        </div>
      )}

      <ScrollView className="tank-stock-dashboard">
        <ToolbarAnalytics
          title="Tank Stock Dashboard"
          additionalToolbarContent={
            <div className="tw-flex tw-items-center tw-space-x-3">
              <span className="tw-text-sm tw-text-gray-600">
                Site: {selectedSite === 'all' ? 'All Sites' : sites.find(s => s.id === selectedSite)?.name || 'Unknown'}
              </span>
              <div className={`tw-flex tw-items-center tw-px-2 tw-py-1 tw-rounded-full tw-text-sm ${
                signalRConnected
                  ? 'tw-bg-green-100 tw-text-green-800'
                  : 'tw-bg-red-100 tw-text-red-800'
              }`}>
                <i className={`fa-light ${signalRConnected ? 'fa-satellite-dish' : 'fa-exclamation-triangle'} tw-mr-1`}></i>
                {signalRConnected ? 'Live Updates' : 'Offline'}
              </div>
            </div>
          }
          sites={sites}
          onSiteChange={handleSiteChange}
          selectedSite={selectedSite}
          isLoading={isLoading}
          onRefresh={refreshData}
        />

        {/* Critical Alerts Panel */}
        <div className="tw-mb-6">
          <AlertsPanel
            alerts={criticalAlerts}
            selectedSite={selectedSite}
          />
        </div>

        {/* Site Overview Cards */}
        <div className="tw-mb-6">
          <SiteOverviewCards
            siteMetrics={siteMetrics}
            selectedSite={selectedSite}
          />
        </div>

        {/* Tank Level Monitoring */}
        <div className="tw-mb-6">
          <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-6">
            <div className="tw-flex tw-items-center tw-justify-between tw-mb-6">
              <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800">
                <i className="fa-light fa-gauge tw-mr-2 tw-text-blue-600"></i>
                Real-time Tank Levels
              </h2>
              <div className="tw-text-sm tw-text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>

            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 xl:tw-grid-cols-4 tw-gap-6">
              {tankLevels.map((tank) => (
                <TankLevelGauge
                  key={tank.id}
                  tank={tank}
                  isConnected={signalRConnected}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Cursor - Quick Action Panel moved to manual refill page */}
        {/* <QuickActionPanel
          onActionComplete={handleQuickAction}
          selectedSite={selectedSite}
          sites={sites}
          tanks={tanks.filter(tank => selectedSite === 'all' || tank.siteId === selectedSite)}
        /> */}
      </ScrollView>
    </div>
  );
};

export default TankStockDashboard;