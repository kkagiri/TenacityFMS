import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Tabs from 'devextreme-react/tabs';
import { setActiveTab, selectActiveTab } from '../../redux/slices/reconciliationSlice';
import { usePermissions } from '../../hooks/usePermissions';
import ManualReconciliationPanel from './ManualReconciliationPanel';
import BatchReconciliationTool from './BatchReconciliationTool';
import DataQualityDashboard from './DataQualityDashboard';
import './reconciliation.scss';

/**
 * Reconciliation Main Component
 * Container with tab navigation for all reconciliation features
 */
const ReconciliationMain = () => {
  const dispatch = useDispatch();
  const activeTab = useSelector(selectActiveTab);
  const { hasPermission } = usePermissions();
  const [loadedTabs, setLoadedTabs] = useState(new Set([0]));

  const canRead = hasPermission('_Read_TankStock');

  // Permission gate
  if (!canRead) {
    return (
      <div className="tw-relative tw-bg-gray-50 tw-min-h-screen">
        <div className="tw-p-4">
          <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-16 tw-text-center">
            <i className="fa-light fa-lock tw-text-8xl tw-text-gray-400 tw-mb-6"></i>
            <h2 className="tw-text-3xl tw-font-bold tw-text-gray-700 tw-mb-3">
              Access Restricted
            </h2>
            <p className="tw-text-lg tw-text-gray-600 tw-mb-6">
              You don't have permission to access the Tank Stock Reconciliation system.
            </p>
            <p className="tw-text-sm tw-text-gray-500">
              Please contact your system administrator to request access.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Tab data
  const tabData = [
    { text: "Manual Check", icon: "fa-light fa-magnifying-glass" },
    { text: "Batch Operations", icon: "fa-light fa-layer-group" },
    { text: "Data Quality", icon: "fa-light fa-chart-line" },
  ];

  // Custom tab item renderer
  const renderTabItem = (item) => {
    return (
      <div className="tw-flex tw-items-center tw-gap-2">
        <i className={item.icon}></i>
        <span>{item.text}</span>
      </div>
    );
  };

  // Handle tab change and lazy loading
  const handleTabSelectionChange = (e) => {
    const newIndex = e.itemIndex;
    dispatch(setActiveTab(newIndex));
    setLoadedTabs(prev => new Set([...prev, newIndex]));
  };

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 0:
        return loadedTabs.has(0) && <ManualReconciliationPanel />;
      case 1:
        return loadedTabs.has(1) && <BatchReconciliationTool />;
      case 2:
        return loadedTabs.has(2) && <DataQualityDashboard />;
      default:
        return null;
    }
  };

  return (
    <div className="tw-relative tw-bg-gray-50 tw-min-h-screen">
      <div className="tw-overflow-y-auto tw-h-full tw-p-4">
        {/* Main Content Area */}
        <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-overflow-hidden">
          {/* Tabs Navigation */}
          <Tabs
            dataSource={tabData}
            selectedIndex={activeTab}
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

export default ReconciliationMain;
