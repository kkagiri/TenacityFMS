import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { DataGrid } from 'devextreme-react/data-grid';
import { Column, Paging, FilterRow, SearchPanel, Export, Selection, LoadPanel } from 'devextreme-react/data-grid';
import { DateBox } from 'devextreme-react/date-box';
import Button from 'devextreme-react/button';
import { Chart, Series, CommonSeriesSettings, Legend, Export as ChartExport, Tooltip, ArgumentAxis, ValueAxis } from 'devextreme-react/chart';
import notify from 'devextreme/ui/notify';

// Redux actions
import { fetchConsumptionByDateRangeByVehicleID } from '../../../redux/actions/consumptionActions';

const VehicleFuelingHistory = ({ vehicleId }) => {
  const dispatch = useDispatch();
  const [dateFrom, setDateFrom] = useState(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [dateTo, setDateTo] = useState(new Date());
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'chart'
  const [fuelingData, setFuelingData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const dataLoadedRef = useRef(false); // Use ref instead of state to avoid dependency issues

  const viewModeOptions = [
    { value: 'table', text: 'Table View', icon: 'fa-light fa-table' },
    { value: 'chart', text: 'Chart View', icon: 'fa-light fa-chart-line' }
  ];

  const loadFuelingHistory = useCallback(async (forceReload = false) => {
    // Skip loading if already loaded and not forced to reload
    if ((dataLoadedRef.current && !forceReload) || !vehicleId) return;

    try {
      setIsLoading(true);

      // Execute the API call using the vehicleRefills endpoint with 30 days default
      const response = await dispatch(fetchConsumptionByDateRangeByVehicleID(
        dateFrom,
        dateTo,
        vehicleId
      ));

      if (response.type && response.type.includes('SUCCESS')) {
        // The data comes from the payload
        const data = response.payload || [];

        // Convert and map data to match expected format
        const processedData = data.map(item => ({
          id: item.id,
          fuelingDate: item.date ? new Date(item.date) : null,
          fuelingTime: item.date ? new Date(item.date) : null,
          stationName: item.tankName || 'Tank',
          fuelType: 'Diesel', // Default, can be enhanced later
          fuelAmount: item.manualFuelrefillAmount || 0,
          pricePerLiter: 0, // Not available in current data
          totalCost: 0, // Not available in current data
          odometerReading: item.currentMeterReading || 0,
          driverName: item.driverName || 'N/A',
          paymentMethod: 'Company Account', // Default
          receiptNumber: item.comment || '',
          siteName: item.siteName || '',
          previousMeterReading: item.previousMeterReading || 0,
          distanceOrEngineHours: item.distanceOrEngineHours || 0,
          consumption: item.consumption || 0,
          isKmL: item.isKmL || false,
          fuelBy: item.fuelBy || ''
        }));

        setFuelingData(processedData);
        dataLoadedRef.current = true; // Mark as loaded
      } else {
        throw new Error('Failed to load fueling data');
      }
    } catch (error) {
      console.error('Error loading fueling history:', error);
      notify(error.message || 'Failed to load fueling history', 'error', 3000);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, vehicleId, dateFrom, dateTo]);

  useEffect(() => {
    if (vehicleId && !dataLoadedRef.current) { // Only load if not already loaded
      loadFuelingHistory();
    }
  }, [vehicleId, loadFuelingHistory]);

  const formatDate = (value) => {
    return value ? new Date(value).toLocaleDateString() : '';
  };

  const formatTime = (value) => {
    return value ? new Date(value).toLocaleTimeString() : '';
  };

  // Prepare chart data
  const chartData = fuelingData.map(item => ({
    date: new Date(item.fuelingDate).toLocaleDateString(),
    fuelAmount: item.fuelAmount,
    consumption: item.consumption,
    distanceOrEngineHours: item.distanceOrEngineHours
  }));

  // Calculate ticker metrics
  const totalFuelDispensed = fuelingData.reduce((sum, item) => sum + (item.fuelAmount || 0), 0);
  const totalDistanceCovered = fuelingData.reduce((sum, item) => sum + (item.distanceOrEngineHours || 0), 0);
  const averageConsumption = fuelingData.length > 0
    ? (fuelingData.reduce((sum, item) => sum + (item.consumption || 0), 0) / fuelingData.length)
    : 0;
  const consumptionUnit = fuelingData.length > 0 && fuelingData[0].isKmL ? 'Km/L' : 'L/Hr';

  return (
    <div className="vehicle-fueling-history">
      <div className="tw-mb-6">
        <div className="tw-flex tw-flex-col md:tw-flex-row md:tw-justify-between md:tw-items-center tw-mb-4">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4 md:tw-mb-0">
            Fueling History
          </h3>
          <div className="tw-flex tw-gap-2">
            {viewModeOptions.map(option => (
              <Button
                key={option.value}
                text={option.text}
                icon={option.icon}
                onClick={() => setViewMode(option.value)}
                type={viewMode === option.value ? 'default' : 'normal'}
                stylingMode={viewMode === option.value ? 'contained' : 'outlined'}
              />
            ))}
          </div>
        </div>

        {/* Ticker Dashboard - One Line */}
        <div className="tw-bg-gradient-to-r tw-from-blue-500 tw-to-blue-600 tw-rounded-lg tw-p-3 tw-mb-4 tw-shadow-md">
          <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-around tw-gap-4 md:tw-gap-8">
            {/* Fuel Dispensed */}
            <div className="tw-flex tw-items-center tw-gap-3">
              <div className="tw-bg-white tw-bg-opacity-20 tw-rounded-full tw-p-2">
                <i className="fa-solid fa-gas-pump tw-text-white tw-text-lg"></i>
              </div>
              <div>
                <p className="tw-text-white tw-text-opacity-80 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide">
                  Fuel Dispensed
                </p>
                <p className="tw-text-white tw-text-xl tw-font-bold">
                  {totalFuelDispensed.toFixed(2)} L
                </p>
              </div>
            </div>

            {/* Distance Covered */}
            <div className="tw-flex tw-items-center tw-gap-3">
              <div className="tw-bg-white tw-bg-opacity-20 tw-rounded-full tw-p-2">
                <i className="fa-solid fa-road tw-text-white tw-text-lg"></i>
              </div>
              <div>
                <p className="tw-text-white tw-text-opacity-80 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide">
                  Distance Covered
                </p>
                <p className="tw-text-white tw-text-xl tw-font-bold">
                  {totalDistanceCovered.toFixed(2)} {fuelingData.length > 0 && fuelingData[0].isKmL ? 'Km' : 'Hrs'}
                </p>
              </div>
            </div>

            {/* Fuel Average */}
            <div className="tw-flex tw-items-center tw-gap-3">
              <div className="tw-bg-white tw-bg-opacity-20 tw-rounded-full tw-p-2">
                <i className="fa-solid fa-gauge-high tw-text-white tw-text-lg"></i>
              </div>
              <div>
                <p className="tw-text-white tw-text-opacity-80 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide">
                  Fuel Average
                </p>
                <p className="tw-text-white tw-text-xl tw-font-bold">
                  {averageConsumption.toFixed(2)} {consumptionUnit}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="tw-flex tw-flex-col md:tw-flex-row md:tw-items-start tw-gap-4 tw-mb-4 tw-p-4 tw-bg-gray-50 tw-rounded-lg">
          <div className="tw-flex tw-flex-col md:tw-flex-row md:tw-items-center tw-gap-4">
            <div className="tw-flex tw-items-center tw-gap-2">
              <label className="tw-text-sm tw-font-medium tw-text-gray-700">From:</label>
              <DateBox
                value={dateFrom}
                onValueChanged={(e) => {
                  setDateFrom(e.value);
                  dataLoadedRef.current = false; // Reset loaded flag when date changes
                }}
                displayFormat="dd/MM/yyyy"
                width="100%"
              />
            </div>
            <div className="tw-flex tw-items-center tw-gap-2">
              <label className="tw-text-sm tw-font-medium tw-text-gray-700">To:</label>
              <DateBox
                value={dateTo}
                onValueChanged={(e) => {
                  setDateTo(e.value);
                  dataLoadedRef.current = false; // Reset loaded flag when date changes
                }}
                displayFormat="dd/MM/yyyy"
                width="100%"
              />
            </div>
          </div>
          <Button
            text="Apply Filter"
            icon="fa-light fa-filter"
            onClick={() => loadFuelingHistory(true)}
            type="default"
            stylingMode="outlined"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <DataGrid
          dataSource={fuelingData}
          keyExpr="id"
          showBorders={true}
          showRowLines={true}
          showColumnLines={true}
          allowColumnReordering={true}
          allowColumnResizing={true}
          columnAutoWidth={true}
          height={500}
        >
          <LoadPanel enabled={isLoading} />

          <Column
            dataField="fuelingDate"
            caption="Date"
            dataType="date"
            format="dd/MM/yyyy"
            width={100}
            allowSorting={true}
          />

          <Column
            dataField="fuelingTime"
            caption="Time"
            width={80}
            cellRender={(cellData) => formatTime(cellData.value)}
          />

          <Column
            dataField="siteName"
            caption="Site"
            width={150}
          />

          <Column
            dataField="stationName"
            caption="Tank"
            width={120}
          />

          <Column
            dataField="fuelAmount"
            caption="Fuel (L)"
            dataType="number"
            format="#,##0.00"
            width={100}
            alignment="right"
          />

          <Column
            dataField="previousMeterReading"
            caption="Prev. Reading"
            dataType="number"
            format="#,##0.00"
            width={120}
            alignment="right"
          />

          <Column
            dataField="odometerReading"
            caption="Curr. Reading"
            dataType="number"
            format="#,##0.00"
            width={120}
            alignment="right"
          />

          <Column
            dataField="distanceOrEngineHours"
            caption="Distance/Hours"
            dataType="number"
            format="#,##0.00"
            width={130}
            alignment="right"
          />

          <Column
            dataField="consumption"
            caption="Consumption"
            dataType="number"
            format="#,##0.00"
            width={110}
            alignment="right"
            cellRender={(cellData) => {
              const row = cellData.row.data;
              const unit = row.isKmL ? 'Km/L' : 'L/Hr';
              return (
                <span>
                  {cellData.value ? cellData.value.toFixed(2) : '0.00'} {unit}
                </span>
              );
            }}
          />

          <Column
            dataField="driverName"
            caption="Driver"
            width={120}
          />

          <Column
            dataField="fuelBy"
            caption="Fueled By"
            width={120}
          />

          <Column
            dataField="receiptNumber"
            caption="Comment"
            width={150}
          />

          <Paging enabled={true} pageSize={20} />
          <FilterRow visible={true} />
          <SearchPanel visible={true} width={240} placeholder="Search fueling records..." />
          <Export enabled={true} fileName="vehicle-fueling-history" />
          <Selection mode="single" />
        </DataGrid>
      )}

      {/* Chart View */}
      {viewMode === 'chart' && (
        <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6">
          {/* Fuel Amount Chart */}
          <div className="tw-bg-white tw-p-4 tw-rounded-lg tw-border tw-border-gray-200">
            <h4 className="tw-text-md tw-font-semibold tw-text-gray-800 tw-mb-4">Fuel Amount Over Time</h4>
            <Chart
              dataSource={chartData}
              height={300}
            >
              <CommonSeriesSettings type="line" />
              <Series
                valueField="fuelAmount"
                argumentField="date"
                name="Fuel Amount (L)"
                color="#3b82f6"
              />
              <ArgumentAxis>
                <ArgumentAxis.Label rotationAngle={-45} />
              </ArgumentAxis>
              <ValueAxis name="fuelAmount" position="left" />
              <Legend visible={false} />
              <Tooltip enabled={true} />
              <ChartExport enabled={true} />
            </Chart>
          </div>

          {/* Consumption Chart */}
          <div className="tw-bg-white tw-p-4 tw-rounded-lg tw-border tw-border-gray-200">
            <h4 className="tw-text-md tw-font-semibold tw-text-gray-800 tw-mb-4">Consumption Over Time</h4>
            <Chart
              dataSource={chartData}
              height={300}
            >
              <CommonSeriesSettings type="line" />
              <Series
                valueField="consumption"
                argumentField="date"
                name="Consumption"
                color="#10b981"
              />
              <ArgumentAxis>
                <ArgumentAxis.Label rotationAngle={-45} />
              </ArgumentAxis>
              <ValueAxis name="consumption" position="left" />
              <Legend visible={false} />
              <Tooltip enabled={true} />
              <ChartExport enabled={true} />
            </Chart>
          </div>

          {/* Distance/Hours Chart */}
          <div className="tw-bg-white tw-p-4 tw-rounded-lg tw-border tw-border-gray-200">
            <h4 className="tw-text-md tw-font-semibold tw-text-gray-800 tw-mb-4">Distance/Engine Hours Trend</h4>
            <Chart
              dataSource={chartData}
              height={300}
            >
              <CommonSeriesSettings type="line" />
              <Series
                valueField="distanceOrEngineHours"
                argumentField="date"
                name="Distance/Hours"
                color="#f59e0b"
              />
              <ArgumentAxis>
                <ArgumentAxis.Label rotationAngle={-45} />
              </ArgumentAxis>
              <ValueAxis name="distanceOrEngineHours" position="left" />
              <Legend visible={false} />
              <Tooltip enabled={true} />
              <ChartExport enabled={true} />
            </Chart>
          </div>

          {/* Site Distribution */}
          <div className="tw-bg-white tw-p-4 tw-rounded-lg tw-border tw-border-gray-200">
            <h4 className="tw-text-md tw-font-semibold tw-text-gray-800 tw-mb-4">Refills by Site</h4>
            <Chart
              dataSource={fuelingData.reduce((acc, item) => {
                const existing = acc.find(x => x.siteName === item.siteName);
                if (existing) {
                  existing.count += 1;
                  existing.totalAmount += item.fuelAmount;
                } else {
                  acc.push({
                    siteName: item.siteName || 'Unknown',
                    count: 1,
                    totalAmount: item.fuelAmount
                  });
                }
                return acc;
              }, [])}
              height={300}
            >
              <CommonSeriesSettings type="doughnut" innerRadius={0.6} />
              <Series
                valueField="totalAmount"
                argumentField="siteName"
                name="Fuel Amount"
              />
              <Legend visible={true} />
              <Tooltip enabled={true} />
              <ChartExport enabled={true} />
            </Chart>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4 tw-mt-6">
        <div className="tw-bg-blue-50 tw-p-4 tw-rounded-lg tw-border tw-border-blue-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-text-blue-600 tw-font-medium">Total Fuel</p>
              <p className="tw-text-2xl tw-font-bold tw-text-blue-900">
                {fuelingData.reduce((sum, item) => sum + (item.fuelAmount || 0), 0).toFixed(2)} L
              </p>
            </div>
            <i className="fa-light fa-gas-pump tw-text-2xl tw-text-blue-600"></i>
          </div>
        </div>

        <div className="tw-bg-green-50 tw-p-4 tw-rounded-lg tw-border tw-border-green-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-text-green-600 tw-font-medium">Total Distance/Hours</p>
              <p className="tw-text-2xl tw-font-bold tw-text-green-900">
                {fuelingData.reduce((sum, item) => sum + (item.distanceOrEngineHours || 0), 0).toFixed(2)}
              </p>
            </div>
            <i className="fa-light fa-road tw-text-2xl tw-text-green-600"></i>
          </div>
        </div>

        <div className="tw-bg-yellow-50 tw-p-4 tw-rounded-lg tw-border tw-border-yellow-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-text-yellow-600 tw-font-medium">Avg Consumption</p>
              <p className="tw-text-2xl tw-font-bold tw-text-yellow-900">
                {fuelingData.length > 0 ?
                  (fuelingData.reduce((sum, item) => sum + (item.consumption || 0), 0) / fuelingData.length).toFixed(2)
                  : '0.00'}
              </p>
            </div>
            <i className="fa-light fa-chart-line tw-text-2xl tw-text-yellow-600"></i>
          </div>
        </div>

        <div className="tw-bg-purple-50 tw-p-4 tw-rounded-lg tw-border tw-border-purple-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-text-purple-600 tw-font-medium">Refills</p>
              <p className="tw-text-2xl tw-font-bold tw-text-purple-900">
                {fuelingData.length}
              </p>
            </div>
            <i className="fa-light fa-location-dot tw-text-2xl tw-text-purple-600"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleFuelingHistory;