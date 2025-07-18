import React, { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useStockData } from '../shared/hooks/useStockDataOptimized';
import { useDateRange } from '../../../hooks/useDateRange';
import FilterInfoBar from '../components/FilterInfoBar';
import ReconciliationWorkflow from './components/ReconciliationWorkflow';
import AdjustmentCenter from './components/AdjustmentCenter';
import ConfigurationPanel from './components/ConfigurationPanel';
import PumpTransactionManager from './components/PumpTransactionManager';
import TransactionHub from './components/TransactionHub';
import LoadIndicator from 'devextreme-react/load-indicator';
import ScrollView from 'devextreme-react/scroll-view';
import Tabs from 'devextreme-react/tabs';
import './StockManagement.scss';

//Cursor - Stock Management - Focused on Stock Adjustment Dashboard
const StockManagement = () => {
  const sites = useSelector((state) => state.site.sites);
  const user = useSelector((state) => state.auth.user);

  const [selectedSite] = useState(() => {
    const storedSite = localStorage.getItem('selectedSite');
    return storedSite && storedSite !== 'null' ? storedSite : 'all';
  });

  // Use stable date range hook
  const { dateRange } = useDateRange(30); // 30 days by default

  // Set default tab to Stock Adjustment Dashboard (index 0)
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [loadedTabs, setLoadedTabs] = useState(new Set([0]));

  //Cursor - Use shared hook for data management
  const {
    isLoading,
    reconciliationData,
    adjustments,
    systemConfig,
    refreshData
  } = useStockData(selectedSite, dateRange);

  const handleFilterClick = useCallback(() => {
    // TODO: Open filter popup
    console.log('Filter clicked');
  }, []);

  // Ensure arrays are available for FilterInfoBar
  const safeSites = Array.isArray(sites) ? sites : [];
  const safeDateRange = Array.isArray(dateRange) && dateRange.length >= 2 ? dateRange : [new Date(), new Date()];

  //Cursor - Tab data with Transaction Hub as first tab, Stock Adjustment Dashboard as second
  const tabData = [
    { text: "Transaction Hub", icon: "fa-light fa-exchange-alt" },
    { text: "Stock Adjustment Dashboard", icon: "fa-light fa-adjust" },
    { text: "Pump Transactions", icon: "fa-light fa-gas-pump" },
    { text: "Reconciliation", icon: "fa-light fa-balance-scale" },
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

  const handleTransactionUpdate = useCallback(async () => {
    await refreshData();
  }, [refreshData]);

  //Cursor - Handle tab change and lazy loading
  const handleTabSelectionChange = (e) => {
    const newIndex = e.itemIndex;
    setActiveTabIndex(newIndex);
    setLoadedTabs(prev => new Set([...prev, newIndex]));
  };

  //Cursor - Render content based on active tab
  const renderContent = () => {
    switch (activeTabIndex) {
      case 0:
        return loadedTabs.has(0) && (
          <TransactionHub
            selectedSite={selectedSite}
            dateRange={dateRange}
          />
        );
      case 1:
        return loadedTabs.has(1) && (
          <AdjustmentCenter
            adjustments={adjustments}
            selectedSite={selectedSite}
            dateRange={dateRange}
            onAdjustmentComplete={handleTransactionUpdate}
          />
        );
      case 2:
        return loadedTabs.has(2) && (
          <PumpTransactionManager
            selectedSite={selectedSite}
            dateRange={dateRange}
          />
        );
      case 3:
        return loadedTabs.has(3) && (
          <ReconciliationWorkflow
            reconciliationData={reconciliationData}
            selectedSite={selectedSite}
            dateRange={dateRange}
            onReconciliationComplete={handleTransactionUpdate}
          />
        );
      case 4:
        return loadedTabs.has(4) && (
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
      {/* Render filter info in header */}
      <FilterInfoBar
        dateRange={safeDateRange}
        selectedSite={selectedSite}
        sites={safeSites}
        user={user}
        onFilterClick={handleFilterClick}
      />

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