import React, { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useStockData } from '../shared/hooks/useStockDataOptimized';
import { useDateRange } from '../../../hooks/useDateRange';
import FilterInfoBar from '../components/FilterInfoBar';
import ReportingEngine from './components/ReportingEngine';
import PredictiveAnalytics from './components/PredictiveAnalytics';
import KPIDashboard from './components/KPIDashboard';
import LoadIndicator from 'devextreme-react/load-indicator';
import ScrollView from 'devextreme-react/scroll-view';
import Tabs from 'devextreme-react/tabs';
import './StockAnalytics.scss';

//Cursor - Stock Analytics - Reporting and analysis with optimized loading
const StockAnalytics = () => {
  const sites = useSelector((state) => state.site.sites);
  const user = useSelector((state) => state.auth.user);



  // Use stable date range hook

  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [loadedTabs, setLoadedTabs] = useState(new Set([0]));

  //Cursor - Use shared hook for data management
  const {
    isLoading,
    reports,
    forecasts,
    kpiMetrics
  } = useStockData();

  //Cursor - Tab data with icons
  const tabData = [
    // { text: "Interactive Dashboard", icon: "fa-light fa-chart-line" },
    { text: "Reports", icon: "fa-light fa-file-chart-line" }
    // { text: "Predictive Analytics", icon: "fa-light fa-chart-mixed" },
    // { text: "KPI Dashboard", icon: "fa-light fa-gauge-high" }
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

  const handleTabSelectionChange = useCallback((e) => {
    const newIndex = e.itemIndex;
    setActiveTabIndex(newIndex);
    setLoadedTabs(prev => new Set([...prev, newIndex]));
  }, []);

  //Cursor - Render content based on active tab
  const renderContent = () => {
    switch (activeTabIndex) {
      case 0:
        return loadedTabs.has(0) && (
          <ReportingEngine
            reports={reports}

          />
        );
      case 1:
        return loadedTabs.has(1) && (
          <PredictiveAnalytics
            forecasts={forecasts}

          />
        );
      case 2:
        return loadedTabs.has(2) && (
          <KPIDashboard
            kpiMetrics={kpiMetrics}

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
              Loading analytics...
            </div>
          </div>
        </div>
      )}

      <ScrollView className="stock-analytics">
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
          <div className="tw-p-2">
            {renderContent()}
          </div>
        </div>
      </ScrollView>
    </div>
  );
};

export default StockAnalytics;