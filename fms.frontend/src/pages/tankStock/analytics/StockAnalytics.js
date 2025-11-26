import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useStockData } from '../shared/hooks/useStockDataOptimized';
import { useStockFilters } from '../shared/context/StockFilterContext';
import FuelAnalysisSummary from './components/reporting/FuelAnalysisSummary';
import PivotGridReport from './components/reporting/PivotGridReport';
import PivotGridOptions from './components/reporting/PivotGridOptions';
import TankStockTable from './components/reporting/TankStockTable';
import PredictiveAnalytics from './components/PredictiveAnalytics';
import KPIDashboard from './components/KPIDashboard';
import VarianceAnalysis from './components/VarianceAnalysis';
import DeliveryCycleAnalysis from './DeliveryCycleAnalysis';
import TransferReconciliation from './TransferReconciliation';
import DailyReconciliation from './dailyReconciliation/DailyReconciliation';
import TankStockReportsService from '../../../services/tankStockReportsService';
import LoadIndicator from 'devextreme-react/load-indicator';
import ScrollView from 'devextreme-react/scroll-view';
import Tabs from 'devextreme-react/tabs';
import notify from 'devextreme/ui/notify';
import './StockAnalytics.scss';

//Cursor - Stock Analytics - Reporting and analysis with optimized loading
const StockAnalytics = () => {
  // Tab state
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [loadedTabs, setLoadedTabs] = useState(new Set([0]));

  // Pivot data state
  const [pivotData, setPivotData] = useState(null);
  const [pivotLoading, setPivotLoading] = useState(false);

  // Get filters from shared context
  const { startDate, endDate, selectedSiteIds, selectedTankIds } = useStockFilters();

  // Pivot-specific filter states (tab-level options)
  const [groupByPeriod, setGroupByPeriod] = useState('month');
  const [useManualDispensing, setUseManualDispensing] = useState(false);
  const [useCombinedDispensing, setUseCombinedDispensing] = useState(false);

  const initialFetchDone = useRef(false);

  //Cursor - Use shared hook for data management
  const {
    isLoading,
    forecasts,
    kpiMetrics
  } = useStockData();

  //Cursor - Tab data with icons - flattened structure
  const tabData = [
    { text: "Reports", icon: "fa-light fa-file-chart-line" },
    { text: "Pivot Grid", icon: "fa-light fa-chart-pivot" },
    { text: "Daily Reconciliation", icon: "fa-light fa-calendar-check" },
    { text: "Variance Analysis", icon: "fa-light fa-chart-mixed" },
    { text: "Delivery Cycle Analysis", icon: "fa-light fa-truck-clock" },
    { text: "Transfer Reconciliation", icon: "fa-light fa-exchange-alt" },
    { text: "Tank Stock Table", icon: "fa-light fa-table" }
    // { text: "Interactive Dashboard", icon: "fa-light fa-chart-line" },
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

  // Load pivot data
  const loadPivotData = useCallback(async () => {
    if (!startDate || !endDate) {
      return;
    }

    setPivotLoading(true);
    try {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const params = {
        startDate: startDateStr,
        endDate: endDateStr,
        groupByPeriod,
        siteIds: selectedSiteIds.length > 0 ? selectedSiteIds : undefined,
        tankIds: selectedTankIds && selectedTankIds.length > 0 ? selectedTankIds : undefined,
        useManualDispensing,
        useCombinedDispensing
      };

      const pivotResult = await TankStockReportsService.getPivotData(params);

      if (pivotResult.success) {
        setPivotData(pivotResult.data);
        notify({
          message: `Loaded pivot data successfully`,
          type: 'success',
          displayTime: 3000
        });
      } else {
        notify({
          message: `Failed to load pivot data: ${pivotResult.error}`,
          type: 'error',
          displayTime: 5000
        });
      }

    } catch (error) {
      console.error('Error loading pivot data:', error);
      notify({
        message: `Failed to load pivot data: ${error.message}`,
        type: 'error',
        displayTime: 5000
      });
    } finally {
      setPivotLoading(false);
    }
  }, [startDate, endDate, groupByPeriod, selectedSiteIds, selectedTankIds, useManualDispensing, useCombinedDispensing]);

  // Load pivot data when on Pivot Grid tab and filters change
  useEffect(() => {
    if (activeTabIndex === 1 && startDate && endDate) {
      loadPivotData();
    }
  }, [activeTabIndex, startDate, endDate, selectedSiteIds, selectedTankIds, groupByPeriod, useManualDispensing, useCombinedDispensing, loadPivotData]);

  // Initialize component and load pivot data once
  useEffect(() => {
    if (!initialFetchDone.current && activeTabIndex === 1) {
      initialFetchDone.current = true;
      loadPivotData();
    }
  }, [loadPivotData, activeTabIndex]);

  //Cursor - Render content based on active tab
  const renderContent = () => {
    switch (activeTabIndex) {
      case 0:
        // Reports tab - Simple overview
        return loadedTabs.has(0) && (
          <div className="tw-p-4">
            <div className="tw-text-center tw-py-12">
              <i className="fa-light fa-file-chart-line tw-text-4xl tw-text-gray-400 tw-mb-4"></i>
              <h3 className="tw-text-xl tw-font-semibold tw-text-gray-600 tw-mb-2">
                Reports Overview
              </h3>
              <p className="tw-text-gray-500">
                Select Pivot Grid or Tank Stock Table tabs for detailed reports.
              </p>
            </div>
          </div>
        );
      case 1:
        // Pivot Grid tab
        return loadedTabs.has(1) && (
          <>
            {/* Pivot Grid Options */}
            <PivotGridOptions
              groupByPeriod={groupByPeriod}
              onGroupByPeriodChange={setGroupByPeriod}
              useManualDispensing={useManualDispensing}
              onUseManualDispensingChange={setUseManualDispensing}
              useCombinedDispensing={useCombinedDispensing}
              onUseCombinedDispensingChange={setUseCombinedDispensing}
              loading={pivotLoading}
            />

            {/* Loading Indicator */}
            {pivotLoading && (
              <div className="tw-flex tw-justify-center tw-items-center tw-py-8">
                <LoadIndicator visible={true} />
                <span className="tw-ml-3 tw-text-gray-600">Loading pivot data...</span>
              </div>
            )}

            {/* Pivot Grid */}
            <div className="tw-space-y-6 tw-flex tw-flex-col tw-mt-4" style={{ flex: 1, minHeight: 0 }}>
              <PivotGridReport
                key="pivot-grid-report"
                data={pivotData}
                reportType={groupByPeriod.charAt(0).toUpperCase() + groupByPeriod.slice(1)}
                loading={pivotLoading}
                visible={!pivotLoading && !!pivotData}
                minHeight={500}
              />
            </div>

            {/* Fuel Analysis Summary */}
            {!pivotLoading && pivotData?.data?.length > 0 && (
              <FuelAnalysisSummary data={pivotData} />
            )}

            {/* No Data Message */}
            {!pivotLoading && !pivotData?.data?.length && (
              <div className="tw-text-center tw-py-12">
                <i className="fa-light fa-chart-line tw-text-4xl tw-text-gray-400 tw-mb-4"></i>
                <h3 className="tw-text-xl tw-font-semibold tw-text-gray-600 tw-mb-2">
                  No Data Available
                </h3>
                <p className="tw-text-gray-500">
                  No pivot data available for the current date range.
                </p>
              </div>
            )}
          </>
        );
      case 2:
        // Daily Reconciliation tab
        return loadedTabs.has(2) && (
          <DailyReconciliation />
        );
      case 3:
        // Variance Analysis tab
        return loadedTabs.has(3) && (
          <VarianceAnalysis />
        );
      case 4:
        // Delivery Cycle Analysis tab
        return loadedTabs.has(4) && (
          <DeliveryCycleAnalysis />
        );
      case 5:
        // Transfer Reconciliation tab
        return loadedTabs.has(5) && (
          <TransferReconciliation />
        );
      case 6:
        // Tank Stock Table tab
        return loadedTabs.has(6) && (
          <div className="tw-mt-4">
            <TankStockTable />
          </div>
        );
      case 7:
        return loadedTabs.has(7) && (
          <PredictiveAnalytics
            forecasts={forecasts}

          />
        );
      case 8:
        return loadedTabs.has(8) && (
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