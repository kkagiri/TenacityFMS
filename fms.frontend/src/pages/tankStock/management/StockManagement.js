import React, { useState, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useStockData } from '../shared/hooks/useStockData';
import TransactionHub from './components/TransactionHub';
import ReconciliationWorkflow from './components/ReconciliationWorkflow';
import AdjustmentCenter from './components/AdjustmentCenter';
import ConfigurationPanel from './components/ConfigurationPanel';
import { ToolbarAnalytics } from '../../../components/toolBar/toolBarAnalytic';
import LoadIndicator from 'devextreme-react/load-indicator';
import ScrollView from 'devextreme-react/scroll-view';
import Tabs from 'devextreme-react/tabs';
import './StockManagement.scss';

//Cursor - Stock Management - Detailed transaction management and reconciliation
const StockManagement = () => {
  const sites = useSelector((state) => state.site.sites);
  const user = useSelector((state) => state.auth.user);

  const [selectedSite, setSelectedSite] = useState(() => {
    const storedSite = localStorage.getItem('selectedSite');
    return storedSite && storedSite !== 'null' ? storedSite : 'all';
  });

  //Cursor - Memoize dateRange to prevent infinite re-renders
  const [dateRangeState, setDateRangeState] = useState(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    return [
      thirtyDaysAgo.toISOString().split('T')[0],
      today.toISOString().split('T')[0]
    ];
  });

  //Cursor - Memoize dateRange to ensure stable reference
  const dateRange = useMemo(() => dateRangeState, [dateRangeState]);

  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [loadedTabs, setLoadedTabs] = useState(new Set([0]));

  //Cursor - Use shared hook for data management
  const {
    isLoading,
    transactions,
    reconciliationData,
    adjustments,
    systemConfig,
    refreshData
  } = useStockData(selectedSite, dateRange);

  //Cursor - Tab data with icons
  const tabData = [
    { text: "Transaction Management", icon: "fa-light fa-exchange-alt" },
    { text: "Reconciliation", icon: "fa-light fa-balance-scale" },
    { text: "Stock Adjustments", icon: "fa-light fa-adjust" },
    { text: "Configuration", icon: "fa-light fa-cog" }
  ];

  //Cursor - Custom tab item renderer
  const renderTabItem = (item) => {
    return (
      <div className="tw-flex tw-items-center tw-gap-2">
        <i className={item.icon}></i>
        <span>{item.text}</span>
      </div>
    );
  };

  const handleSiteChange = useCallback((e) => {
    const newSite = e.value || 'all';
    setSelectedSite(newSite);
    localStorage.setItem('selectedSite', newSite);
  }, []);

  const handleDateRangeChange = useCallback((newDateRange) => {
    setDateRangeState(newDateRange);
  }, []);

  //Cursor - Handle tab change and lazy loading
  const handleTabSelectionChange = useCallback((e) => {
    const newIndex = e.itemIndex;
    setActiveTabIndex(newIndex);
    setLoadedTabs(prev => new Set([...prev, newIndex]));
  }, []);

  const handleTransactionUpdate = useCallback(async () => {
    await refreshData();
  }, [refreshData]);

  //Cursor - Render content based on active tab
  const renderContent = () => {
    switch (activeTabIndex) {
      case 0:
        return loadedTabs.has(0) && (
          <TransactionHub
            transactions={transactions}
            selectedSite={selectedSite}
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            onTransactionUpdate={handleTransactionUpdate}
          />
        );
      case 1:
        return loadedTabs.has(1) && (
          <ReconciliationWorkflow
            reconciliationData={reconciliationData}
            selectedSite={selectedSite}
            dateRange={dateRange}
            onReconciliationComplete={handleTransactionUpdate}
          />
        );
      case 2:
        return loadedTabs.has(2) && (
          <AdjustmentCenter
            adjustments={adjustments}
            selectedSite={selectedSite}
            dateRange={dateRange}
            onAdjustmentComplete={handleTransactionUpdate}
          />
        );
      case 3:
        return loadedTabs.has(3) && (
          <ConfigurationPanel
            systemConfig={systemConfig}
            selectedSite={selectedSite}
            onConfigUpdate={handleTransactionUpdate}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="tw-relative tw-bg-gray-50 tw-min-h-screen">
      {/* Cursor - Loading overlay instead of blocking entire screen */}
      {isLoading && (
        <div className="tw-absolute tw-top-0 tw-left-0 tw-right-0 tw-bottom-0 tw-bg-white tw-bg-opacity-75 tw-flex tw-justify-center tw-items-center tw-z-40">
          <div className="tw-text-center tw-bg-white tw-p-6 tw-rounded-lg tw-shadow-lg">
            <LoadIndicator width={'48px'} height={'48px'} visible={true} />
            <div className="tw-mt-4 tw-text-gray-600 tw-font-medium">
              Loading management dashboard...
            </div>
          </div>
        </div>
      )}

      <ScrollView className="stock-management">
        <ToolbarAnalytics
          title="Stock Management"
          additionalToolbarContent={
            <div className="tw-flex tw-items-center tw-space-x-3">
              <span className="tw-text-sm tw-text-gray-600">
                Period: {new Date(dateRange[0]).toLocaleDateString()} - {new Date(dateRange[1]).toLocaleDateString()}
              </span>
              <span className="tw-text-sm tw-text-gray-600">
                Site: {selectedSite === 'all' ? 'All Sites' : sites.find(s => s.id === selectedSite)?.name || 'Unknown'}
              </span>
              <span className="tw-text-sm tw-text-gray-600">
                User: {user?.name || 'Unknown'}
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
          {/* Cursor - Tabs Navigation */}
          <Tabs
            dataSource={tabData}
            selectedIndex={activeTabIndex}
            onItemClick={handleTabSelectionChange}
            width="100%"
            className="tw-mb-4"
            itemRender={renderTabItem}
          />

          {/* Cursor - Tab Content */}
          <div className="tw-p-4">
            {renderContent()}
          </div>
        </div>
      </ScrollView>
    </div>
  );
};

export default StockManagement;