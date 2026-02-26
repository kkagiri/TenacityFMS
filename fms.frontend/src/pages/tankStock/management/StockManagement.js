/**
 * File: StockManagement.js
 * Purpose: Hosts Tank Stock management tabs with URL-based navigation and role-aware visibility
 * Dependencies: React, react-router-dom, usePermissions, Tank Stock management components
 * Last Modified: 2026-02-10
 *
 * Key Functions/Components:
 * - StockManagement(): Renders URL-driven tabs under /tankstock/stock-management/<tab>
 */
import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStockFilters } from '../shared/context/StockFilterContext';
import { useStockData } from '../shared/hooks/useStockDataOptimized';
import TransactionHub from './components/TransactionHub';
import DispensingManager from './components/DispensingManager';
import BulkImportManager from './components/bulkImport/BulkImportManager';
import DeliveryManager from './components/DeliveryManager';
import TankStockTable from '../analytics/components/reporting/TankStockTable';
import LoadIndicator from 'devextreme-react/load-indicator';
import Tabs from 'devextreme-react/tabs';
import { usePermissions } from '../../../hooks/usePermissions';
import './StockManagement.scss';

const STOCK_MANAGEMENT_BASE_PATH = '/tankstock/stock-management';

//Cursor - Stock Management Page - Main container with shared filters from TankStockLayout
const StockManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Get filters from shared context (provided by TankStockLayout)
  const { dateRange } = useStockFilters();
  const { hasPermission } = usePermissions();
  const isAdmin = hasPermission('_Update_TankStock');

  const [selectedSite] = useState(() => {
    const storedSite = localStorage.getItem('selectedSite');
    return storedSite && storedSite !== 'null' ? storedSite : 'all';
  });

  // Set default tab to Transaction Hub (index 0)
  //Cursor - Use shared hook for data management
  const { isLoading } = useStockData(selectedSite, dateRange);

  //Cursor - Tab data
  const allTabData = useMemo(() => [
    { key: 'transactionHub', text: "Transaction Hub", icon: "fa-light fa-exchange-alt", path: 'transaction-hub' },
    { key: 'deliveryManagement', text: "Delivery Management", icon: "fa-light fa-truck-container", path: 'delivery-management' },
    { key: 'dispensingVolumes', text: "Dispensing Volumes", icon: "fa-light fa-tint", path: 'dispensing-volumes', adminOnly: true },
    { key: 'bulkImport', text: "Bulk Import", icon: "fa-light fa-file-upload", path: 'bulk-import', adminOnly: true },
    { key: 'tankStockTable', text: "Tank Stock Table", icon: "fa-light fa-table", path: 'tank-stock-table', adminOnly: true },
  ], []);

  const tabData = useMemo(
    () => allTabData.filter((tab) => !tab.adminOnly || isAdmin),
    [allTabData, isAdmin]
  );

  const activeTabIndex = useMemo(() => {
    const matchIndex = tabData.findIndex(
      (tab) => location.pathname === `${STOCK_MANAGEMENT_BASE_PATH}/${tab.path}`
    );
    return matchIndex >= 0 ? matchIndex : 0;
  }, [location.pathname, tabData]);

  const activeTab = tabData[activeTabIndex];

  // Redirect invalid or base URL paths to first visible tab.
  useEffect(() => {
    if (tabData.length === 0) {
      return;
    }

    const isBasePath =
      location.pathname === STOCK_MANAGEMENT_BASE_PATH ||
      location.pathname === `${STOCK_MANAGEMENT_BASE_PATH}/`;

    const isValidTabPath = tabData.some(
      (tab) => location.pathname === `${STOCK_MANAGEMENT_BASE_PATH}/${tab.path}`
    );

    if (isBasePath || !isValidTabPath) {
      navigate(`${STOCK_MANAGEMENT_BASE_PATH}/${tabData[0].path}`, { replace: true });
    }
  }, [location.pathname, navigate, tabData]);

  //Cursor - Custom tab item renderer
  const renderTabItem = (item) => {
    return (
      <div className="tw-flex tw-items-center tw-gap-2">
        <i className={item.icon}></i>
        <span>{item.text}</span>
      </div>
    );
  };

  //Cursor - Handle tab change via URL navigation
  const handleTabSelectionChange = (e) => {
    const newIndex = e.itemIndex;
    const selectedTab = tabData[newIndex];
    if (selectedTab) {
      navigate(`${STOCK_MANAGEMENT_BASE_PATH}/${selectedTab.path}`);
    }
  };

  //Cursor - Render content based on active tab
  const renderContent = () => {
    switch (activeTab?.key) {
      case 'transactionHub':
        return (
          <TransactionHub
            selectedSite={selectedSite}
            dateRange={dateRange}
          />
        );
      case 'deliveryManagement':
        return (
          <DeliveryManager />
        );
      case 'dispensingVolumes':
        return (
          <DispensingManager />
        );
      case 'bulkImport':
        return (
          <BulkImportManager />
        );
      case 'tankStockTable':
        return (
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
