import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { DataGrid } from 'devextreme-react/data-grid';
import { Column, Paging, FilterRow, SearchPanel, Export, Selection, LoadPanel } from 'devextreme-react/data-grid';
import { DateBox } from 'devextreme-react/date-box';
import { SelectBox } from 'devextreme-react/select-box';
import Button from 'devextreme-react/button';
import { Chart, Series, CommonSeriesSettings, Legend, Export as ChartExport, Tooltip, ArgumentAxis, ValueAxis } from 'devextreme-react/chart';
import notify from 'devextreme/ui/notify';

// Redux actions
import { fetchVehicleFuelingHistory } from '../../../redux/actions/vehicleActions';

const VehicleFuelingHistory = ({ vehicleId }) => {
  const dispatch = useDispatch();
  const [dateFrom, setDateFrom] = useState(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [dateTo, setDateTo] = useState(new Date());
  const [fuelTypeFilter, setFuelTypeFilter] = useState('All');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'chart'
  const [fuelingData, setFuelingData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fuelTypeOptions = [
    { value: 'All', text: 'All Fuel Types' },
    { value: 'Petrol', text: 'Petrol' },
    { value: 'Diesel', text: 'Diesel' },
    { value: 'LPG', text: 'LPG' },
    { value: 'Electric', text: 'Electric' }
  ];

  const viewModeOptions = [
    { value: 'table', text: 'Table View', icon: 'fa-light fa-table' },
    { value: 'chart', text: 'Chart View', icon: 'fa-light fa-chart-line' }
  ];

  useEffect(() => {
    if (vehicleId) {
      loadFuelingHistory();
    }
  }, [vehicleId]);

  const loadFuelingHistory = async () => {
    try {
      setIsLoading(true);
      const response = await dispatch(fetchVehicleFuelingHistory({
        vehicleId,
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
        fuelType: fuelTypeFilter === 'All' ? null : fuelTypeFilter
      }));

      if (response.success) {
        setFuelingData(response.data);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error loading fueling history:', error);
      notify(error.message || 'Failed to load fueling history', 'error', 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  const formatDate = (value) => {
    return value ? new Date(value).toLocaleDateString() : '';
  };

  const formatTime = (value) => {
    return value ? new Date(value).toLocaleTimeString() : '';
  };

  const getFuelTypeColor = (fuelType) => {
    const colors = {
      'Petrol': 'tw-bg-red-100 tw-text-red-800',
      'Diesel': 'tw-bg-blue-100 tw-text-blue-800',
      'LPG': 'tw-bg-green-100 tw-text-green-800',
      'Electric': 'tw-bg-purple-100 tw-text-purple-800'
    };
    return colors[fuelType] || 'tw-bg-gray-100 tw-text-gray-800';
  };

  const getMethodColor = (method) => {
    const colors = {
      'Card': 'tw-bg-blue-100 tw-text-blue-800',
      'Cash': 'tw-bg-green-100 tw-text-green-800',
      'Company Account': 'tw-bg-purple-100 tw-text-purple-800'
    };
    return colors[method] || 'tw-bg-gray-100 tw-text-gray-800';
  };

  // Prepare chart data
  const chartData = fuelingData.map(item => ({
    date: new Date(item.fuelingDate).toLocaleDateString(),
    fuelAmount: item.fuelAmount,
    totalCost: item.totalCost,
    pricePerLiter: item.pricePerLiter
  }));

  return (
    <div className="vehicle-fueling-history">
      <div className="tw-mb-6">
        <div className="tw-flex tw-justify-between tw-items-center tw-mb-4">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
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

        {/* Filter Controls */}
        <div className="tw-flex tw-items-center tw-gap-4 tw-mb-4 tw-p-4 tw-bg-gray-50 tw-rounded-lg">
          <div className="tw-flex tw-items-center tw-gap-2">
            <label className="tw-text-sm tw-font-medium tw-text-gray-700">From:</label>
            <DateBox
              value={dateFrom}
              onValueChanged={(e) => setDateFrom(e.value)}
              displayFormat="dd/MM/yyyy"
              width={140}
            />
          </div>
          <div className="tw-flex tw-items-center tw-gap-2">
            <label className="tw-text-sm tw-font-medium tw-text-gray-700">To:</label>
            <DateBox
              value={dateTo}
              onValueChanged={(e) => setDateTo(e.value)}
              displayFormat="dd/MM/yyyy"
              width={140}
            />
          </div>
          <div className="tw-flex tw-items-center tw-gap-2">
            <label className="tw-text-sm tw-font-medium tw-text-gray-700">Fuel Type:</label>
            <SelectBox
              dataSource={fuelTypeOptions}
              value={fuelTypeFilter}
              onValueChanged={(e) => setFuelTypeFilter(e.value)}
              valueExpr="value"
              displayExpr="text"
              width={150}
            />
          </div>
          <Button
            text="Apply Filter"
            icon="fa-light fa-filter"
            onClick={loadFuelingHistory}
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
            dataField="stationName"
            caption="Fuel Station"
            width={150}
          />

          <Column
            dataField="fuelType"
            caption="Fuel Type"
            width={100}
            cellRender={(cellData) => (
              <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${getFuelTypeColor(cellData.value)}`}>
                {cellData.value}
              </span>
            )}
          />

          <Column
            dataField="fuelAmount"
            caption="Amount (L)"
            dataType="number"
            format="#,##0.00"
            width={100}
            alignment="right"
          />

          <Column
            dataField="pricePerLiter"
            caption="Price/L"
            dataType="number"
            width={100}
            alignment="right"
            cellRender={(cellData) => formatCurrency(cellData.value)}
          />

          <Column
            dataField="totalCost"
            caption="Total Cost"
            dataType="number"
            width={120}
            alignment="right"
            cellRender={(cellData) => formatCurrency(cellData.value)}
          />

          <Column
            dataField="odometerReading"
            caption="Odometer"
            dataType="number"
            format="#,##0"
            width={100}
            alignment="right"
          />

          <Column
            dataField="driverName"
            caption="Driver"
            width={120}
          />

          <Column
            dataField="paymentMethod"
            caption="Payment"
            width={120}
            cellRender={(cellData) => (
              <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${getMethodColor(cellData.value)}`}>
                {cellData.value}
              </span>
            )}
          />

          <Column
            dataField="receiptNumber"
            caption="Receipt #"
            width={120}
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

          {/* Cost Chart */}
          <div className="tw-bg-white tw-p-4 tw-rounded-lg tw-border tw-border-gray-200">
            <h4 className="tw-text-md tw-font-semibold tw-text-gray-800 tw-mb-4">Cost Over Time</h4>
            <Chart
              dataSource={chartData}
              height={300}
            >
              <CommonSeriesSettings type="line" />
              <Series
                valueField="totalCost"
                argumentField="date"
                name="Total Cost"
                color="#10b981"
              />
              <ArgumentAxis>
                <ArgumentAxis.Label rotationAngle={-45} />
              </ArgumentAxis>
              <ValueAxis name="totalCost" position="left" />
              <Legend visible={false} />
              <Tooltip enabled={true} />
              <ChartExport enabled={true} />
            </Chart>
          </div>

          {/* Price Per Liter Chart */}
          <div className="tw-bg-white tw-p-4 tw-rounded-lg tw-border tw-border-gray-200">
            <h4 className="tw-text-md tw-font-semibold tw-text-gray-800 tw-mb-4">Price Per Liter Trend</h4>
            <Chart
              dataSource={chartData}
              height={300}
            >
              <CommonSeriesSettings type="line" />
              <Series
                valueField="pricePerLiter"
                argumentField="date"
                name="Price per Liter"
                color="#f59e0b"
              />
              <ArgumentAxis>
                <ArgumentAxis.Label rotationAngle={-45} />
              </ArgumentAxis>
              <ValueAxis name="pricePerLiter" position="left" />
              <Legend visible={false} />
              <Tooltip enabled={true} />
              <ChartExport enabled={true} />
            </Chart>
          </div>

          {/* Fuel Type Distribution */}
          <div className="tw-bg-white tw-p-4 tw-rounded-lg tw-border tw-border-gray-200">
            <h4 className="tw-text-md tw-font-semibold tw-text-gray-800 tw-mb-4">Fuel Type Distribution</h4>
            <Chart
              dataSource={fuelingData.reduce((acc, item) => {
                const existing = acc.find(x => x.fuelType === item.fuelType);
                if (existing) {
                  existing.count += 1;
                  existing.totalAmount += item.fuelAmount;
                } else {
                  acc.push({
                    fuelType: item.fuelType,
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
                argumentField="fuelType"
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
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-4 tw-gap-4 tw-mt-6">
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
              <p className="tw-text-sm tw-text-green-600 tw-font-medium">Total Cost</p>
              <p className="tw-text-2xl tw-font-bold tw-text-green-900">
                {formatCurrency(fuelingData.reduce((sum, item) => sum + (item.totalCost || 0), 0))}
              </p>
            </div>
            <i className="fa-light fa-dollar-sign tw-text-2xl tw-text-green-600"></i>
          </div>
        </div>

        <div className="tw-bg-yellow-50 tw-p-4 tw-rounded-lg tw-border tw-border-yellow-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-text-yellow-600 tw-font-medium">Avg Price/L</p>
              <p className="tw-text-2xl tw-font-bold tw-text-yellow-900">
                {fuelingData.length > 0 ?
                  formatCurrency(fuelingData.reduce((sum, item) => sum + (item.pricePerLiter || 0), 0) / fuelingData.length)
                  : '$0.00'}
              </p>
            </div>
            <i className="fa-light fa-chart-line tw-text-2xl tw-text-yellow-600"></i>
          </div>
        </div>

        <div className="tw-bg-purple-50 tw-p-4 tw-rounded-lg tw-border tw-border-purple-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-text-purple-600 tw-font-medium">Fuel Stops</p>
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
