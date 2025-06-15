//Page for Dashboard of Tank transactions and Tank fuel level Dashboarad

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { fetchTankVolumeHistoryBySiteId, fetchTankVolumeHistoryByDateRange } from "../../redux/actions/tankVolumeHistoryActions";
import { fetchTanks } from "../../redux/actions/tankActions";
import { fetchSiteList } from "../../redux/actions/siteActions";
import { fetchUsers } from "../../redux/actions/userActions";
import { fetchpermissionbyUserId } from "../../redux/actions/permissionActions";
import { createOpeningStock } from '../../redux/actions/tankStockAction';
import { createClosingStock } from "../../redux/actions/tankStockAction";
import TankStockDashBoardCards from "./tankStockDashBoardCards";
import TankVolumeHistoryCard from '../../components/cards/TankVolumeHistoryCardLineChart';
import FuelRefillSummaryDatagrid from '../../components/fuelRefill/fuelRefillSummaryDatagrid';

import { createDelivery, fetchDeliveriesbyDateRange, fetchDeliveriesbyDateRangebySiteId } from "../../redux/actions/DeliveryActions";
import { createTankTransfer } from "../../redux/actions/tankStockAction";
import { prepareOpeningClosingStockParams, prepareDeliveryDTO, prepareTankTransferDTO } from "../../utils/stockDataPreparation";
import TankHistoryVolumeDatagrid from "./../../components/tankStock/tankHistoryVolumeDatagrid";
import { fetchConsumptionByDateRange, fetchConsumptionByDateRangebySitId } from "../../redux/actions/consumptionActions";
import TankDeliveryDatagrid from '../../components/TankDeliveryDataGrid/tankDeliverydataGrid';
//Cursor - Import new stock management components and hooks
import { useStockManagement } from '../../hooks/useStockManagement';
import { useTankStockSignalR } from '../../hooks/useTankStockSignalR';
import StockAdjustmentForm from '../../components/tankStock/StockAdjustmentForm';
import StockAdjustmentList from '../../components/tankStock/StockAdjustmentList';
import StockReconciliationDashboard from '../../components/tankStock/StockReconciliationDashboard';
import StockReportDashboard from '../../components/tankStock/StockReportDashboard';

import './tankStockPage.scss';
import Tabs from 'devextreme-react/tabs';
import { Item as ToolbarItem } from 'devextreme-react/toolbar';
import TabPanel, { Item  } from 'devextreme-react/tab-panel';
import SelectBox from 'devextreme-react/select-box';
import { useDispatch, useSelector } from "react-redux";
import LoadIndicator from 'devextreme-react/load-indicator';
import ScrollView from 'devextreme-react/scroll-view';
import DateRangeBox from 'devextreme-react/date-range-box';
import Popup from "devextreme-react/popup";
import { ToolbarAnalytics } from '../../components/toolBar/toolBarAnalytic';
import { DatePeriods } from "../../components/Shared/datePeriods";
import notify from 'devextreme/ui/notify';
import CheckBox from "devextreme-react/check-box";
import Button from 'devextreme-react/button';
import axiosInstance from '../../api/axiosInstance';

const DEFAULT_ANALYTICS_PERIOD_KEY = 'Today';

const formatDate = (date) => {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '/');
};
const formatDateForAPI = (date) => {
  return date.toISOString().split('T')[0];
};


const useInterval = (callback, delay) => {
  const savedCallback = React.useRef();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
};





