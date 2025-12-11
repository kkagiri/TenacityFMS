import React, { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useStockFilters } from '../shared/context/StockFilterContext';
import { useStockData } from '../shared/hooks/useStockDataOptimized';
import ReconciliationWorkflow from './components/ReconciliationWorkflow';
import AdjustmentCenter from './components/AdjustmentCenter';
import ConfigurationPanel from './components/ConfigurationPanel';
import PumpTransactionManager from './components/PumpTransactionManager';
import TransactionHub from './components/TransactionHub';
import DispensingManager from './components/DispensingManager';
import BulkImportManager from './components/bulkImport/BulkImportManager';
import DeliveryManager from './components/DeliveryManager';
import TankStockTable from '../analytics/components/reporting/TankStockTable';
import LoadIndicator from 'devextreme-react/load-indicator';
import Tabs from 'devextreme-react/tabs';
import './StockManagement.scss';

//Cursor - Stock Management Page - Main container with shared filters from TankStockLayout
const StockManagement = () => {
  const sites = useSelector((state) => state.site.sites);
  const user = useSelector((state) => state.auth.user);

  // Get filters from shared context (provided by TankStockLayout)
  const { dateRange, singleSiteId } = useStockFilters();

  const [selectedSite] = useState(() => {
    const storedSite = localStorage.getItem('selectedSite');
    return storedSite && storedSite !== 'null' ? storedSite : 'all';
  });

  // Set default tab to Transaction Hub (index 0)
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

  //Cursor - Tab data
  const tabData = [
    { text: "Transaction Hub", icon: "fa-light fa-exchange-alt" },
    { text: "Delivery Management", icon: "fa-light fa-truck-container" },
    { text: "Pump Transactions", icon: "fa-light fa-gas-pump" },
    { text: "Dispensing Volumes", icon: "fa-light fa-tint" },
    { text: "Bulk Import", icon: "fa-light fa-file-upload" },
    { text: "Tank Stock Table", icon: "fa-light fa-table" },
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
          <DeliveryManager />
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
          <DispensingManager />
        );
      case 4:
        return loadedTabs.has(4) && (
          <BulkImportManager />
        );
      case 5:
        return loadedTabs.has(5) && (
          <div className="tw-mt-4">
            <TankStockTable />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="tw-relative tw-bg-gray-50 tw-min-h-screen">
      {/* Cursor - Loading overlay */}
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

      <div className="stock-management tw-overflow-y-auto tw-h-full tw-p-4">
        {/* Main Content Area - Title and Filters now in TankStockLayout header */}
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
          <div className="tw-p-4">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockManagement;
