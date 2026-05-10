//Page for Dashboard of Tank transactions and Tank fuel level Dashboard
//Cursor - Optimized for minimal initial loading

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTanks } from "../../redux/actions/tankActions";
import { fetchSiteList } from "../../redux/actions/siteActions";
import {
  fetchTankVolumeHistoryByDateRange,
  fetchTankVolumeHistoryBySiteId
} from "../../redux/actions/tankVolumeHistoryActions";
import {
  fetchConsumptionByDateRange,
  fetchConsumptionByDateRangebySitId
} from "../../redux/actions/consumptionActions";
import {
  fetchDeliveriesbyDateRange,
  fetchDeliveriesbyDateRangebySiteId
} from "../../redux/actions/DeliveryActions";
import notify from 'devextreme/ui/notify';
import { DatePeriods } from "../../components/Shared/datePeriods";

import TankStockDashBoardCards from "./tankStockDashBoardCards";

import LoadIndicator from 'devextreme-react/load-indicator';
import Button from 'devextreme-react/button';
import TabPanel, { Item } from 'devextreme-react/tab-panel';
import Popup from 'devextreme-react/popup';
import CheckBox from 'devextreme-react/check-box';
import SelectBox from 'devextreme-react/select-box';
import DateRangeBox from 'devextreme-react/date-range-box';
import './tankStockPage.scss';

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

//Cursor - Updated data fetching for minimal loading
const useFetchData = (selectedSite) => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async (dateRange) => {
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

  return { isLoading, fetchData };
};

const TankStockPage = () => {
  const tankVolumeHistory = useSelector((state) => state.tankVolumeHistory.tankVolumeHistory);
  const tankDeliveryData = useSelector((state) => state.delivery.deliveries);

  // Move state variable declarations
  const [selectedSite] = useState(() => {
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

  //Cursor - Use the data fetching hook
  const { isLoading, fetchData: enhancedFetchData } = useFetchData(selectedSite);

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

  const handlePeriodChange = useCallback((e) => {
    setTempSelectedPeriod(e.value);
  }, []);

  const handleCustomDateRangeChange = useCallback((e) => {
    if (e.value && e.value.length === 2) {
      setTempCustomDateRange(e.value);
    }
  }, []);

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

  useEffect(() => {
    if (dateRange && dateRange.length === 2) {
        console.log('Date range updated:', dateRange);
    }
}, [dateRange]);

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

  const { currentStock, totalCapacity } = useMemo(() => {
    return { currentStock: 0, totalCapacity: 0 };
  }, []);

  //Cursor - Handle tab selection change for lazy loading
  const handleTabSelectionChange = useCallback((e) => {
    const newIndex = e.selectedIndex;
    setActiveTabIndex(newIndex);
    setLoadedTabs(prev => new Set([...prev, newIndex]));
  }, []);

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

  const handleOpenFilter = useCallback(() => {
    setTempSelectedPeriod(appliedPeriod);
    setTempCustomDateRange(appliedCustomDateRange);
    setActiveFilterType(appliedFilterType);
    setIsFilterPopupVisible(true);
  }, [appliedPeriod, appliedCustomDateRange, appliedFilterType]);

  if (isLoading) {
    return (
      <div className="tw-flex tw-justify-center tw-items-center tw-h-screen tw-bg-gray-50">
        <div className="tw-text-center">
          <LoadIndicator width={'48px'} height={'48px'} visible={true} />
          <div className="tw-mt-4 tw-text-gray-600 tw-font-medium">
            Loading dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='content-block tw-bg-gray-50 tw-min-h-screen tw-overflow-y-auto tw-h-full'>
      <div className="tw-p-6">
        <div className="tw-mb-4">
          <h1 className="tw-text-2xl tw-font-bold tw-text-gray-800">Tank Stock Dashboard</h1>
        </div>

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
          <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-6">
            <h2 className="tw-text-lg tw-font-semibold tw-mb-4">Tank Volume History</h2>
            <div className="tw-flex tw-items-center tw-space-x-4 tw-mb-4">
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
            </div>

            <div className="tw-text-gray-600">
              {tankVolumeHistory.length > 0
                ? `${tankVolumeHistory.length} records found`
                : 'No volume history data available'}
            </div>
          </div>
        </div>

        <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-overflow-hidden">
          <TabPanel
            height={'auto'}
            focusStateEnabled={false}
            deferRendering={true}
            selectedIndex={activeTabIndex}
            onSelectionChanged={handleTabSelectionChange}
          >
            <Item title="All Tank Volume History">
              {loadedTabs.has(0) && (
                <div className="tw-p-4">
                  <div className="tw-text-gray-600">
                    Tank Volume History Content ({tankVolumeHistory.length} records)
                  </div>
                </div>
              )}
            </Item>
            <Item title="Deliveries">
              {loadedTabs.has(1) && (
                <div className="tw-p-4">
                  <div className="tw-text-gray-600">
                    Deliveries Content ({tankDeliveryData.length} records)
                  </div>
                </div>
              )}
            </Item>
            <Item title="Summary">
              {loadedTabs.has(2) && (
                <div className="tw-p-4">
                  <div className="tw-text-gray-600">
                    Summary Content
                  </div>
                </div>
              )}
            </Item>
          </TabPanel>
        </div>
      </div>
    </div>
  );
};

export default TankStockPage;
