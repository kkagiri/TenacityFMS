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
import axiosInstance from '../../utils/axiosInstance';

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





const useFetchData = (selectedSite, initialDateRange) => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);


  const fetchData = useCallback(async (dateRange = initialDateRange) => {
    try {
      setIsLoading(true);
      const [startDate, endDate] = dateRange;
      console.log("startDate:", startDate, "endDate:", endDate);
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
      //  dispatch(fetchUsers()),
      //  dispatch(fetchpermissionbyUserId(user.id))
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      notify('Error fetching data', 'error', 3000);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, selectedSite]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useInterval(() => fetchData(initialDateRange), 30 * 60 * 1000); // 5 minutes in milliseconds
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
    fetchData(newDateRange);
  }, [activeFilterType, tempSelectedPeriod, tempCustomDateRange, Analytics_period, fetchData]);



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



  useEffect(() => {
    fetchData();
  }, [selectedSite, fetchData, dateRange]);


  const renderFilterPopup = () => (
    <Popup
      visible={isFilterPopupVisible}
      onHiding={() => setIsFilterPopupVisible(false)}
      title="Date Filter"
      maxWidth={400}
      height='auto'
      showCloseButton={true}
      dragEnabled={false}
      position={{ my: 'center', at: 'center', of: window }}

    >
      <div style={{ padding: '10px' }}>
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckBox
            text="Period Filter"
            value={activeFilterType === 'period'}
            onValueChanged={(e) => setActiveFilterType(e.value ? 'period' : 'custom')}
          />
          <SelectBox
            dataSource={periodItems}
            value={tempSelectedPeriod}
            onValueChanged={handlePeriodChange}
            width={300}
            displayExpr="text"
            valueExpr="value"
            disabled={activeFilterType !== 'period'}
          />
        </div>

        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckBox
            text="Custom Filter"
            value={activeFilterType === 'custom'}
            onValueChanged={(e) => setActiveFilterType(e.value ? 'custom' : 'period')}
          />
          <DateRangeBox
            startDate={tempCustomDateRange[0]}
            endDate={tempCustomDateRange[1]}
            onValueChanged={handleCustomDateRangeChange}
            width={300}
            disabled={activeFilterType !== 'custom'}
          />
        </div>
        <Button
          text="Apply Filter"
          onClick={handleApplyFilter}
          disabled={!activeFilterType}
        />
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
          await fetchData(); // Refresh all data for the current view
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
  }, [dispatch, fetchData]);

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
        fetchData(); // Refresh data after reconciliation
      } else {
        notify(response.data.message || 'Error reconciling tank stocks', 'error', 5000);
      }
    } catch (error) {
      console.error('Error reconciling tank stocks:', error);
      notify('An unexpected error occurred during reconciliation', 'error', 3000);
    } finally {
      setIsReconciling(false);
    }
  }, [selectedSite, user.id, fetchData]);

  if (isLoading || saving || isReconciling) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <LoadIndicator width={'24px'} height={'24px'} visible={true} />
      </div>
    );
  }

  return (
    <ScrollView className='content-block'>
      <ToolbarAnalytics
        title='Dashboard'
        additionalToolbarContent={
          <ToolbarItem location='before' locateInMenu='auto'>
            <Button
              icon="fa-solid fa-filter"
              text="Date Filter"
              stylingMode="outlined"
              onClick={handleOpenFilter}
            />
            <span style={{ marginLeft: '10px' }}>
              Filter: {appliedFilterType === 'period'
                ? `${appliedPeriod}`
                : `${formatDate(appliedCustomDateRange[0])} - ${formatDate(appliedCustomDateRange[1])}`}
            </span>
            <Button
              icon="fa-light fa-rotate"
              text="Reconcile Tank Stocks"
              stylingMode="outlined"
              onClick={handleReconcileTankStocks}
              style={{ marginLeft: '10px' }}
            />
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
        onRefresh={fetchData}
      >

      </ToolbarAnalytics>
      {renderFilterPopup()}
      <div style={{ marginBottom: '30px' }}>
        <TankStockDashBoardCards
          selectedSite={selectedSite}
          selectedPeriod={selectedPeriod}
          currentStock={currentStock}
          totalCapacity={totalCapacity}
        />

      </div>
         <div style={{ marginTop: '30px' }}>


           <TankVolumeHistoryCard
           tankHistory ={tankVolumeHistory}
           />
         </div>



      <div style={{ marginTop: '30px' }}>
      <TabPanel
  height={'auto'}
  focusStateEnabled={false}
  deferRendering={false}
  itemTitleRender={itemTitleRender}
>
  <Item title="All Tank Volume History">
    <TankHistoryVolumeDatagrid
      tankVolumeHistory={tankVolumeHistory}
      selectedSite={selectedSite}
      selectedPeriod={selectedPeriod}
    />
  </Item>
  <Item title="Deliveries">
    <TankDeliveryDatagrid tankDeliveryData={tankDeliveryData} />
  </Item>

  <Item title="Fuel Refill Summary">
    <FuelRefillSummaryDatagrid selectedEndDate={selectedEndDate} selectedSite={selectedSite} />
  </Item>
</TabPanel>


      </div>
    </ScrollView>
  );
};
export default TankStockPage;