import { useState, useCallback } from 'react';
import Tabs from 'devextreme-react/tabs';
import FuelDataComparisonDashboard from './dashboard/FuelDataComparisonDashboard';
import FuelRefillTab from './FuelRefillTab';
import './FuelDataComparisonMain.scss';

/**
 * FuelDataComparisonMain - Main container for Fuel Data Comparison sub-module
 *
 * This component handles tab switching between the fuel comparison dashboard
 * and fuel refill data management. It integrates with TankStock's StockFilterContext
 * for filtering capabilities.
 *
 * Tabs:
 * - 0: Comparison Dashboard (main comparison view)
 * - 1: Fuel Refill Data (fuel refill data management)
 *
 * @returns {JSX.Element} Fuel Data Comparison container
 */
const FuelDataComparisonMain = () => {
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [loadedTabs, setLoadedTabs] = useState(new Set([0]));

  // Tab data
  const tabData = [
    { text: "Comparison Dashboard", icon: "fa-light fa-chart-column" },
    { text: "Fuel Refill Data", icon: "fa-light fa-gas-pump" }
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
  const handleTabSelectionChange = useCallback((e) => {
    const newIndex = e.itemIndex;
    setSelectedTabIndex(newIndex);
    setLoadedTabs(prev => new Set([...prev, newIndex]));
  }, []);

  // Render content based on active tab
  const renderContent = () => {
    switch (selectedTabIndex) {
      case 0:
        return loadedTabs.has(0) && <FuelDataComparisonDashboard />;
      case 1:
        return loadedTabs.has(1) && <FuelRefillTab />;
      default:
        return null;
    }
  };

  return (
    <div className="fuel-data-comparison-main tw-bg-white tw-rounded-lg tw-shadow-md tw-overflow-hidden">
      {/* Tabs Navigation */}
      <Tabs
        dataSource={tabData}
        selectedIndex={selectedTabIndex}
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
  );
};

export default FuelDataComparisonMain;
