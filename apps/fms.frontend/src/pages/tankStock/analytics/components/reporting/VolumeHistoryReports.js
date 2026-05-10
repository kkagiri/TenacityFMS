import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useStockFilters } from '../../../shared/context/StockFilterContext';
import TankStockReportsService from '../../../../../services/tankStockReportsService';
import PivotGridReport from './PivotGridReport';
import FuelAnalysisSummary from './FuelAnalysisSummary';
import PivotGridOptions from './PivotGridOptions';
import TankStockTable from './TankStockTable';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import Tabs from 'devextreme-react/tabs';
import notify from 'devextreme/ui/notify';
import './VolumeHistoryReports.scss';

const VolumeHistoryReports = () => {
  // Tab state
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [loadedTabs, setLoadedTabs] = useState(new Set([0]));

  // Pivot data state
  const [pivotData, setPivotData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Get filters from shared context (provided by TankStockLayout)
  const { startDate, endDate, selectedSiteIds, selectedTankIds } = useStockFilters();

  // Pivot-specific filter states (tab-level options)
  const [groupByPeriod, setGroupByPeriod] = useState('month');
  const [useManualDispensing, setUseManualDispensing] = useState(false);
  const [useCombinedDispensing, setUseCombinedDispensing] = useState(false);

  const initialFetchDone = useRef(false);

  // Tab data
  const tabData = [
    { text: "Pivot Grid Report", icon: "fa-light fa-chart-pivot" },
    { text: "Tank Stock Table", icon: "fa-light fa-table" }
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

    setLoading(true);
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
      setLoading(false);
    }
  }, [startDate, endDate, groupByPeriod, selectedSiteIds, selectedTankIds, useManualDispensing, useCombinedDispensing]);

  // Load pivot data when filters change (from shared context)
  useEffect(() => {
    if (activeTabIndex === 0 && startDate && endDate) {
      loadPivotData();
    }
  }, [activeTabIndex, startDate, endDate, selectedSiteIds, selectedTankIds, groupByPeriod, useManualDispensing, useCombinedDispensing, loadPivotData]);

  // Initialize component and load pivot data once
  useEffect(() => {
    if (!initialFetchDone.current && activeTabIndex === 0) {
      initialFetchDone.current = true;
      loadPivotData();
    }
  }, [loadPivotData, activeTabIndex]);

  // Render tab content
  const renderContent = () => {
    switch (activeTabIndex) {
      case 0:
        return loadedTabs.has(0) && (
          <>
            {/* Pivot Grid Options */}
            <PivotGridOptions
              groupByPeriod={groupByPeriod}
              onGroupByPeriodChange={setGroupByPeriod}
              useManualDispensing={useManualDispensing}
              onUseManualDispensingChange={setUseManualDispensing}
              useCombinedDispensing={useCombinedDispensing}
              onUseCombinedDispensingChange={setUseCombinedDispensing}
              loading={loading}
            />

            {/* Loading Indicator */}
            {loading && (
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
                loading={loading}
                visible={!loading && !!pivotData}
                minHeight={500}
              />
            </div>

            {/* Fuel Analysis Summary */}
            {!loading && pivotData?.data?.length > 0 && (
              <FuelAnalysisSummary data={pivotData} />
            )}

            {/* No Data Message */}
            {!loading && !pivotData?.data?.length && (
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
      case 1:
        return loadedTabs.has(1) && (
          <div className="tw-mt-4">
            <TankStockTable />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="volume-history-reports tw-p-4 tw-flex tw-flex-col" style={{ height: '100%', minHeight: 0 }}>
      {/* Title and Filters now in TankStockLayout header */}

      {/* Tabs */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow tw-overflow-hidden">
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
  );
};

export default VolumeHistoryReports;
