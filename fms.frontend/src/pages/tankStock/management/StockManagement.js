import React, { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useStockData } from '../shared/hooks/useStockData';
import TransactionHub from './components/TransactionHub';
import ReconciliationWorkflow from './components/ReconciliationWorkflow';
import AdjustmentCenter from './components/AdjustmentCenter';
import ConfigurationPanel from './components/ConfigurationPanel';
import { ToolbarAnalytics } from '../../../components/toolBar/toolBarAnalytic';
import LoadIndicator from 'devextreme-react/load-indicator';
import ScrollView from 'devextreme-react/scroll-view';
import TabPanel, { Item } from 'devextreme-react/tab-panel';
import './StockManagement.scss';

//Cursor - Stock Management - Detailed transaction management and reconciliation
const StockManagement = () => {
  const sites = useSelector((state) => state.site.sites);
  const user = useSelector((state) => state.auth.user);

  const [selectedSite, setSelectedSite] = useState(() => {
    const storedSite = localStorage.getItem('selectedSite');
    return storedSite && storedSite !== 'null' ? storedSite : 'all';
  });

  const [dateRange, setDateRange] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return [thirtyDaysAgo, today];
  });

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

  const handleTransactionUpdate = useCallback(async () => {
    await refreshData();
  }, [refreshData]);

  if (isLoading) {
    return (
      <div className="tw-flex tw-justify-center tw-items-center tw-h-screen tw-bg-gray-50">
        <div className="tw-text-center">
          <LoadIndicator width={'48px'} height={'48px'} visible={true} />
          <div className="tw-mt-4 tw-text-gray-600 tw-font-medium">
            Loading management dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollView className="stock-management tw-bg-gray-50 tw-min-h-screen">
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
        <TabPanel
          height={'auto'}
          focusStateEnabled={false}
          deferRendering={true}
          selectedIndex={activeTabIndex}
          onSelectionChanged={handleTabSelectionChange}
        >
          <Item title="Transaction Management">
            {loadedTabs.has(0) && (
              <TransactionHub
                transactions={transactions}
                selectedSite={selectedSite}
                dateRange={dateRange}
                onDateRangeChange={handleDateRangeChange}
                onTransactionUpdate={handleTransactionUpdate}
              />
            )}
          </Item>
          <Item title="Reconciliation">
            {loadedTabs.has(1) && (
              <ReconciliationWorkflow
                reconciliationData={reconciliationData}
                selectedSite={selectedSite}
                dateRange={dateRange}
                onReconciliationComplete={handleTransactionUpdate}
              />
            )}
          </Item>
          <Item title="Stock Adjustments">
            {loadedTabs.has(2) && (
              <AdjustmentCenter
                adjustments={adjustments}
                selectedSite={selectedSite}
                dateRange={dateRange}
                onAdjustmentComplete={handleTransactionUpdate}
              />
            )}
          </Item>
          <Item title="Configuration">
            {loadedTabs.has(3) && (
              <ConfigurationPanel
                systemConfig={systemConfig}
                selectedSite={selectedSite}
                onConfigUpdate={handleTransactionUpdate}
              />
            )}
          </Item>
        </TabPanel>
      </div>
    </ScrollView>
  );
};

export default StockManagement;