//Cursor - Updated data fetching with SignalR integration
const useFetchData = (selectedSite, initialDateRange) => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async (dateRange = initialDateRange) => {
    try {
      setIsLoading(true);
      const [startDate, endDate] = dateRange;

      if (selectedSite === 'all') {
        await dispatch(fetchTankVolumeHistoryByDateRange(startDate, endDate));
        await dispatch(fetchConsumptionByDateRange(startDate, endDate));
        await dispatch(fetchDeliveriesbyDateRange(startDate, endDate));
      } else {
        await dispatch(fetchTankVolumeHistoryBySiteId(startDate, endDate, selectedSite));
        await dispatch(fetchConsumptionByDateRangebySitId(startDate, endDate, selectedSite));
        await dispatch(fetchDeliveriesbyDateRangebySiteId(startDate, endDate, selectedSite));
      }

      await Promise.all([
        dispatch(fetchTanks()),
        dispatch(fetchSiteList()),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      notify('Error fetching data', 'error', 3000);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, selectedSite]);

  //Cursor - Initial data fetch only, SignalR will handle real-time updates
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  //Cursor - Removed interval-based polling, now using SignalR
  return { isLoading, fetchData };
};



const TankStockPage = () => {

  const user = useSelector((state) => state.auth.user);
  const sites = useSelector((state) => state.site.sites);
  const dispatch = useDispatch();
  const tanks = useSelector((state) => state.tank.tanks);
  const [selectedEndDate, setSelectedEndDate] = useState(new Date());

  const tankVolumeHistory = useSelector((state) => state.tankVolumeHistory.tankVolumeHistory);
  const tankDeliveryData = useSelector((state) => state.delivery.deliveries);
  const [saving, setSaving] = useState(false);
  const [isInsertingHistorical, setIsInsertingHistorical] = useState(false);

  //Cursor - Add stock management hook and state variables
  const { createStockAdjustment, fetchReconciliationDiscrepancies, reconcileStocks } = useStockManagement();
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [adjustmentRefreshTrigger, setAdjustmentRefreshTrigger] = useState(0);
  const [showReconciliationDashboard, setShowReconciliationDashboard] = useState(false);
  const [showReportDashboard, setShowReportDashboard] = useState(false);

  // Move state variable declarations before SignalR hook
  const [selectedSite, setSelectedSite] = useState(() => {
    const storedSite = localStorage.getItem('selectedSite');
    return storedSite && storedSite !== 'null' ? storedSite : 'all';
  });

  const [selectedPeriod, setSelectedPeriod] = useState(() =>
    localStorage.getItem('selectedPeriod') || 'Today'
  );
  const [dateRange, setDateRange] = useState(() => {
    const today = formatDateForAPI(new Date());
    return [today, today];
  });

  //Cursor - Add SignalR hook for real-time updates
  const { isConnected: signalRConnected, requestTankDataRefresh } = useTankStockSignalR(
    selectedSite,
    dateRange,
    true // Enable SignalR updates
  );

  //Cursor - Add lazy loading states for tabs
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [loadedTabs, setLoadedTabs] = useState(new Set([0])); // Load first tab by default

  const [isFilterPopupVisible, setIsFilterPopupVisible] = useState(false);
  const [activeFilterType, setActiveFilterType] = useState('period');
  const [appliedFilterType, setAppliedFilterType] = useState('period');
  const [appliedPeriod, setAppliedPeriod] = useState(DEFAULT_ANALYTICS_PERIOD_KEY);
  const [appliedCustomDateRange, setAppliedCustomDateRange] = useState(() => {
    const today = new Date();
    return [today, today];
  });
  const [tempSelectedPeriod, setTempSelectedPeriod] = useState(DEFAULT_ANALYTICS_PERIOD_KEY);
  const [tempCustomDateRange, setTempCustomDateRange] = useState(() => {
    const today = new Date();
    return [today, today];
  });

  const [isReconciling, setIsReconciling] = useState(false);

  const handlePeriodChange = useCallback((e) => {
    setTempSelectedPeriod(e.value);
  }, []);



  const handleCustomDateRangeChange = useCallback((e) => {
    if (e.value && e.value.length === 2) {
      setTempCustomDateRange(e.value);
    }
  }, []);

  const [customDateRange, setCustomDateRange] = useState(() => {
    const today = new Date();
    return [today, today];
  });
  const Analytics_period = useMemo(() => DatePeriods(), []);

  const periodItems = useMemo(() =>
    [
      ...Object.entries(Analytics_period).map(([key, value]) => ({
        text: key,
        value: key,
        index: value.index
      }))
    ]
    , [Analytics_period]);

  // const dateRange = useMemo(() => {
  //   //Update date range calculation to handle Custom period
  //   if (selectedPeriod === 'Custom' && customDateRange) {
  //     return customDateRange.map(date => date.toISOString().split('T')[0]);
  //   }
  //   return Analytics_period[selectedPeriod]?.period.split('/') || [];
  // }, [Analytics_period, selectedPeriod, customDateRange]);


  useEffect(() => {
    if (dateRange && dateRange.length === 2) {
        setSelectedEndDate(new Date(dateRange[1]));
    }
}, [dateRange]);
  const { isLoading, fetchData } = useFetchData(selectedSite, dateRange);

  //Cursor - Enhanced fetchData to also request SignalR refresh when needed
  const enhancedFetchData = useCallback(async (newDateRange) => {
    await fetchData(newDateRange);
    // Also request SignalR refresh for real-time updates
    if (signalRConnected && requestTankDataRefresh) {
      setTimeout(() => requestTankDataRefresh(), 1000);
    }
  }, [fetchData, signalRConnected, requestTankDataRefresh]);

  const handleApplyFilter = useCallback(() => {
    let newDateRange;
    if (activeFilterType === 'period') {
      setAppliedFilterType('period');
      setAppliedPeriod(tempSelectedPeriod);
      setSelectedPeriod(tempSelectedPeriod);
      localStorage.setItem('selectedPeriod', tempSelectedPeriod);

      // Calculate new date range based on selected period
      const periodDates = Analytics_period[tempSelectedPeriod]?.period.split('/');
      newDateRange = periodDates ? periodDates.map(date => formatDateForAPI(new Date(date))) : [formatDateForAPI(new Date()), formatDateForAPI(new Date())];
    } else {
      setAppliedFilterType('custom');
      setAppliedCustomDateRange(tempCustomDateRange);
      newDateRange = tempCustomDateRange.map(date => formatDateForAPI(date));
    }

    // Update dateRange state
    setDateRange(newDateRange);

    // Close popup and trigger data fetch
    setIsFilterPopupVisible(false);
    enhancedFetchData(newDateRange);
  }, [activeFilterType, tempSelectedPeriod, tempCustomDateRange, Analytics_period, enhancedFetchData]);



  useEffect(() => {
    localStorage.setItem('selectedSite', selectedSite);
  }, [selectedSite]);

  useEffect(() => {
    localStorage.setItem('selectedPeriod', selectedPeriod);
  }, [selectedPeriod]);



  const handleSiteChange = useCallback((e) => {
    const newSite = e.value || 'all';
    setSelectedSite(newSite);
    localStorage.setItem('selectedSite', newSite);
    setIsFilterPopupVisible(false);
  }, []);
  const { currentStock, totalCapacity } = useMemo(() => {

    return tanks.reduce((acc, tank) => {
      if (selectedSite === 'all' || tank.siteId === selectedSite) {
        acc.currentStock += tank.currentStock;
        acc.totalCapacity += tank.tankVolume;
      }
      return acc;
    }, { currentStock: 0, totalCapacity: 0 });

    return { currentStock: null, totalCapacity: null };
  }, [tanks, selectedSite, selectedPeriod]);

  //Cursor - Handle tab selection change for lazy loading
  const handleTabSelectionChange = useCallback((e) => {
    const newIndex = e.selectedIndex;
    setActiveTabIndex(newIndex);
    setLoadedTabs(prev => new Set([...prev, newIndex]));
  }, []);


  useEffect(() => {
    enhancedFetchData();
  }, [selectedSite, enhancedFetchData, dateRange]);

  //Cursor - Enhanced filter popup with Tailwind styling
  const renderFilterPopup = () => (
    <Popup
      visible={isFilterPopupVisible}
      onHiding={() => setIsFilterPopupVisible(false)}
      title="Date Filter"
      maxWidth={500}
      height='auto'
      showCloseButton={true}
      dragEnabled={false}
      position={{ my: 'center', at: 'center', of: window }}
    >
      <div className="tw-p-6 tw-space-y-6">
        <div className="tw-flex tw-items-center tw-space-x-4">
          <CheckBox
            text="Period Filter"
            value={activeFilterType === 'period'}
            onValueChanged={(e) => setActiveFilterType(e.value ? 'period' : 'custom')}
          />
          <div className="tw-flex-1">
            <SelectBox
              dataSource={periodItems}
              value={tempSelectedPeriod}
              onValueChanged={handlePeriodChange}
              width="100%"
              displayExpr="text"
              valueExpr="value"
              disabled={activeFilterType !== 'period'}
            />
          </div>
        </div>

        <div className="tw-flex tw-items-center tw-space-x-4">
          <CheckBox
            text="Custom Filter"
            value={activeFilterType === 'custom'}
            onValueChanged={(e) => setActiveFilterType(e.value ? 'custom' : 'period')}
          />
          <div className="tw-flex-1">
            <DateRangeBox
              startDate={tempCustomDateRange[0]}
              endDate={tempCustomDateRange[1]}
              onValueChanged={handleCustomDateRangeChange}
              width="100%"
              disabled={activeFilterType !== 'custom'}
            />
          </div>
        </div>

        <div className="tw-flex tw-justify-end tw-pt-4 tw-border-t tw-border-gray-200">
          <Button
            text="Apply Filter"
            onClick={handleApplyFilter}
            disabled={!activeFilterType}
            stylingMode="contained"
            type="default"
          />
        </div>
      </div>
    </Popup>
  );


  const tabPanelItems = [
    {
      title: "All Tank Volume History",
      component: () => <TankHistoryVolumeDatagrid tankVolumeHistory={tankVolumeHistory} selectedSite={selectedSite} selectedPeriod={selectedPeriod} />
    },
    {
      title: "Deliveries",
      component: () => <TankDeliveryDatagrid tankDeliveryData={tankDeliveryData} />
    }
  ];
  const itemTitleRender = (item) => {
    return <span>{item.title}</span>;
  };


  const handleOpenFilter = useCallback(() => {
    setTempSelectedPeriod(appliedPeriod);
    setTempCustomDateRange(appliedCustomDateRange);
    setActiveFilterType(appliedFilterType);
    setIsFilterPopupVisible(true);
  }, [appliedPeriod, appliedCustomDateRange, appliedFilterType]);




  const handleStockSubmit = useCallback(async (formData, actionType) => {

    setSaving(true);
    try {
      let action, successMessage, errorMessage, prepareData, isQuery;

      switch (actionType) {
        case 'opening':
          action = createOpeningStock;
          successMessage = 'Opening stock added successfully';
          errorMessage = 'Failed to add opening stock';
          prepareData = prepareOpeningClosingStockParams;
          isQuery = true;
          break;
        case 'closing':
          action = createClosingStock;
          successMessage = 'Closing stock added successfully';
          errorMessage = 'Failed to add closing stock';
          prepareData = prepareOpeningClosingStockParams;
          isQuery = true;
          break;
        case 'delivery':
          action = createDelivery;
          successMessage = 'Delivery added successfully';
          errorMessage = 'Failed to add delivery';
          prepareData = prepareDeliveryDTO;
          isQuery = false;
          break;
        case 'transfer':
          action = createTankTransfer;
          successMessage = 'Transfer added successfully';
          errorMessage = 'Failed to add transfer';
          prepareData = prepareTankTransferDTO;
          isQuery = false;
          break;
        default:
          throw new Error('Invalid action type');
      }
      const preparedData = prepareData(formData);
      const [startDate, endDate] = dateRange;
      const submittedDate = new Date(preparedData.date);
      if (submittedDate < new Date(startDate) || submittedDate > new Date(endDate)) {
        setIsInsertingHistorical(true);
      }

      let response;


      if (isQuery) {
        // For FromQuery parameters
        response = await dispatch(action(preparedData.tankId, preparedData.amount, preparedData.date));
      } else {
        // For FromBody DTOs
        response = await dispatch(action(preparedData));
      }

      if (response.success) {
        notify(response.message || successMessage, 'success', 3000);
        if (isInsertingHistorical) {
          await dispatch(fetchTankVolumeHistoryBySiteId(submittedDate, submittedDate, preparedData.siteId));
        } else {
          await enhancedFetchData(); // Refresh all data for the current view
        }

        setIsInsertingHistorical(false);
        setSaving(false);
        return { success: true, message: response.message };
      } else {
        setSaving(false);

        notify(response.message || errorMessage, 'error', 5000);
        return { success: false, message: response.message };
      }
    } catch (error) {
      setSaving(false);

      console.error(`Error in ${actionType} action:`, error);
      notify('An unexpected error occurred', 'error', 3000);
      return { success: false, message: 'An unexpected error occurred' };
    }
  }, [dispatch, enhancedFetchData]);

  const handleOpeningStockSubmit = useCallback((formData) => handleStockSubmit(formData, 'opening'), [handleStockSubmit]);
  const handleClosingStockSubmit = useCallback((formData) => handleStockSubmit(formData, 'closing'), [handleStockSubmit]);
  const handleDeliverySubmit = useCallback((formData) => handleStockSubmit(formData, 'delivery'), [handleStockSubmit]);
  const handleTransferSubmit = useCallback((formData) => handleStockSubmit(formData, 'transfer'), [handleStockSubmit]);

  // New function to handle tank stock reconciliation
  const handleReconcileTankStocks = useCallback(async () => {
    try {
      setIsReconciling(true);
      notify('Reconciling tank stocks with volume history...', 'info', 2000);

      const response = await axiosInstance.post('/tankstock/reconcile', {
        siteId: selectedSite !== 'all' ? selectedSite : null,
        userId: user.id
      });

      if (response.data.success) {
        notify(response.data.message || 'Tank stocks reconciled successfully', 'success', 3000);
        enhancedFetchData(); // Refresh data after reconciliation
      } else {
        notify(response.data.message || 'Error reconciling tank stocks', 'error', 5000);
      }
    } catch (error) {
      console.error('Error reconciling tank stocks:', error);
      notify('An unexpected error occurred during reconciliation', 'error', 3000);
    } finally {
      setIsReconciling(false);
    }
  }, [selectedSite, user.id, enhancedFetchData]);

  //Cursor - Add stock adjustment handlers
  const handleStockAdjustmentSubmit = useCallback(async (adjustmentData) => {
    try {
      const result = await createStockAdjustment(adjustmentData);
      if (result.success) {
        setShowAdjustmentForm(false);
        setAdjustmentRefreshTrigger(prev => prev + 1);
        await enhancedFetchData(); // Refresh main data
        return result;
      }
      return result;
    } catch (error) {
      console.error('Error creating stock adjustment:', error);
      return { success: false, message: 'An unexpected error occurred' };
    }
  }, [createStockAdjustment, enhancedFetchData]);

  const handleShowAdjustmentForm = useCallback(() => {
    setShowAdjustmentForm(true);
  }, []);

  const handleHideAdjustmentForm = useCallback(() => {
    setShowAdjustmentForm(false);
  }, []);

  //Cursor - Add handlers for dashboard popups
  const handleShowReconciliationDashboard = useCallback(() => {
    setShowReconciliationDashboard(true);
  }, []);

  const handleHideReconciliationDashboard = useCallback(() => {
    setShowReconciliationDashboard(false);
  }, []);

  const handleShowReportDashboard = useCallback(() => {
    setShowReportDashboard(true);
  }, []);

  const handleHideReportDashboard = useCallback(() => {
    setShowReportDashboard(false);
  }, []);

  if (isLoading || isReconciling) {
    return (
      <div className="tw-flex tw-justify-center tw-items-center tw-h-screen tw-bg-gray-50">
        <div className="tw-text-center">
          <LoadIndicator width={'48px'} height={'48px'} visible={true} />
          <div className="tw-mt-4 tw-text-gray-600 tw-font-medium">
            {isReconciling && 'Reconciling stocks...'}
            {isLoading && 'Loading dashboard...'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollView className='content-block tw-bg-gray-50 tw-min-h-screen'>
      <ToolbarAnalytics
        title='Tank Stock Dashboard'
        additionalToolbarContent={
          <ToolbarItem location='before' >
            <div className="tw-flex tw-items-center tw-space-x-3">
              <Button
                icon="fa-light fa-filter"
                text="Date Filter"
                stylingMode="outlined"
                onClick={handleOpenFilter}
              />
              <span className="tw-text-sm tw-text-gray-600 tw-bg-white tw-px-3 tw-py-1 tw-rounded-full tw-border">
                Filter: {appliedFilterType === 'period'
                  ? `${appliedPeriod}`
                  : `${formatDate(appliedCustomDateRange[0])} - ${formatDate(appliedCustomDateRange[1])}`}
              </span>
              <Button
                icon="fa-light fa-balance-scale"
                text="Stock Reconciliation"
                stylingMode="outlined"
                onClick={handleShowReconciliationDashboard}
              />
              <Button
                icon="fa-light fa-chart-bar"
                text="Reports"
                stylingMode="outlined"
                onClick={handleShowReportDashboard}
              />
              <Button
                icon="fa-light fa-clipboard-list"
                text="Stock Adjustment"
                stylingMode="outlined"
                onClick={handleShowAdjustmentForm}
              />
              <div className={`tw-flex tw-items-center tw-px-2 tw-py-1 tw-rounded-full tw-text-sm ${
                signalRConnected
                  ? 'tw-bg-green-100 tw-text-green-800'
                  : 'tw-bg-red-100 tw-text-red-800'
              }`}>
                <i className={`fa-light ${signalRConnected ? 'fa-satellite-dish' : 'fa-exclamation-triangle'} tw-mr-1`}></i>
                {signalRConnected ? 'Live Updates' : 'Offline'}
              </div>
            </div>
          </ToolbarItem>
        }
        onOpeningStockSubmit={handleOpeningStockSubmit}
        onClosingStockSubmit={handleClosingStockSubmit}
        onDeliverySubmit={handleDeliverySubmit}
        onTransferSubmit={handleTransferSubmit}
        sites={sites}
        onSiteChange={handleSiteChange}
        selectedSite={selectedSite}
        isLoading={isLoading}
        onRefresh={enhancedFetchData}
      >
      </ToolbarAnalytics>

      {renderFilterPopup()}

      <div className="tw-mb-8">
        <TankStockDashBoardCards
          selectedSite={selectedSite}
          selectedPeriod={selectedPeriod}
          currentStock={currentStock}
          totalCapacity={totalCapacity}
        />
      </div>

      <div className="tw-mb-8">
        <TankVolumeHistoryCard
          tankHistory={tankVolumeHistory}
        />
      </div>

      <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-overflow-hidden">
        <TabPanel
          height={'auto'}
          focusStateEnabled={false}
          deferRendering={true}
          itemTitleRender={itemTitleRender}
          selectedIndex={activeTabIndex}
          onSelectionChanged={handleTabSelectionChange}
        >
          <Item title="All Tank Volume History">
            {loadedTabs.has(0) && (
              <TankHistoryVolumeDatagrid
                tankVolumeHistory={tankVolumeHistory}
                selectedSite={selectedSite}
                selectedPeriod={selectedPeriod}
              />
            )}
          </Item>
          <Item title="Deliveries">
            {loadedTabs.has(1) && (
              <TankDeliveryDatagrid tankDeliveryData={tankDeliveryData} />
            )}
          </Item>
          <Item title="Fuel Refill Summary">
            {loadedTabs.has(2) && (
              <FuelRefillSummaryDatagrid selectedEndDate={selectedEndDate} selectedSite={selectedSite} />
            )}
          </Item>
          <Item title="Stock Adjustments">
            {loadedTabs.has(3) && (
              <StockAdjustmentList
                selectedSite={selectedSite}
                refreshTrigger={adjustmentRefreshTrigger}
              />
            )}
          </Item>
        </TabPanel>
      </div>

      {/* Stock Adjustment Form Popup */}
      {showAdjustmentForm && (
        <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-flex tw-items-center tw-justify-center tw-z-50">
          <div className="tw-max-w-4xl tw-w-full tw-mx-4 tw-max-h-[90vh] tw-overflow-y-auto">
            <StockAdjustmentForm
              onSubmit={handleStockAdjustmentSubmit}
              onCancel={handleHideAdjustmentForm}
              isVisible={showAdjustmentForm}
            />
          </div>
        </div>
      )}

      {/* Stock Reconciliation Dashboard Popup */}
      {showReconciliationDashboard && (
        <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-flex tw-items-center tw-justify-center tw-z-50">
          <div className="tw-max-w-7xl tw-w-full tw-mx-4 tw-max-h-[90vh] tw-overflow-y-auto tw-bg-white tw-rounded-lg tw-shadow-2xl">
            <StockReconciliationDashboard
              selectedSite={selectedSite}
              onClose={handleHideReconciliationDashboard}
              isVisible={showReconciliationDashboard}
              onReconciliationComplete={enhancedFetchData}
              dateRange={dateRange}
              selectedPeriod={selectedPeriod}
            />
          </div>
        </div>
      )}

      {/* Stock Report Dashboard Popup */}
      {showReportDashboard && (
        <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-flex tw-items-center tw-justify-center tw-z-50">
          <div className="tw-max-w-7xl tw-w-full tw-mx-4 tw-max-h-[90vh] tw-overflow-y-auto tw-bg-white tw-rounded-lg tw-shadow-2xl">
            <div className="tw-flex tw-justify-between tw-items-center tw-bg-white tw-rounded-t-lg tw-shadow-lg tw-p-4 tw-border-b">
              <div className="tw-flex tw-items-center">
                <i className="fa-light fa-chart-bar tw-text-blue-600 tw-text-xl tw-mr-3"></i>
                <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800">Stock Reports Dashboard</h2>
              </div>
              <Button
                icon="fa-light fa-times"
                hint="Close Reports"
                onClick={handleHideReportDashboard}
                stylingMode="text"
                width={36}
                height={36}
              />
            </div>
            <div className="tw-p-6">
              <StockReportDashboard
                selectedSite={selectedSite}
              />
            </div>
          </div>
        </div>
      )}
    </ScrollView>
  );
};
export default TankStockPage;