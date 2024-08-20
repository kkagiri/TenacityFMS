//Page for Dashboard of Tank transactions and Tank fuel level Dashboarad

import React ,{useState,useEffect,useCallback,useMemo}from "react";
import { fetchTankVolumeHistoryBySiteId ,fetchTankVolumeHistoryByDateRange} from "../../redux/actions/tankVolumeHistoryActions";
import { fetchTanks } from "../../redux/actions/tankActions";
import { fetchSiteList } from "../../redux/actions/siteActions";
import { fetchUsers } from "../../redux/actions/userActions";
import { fetchpermissionbyUserId } from "../../redux/actions/permissionActions";
import { createOpeningStock } from '../../redux/actions/tankStockAction';
import { createClosingStock } from "../../redux/actions/tankStockAction";
import TankStockDashBoardCards from "./tankStockDashBoardCards";
import { LoadPanel } from 'devextreme-react/load-panel';
import { Item } from 'devextreme-react/toolbar';
import TabPanel, { Item as TabPanelItem } from 'devextreme-react/tab-panel';
import { createDelivery,fetchDeliveriesbyDateRange,fetchDeliveriesbyDateRangebySiteId } from "../../redux/actions/DeliveryActions";
import { createTankTransfer } from "../../redux/actions/tankStockAction";
import { prepareOpeningClosingStockParams,prepareDeliveryDTO,prepareTankTransferDTO } from "../../utils/stockDataPreparation";
import TankHistoryVolumeDatagrid from "./../../components/tankStock/tankHistoryVolumeDatagrid";
import { fetchConsumptionByDateRange,fetchConsumptionByDateRangebySitId } from "../../redux/actions/consumptionActions";
 import TankDeliveryDatagrid from '../../components/TankDeliveryDataGrid/tankDeliverydataGrid';
 import LoadIndicator from 'devextreme-react/load-indicator';
 import ScrollView from 'devextreme-react/scroll-view';

import './tankStockPage.scss';
import Tabs from 'devextreme-react/tabs';

import { useDispatch, useSelector } from "react-redux";

import {ToolbarAnalytics} from '../../components/toolBar/toolBarAnalytic';
import { DatePeriods } from "../../components/Shared/datePeriods";
import notify from 'devextreme/ui/notify';  

const DEFAULT_ANALYTICS_PERIOD_KEY = 'Today';

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





const useFetchData = (selectedSite, dateRange, user) => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [startDate, endDate] = dateRange;
      console.log(`Fetching data for range: ${startDate} to ${endDate}`);
      
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
        dispatch(fetchUsers()),
        dispatch(fetchpermissionbyUserId(user.id))
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      notify('Error fetching data', 'error', 3000);    
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, selectedSite, dateRange, user.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useInterval(fetchData, 5 * 60 * 1000); // 5 minutes in milliseconds
  return { isLoading, fetchData };
};



const TankStockPage = () => {

const user = useSelector((state) => state.auth.user);
const sites = useSelector((state) => state.site.sites);
const dispatch = useDispatch();
const tankVolumeHistory = useSelector((state) => state.tankVolumeHistory.tankVolumeHistory);
const tankDeliveryData = useSelector((state) => state.delivery.deliveries);
const [saving, setSaving] = useState(false);
const [isInsertingHistorical, setIsInsertingHistorical] = useState(false);

const [selectedSite, setSelectedSite] = useState(() => localStorage.getItem('selectedSite') || 'all');
const [selectedPeriod, setSelectedPeriod] = useState(() => localStorage.getItem('selectedPeriod') || DEFAULT_ANALYTICS_PERIOD_KEY);

const Analytics_period = useMemo(() => DatePeriods(), []);
const items = useMemo(() => Object.keys(Analytics_period), [Analytics_period]);


const dateRange = useMemo(() => {
  return Analytics_period[selectedPeriod].period.split('/');
}, [Analytics_period, selectedPeriod]);

const tabIndex = useMemo(() => Analytics_period[selectedPeriod].index, [Analytics_period, selectedPeriod]);
const { isLoading, fetchData } = useFetchData(selectedSite, dateRange, user);


useEffect(() => {
  localStorage.setItem('selectedSite', selectedSite);
}, [selectedSite]);

useEffect(() => {
  localStorage.setItem('selectedPeriod', selectedPeriod);
}, [selectedPeriod]);



const handleSiteChange = useCallback((e) => {
  setSelectedSite(e.value);
}, []);


const handlePeriodChange = useCallback((e) => {
  if (e.addedItems && e.addedItems.length > 0) {
    const selectedItem = e.addedItems[0];
    setSelectedPeriod(selectedItem);
    localStorage.setItem('selectedPeriod', selectedItem);
  }
}, []);
  
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

    if (isLoading || saving) {
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
     
        
          <Item location='before'>
            <Tabs
             
              scrollByContent={true}
              showNavButtons={false}
              dataSource={items}
              selectedIndex={tabIndex}
              onSelectionChanged={handlePeriodChange}
            />
          </Item>

        
     
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
               <div style={{marginBottom:'30px' }}>

        <TankStockDashBoardCards selectedSite = {selectedSite}  selectedPeriod = {selectedPeriod}/>
        </div>
        <div style={{marginTop:'30px' }}>
        <TabPanel
        height={'auto'}
         showNavButtons
         focusStateEnabled={false}
         deferRendering={false}>
            
            <TabPanelItem title="All Tank Volume History " >
           <TankHistoryVolumeDatagrid tankVolumeHistory={tankVolumeHistory}  selectedSite = {selectedSite}  selectedPeriod = {selectedPeriod} />
            </TabPanelItem>

            {/* <TabPanelItem title="Dispensing ">
            <ManualDispenseDataGrid fuelRefills={} />
            </TabPanelItem> */}
  
            <TabPanelItem title="Deliveries ">
            <TankDeliveryDatagrid tankDeliveryData = {tankDeliveryData} />
           </TabPanelItem>

        </TabPanel>

        </div>
    </ToolbarAnalytics>
        </ScrollView>
);
};
export default TankStockPage;