import React, { useState, useEffect } from 'react';
import { Button } from 'devextreme-react';
import { DataGrid, Column, Paging, SearchPanel, Summary, TotalItem } from 'devextreme-react/data-grid';
import { SelectBox } from 'devextreme-react/select-box';
import { DateBox } from 'devextreme-react/date-box';
import notify from 'devextreme/ui/notify';
import TankVolumeHistoryService from '../../../services/tankVolumeHistoryService';
import LoadIndicator from 'devextreme-react/load-indicator';

/**
 * Tank Volume History API Demo Component
 * Demonstrates usage of the /api/tankvolumehistory/filtered endpoint
 *
 * Example API call:
 * http://10.0.11.90:7009/api/tankvolumehistory/filtered?siteId=22&startDate=2025-07-31&endDate=2025-07-31&includeVehicleNames=true
 */
const TankVolumeHistoryDemo = () => {
  // State for API parameters
  const [siteId, setSiteId] = useState(22); // Your example site ID
  const [startDate, setStartDate] = useState(new Date('2025-07-31')); // Your example date
  const [endDate, setEndDate] = useState(new Date('2025-07-31')); // Your example date
  const [includeVehicleNames, setIncludeVehicleNames] = useState(true);
  const [take, setTake] = useState(100);

  // State for data and UI
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState({});
  const [lastApiCall, setLastApiCall] = useState('');

  // Site options (you would normally get these from your site selector)
  const siteOptions = [
    { id: 'all', name: 'All Sites' },
    { id: 22, name: 'Site 22 (Your Example)' },
    { id: 1, name: 'Site 1' },
    { id: 2, name: 'Site 2' }
  ];

  const fetchData = async () => {
    setLoading(true);

    try {
      // Format dates for API
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];

      // Build the API URL (same as your example)
      const apiUrl = `http://10.0.11.90:7009/api/tankvolumehistory/filtered?siteId=${siteId}&startDate=${formattedStartDate}&endDate=${formattedEndDate}&includeVehicleNames=${includeVehicleNames}`;
      setLastApiCall(apiUrl);

      console.log('🔄 Making API call:', apiUrl);

      // Use the service to fetch data
      const result = await TankVolumeHistoryService.fetchFiltered({
        siteId: siteId === 'all' ? null : siteId,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        includeVehicleNames,
        take
      });

      if (result.success) {
        const normalizedData = TankVolumeHistoryService.normalizeData(result.data);
        const stats = TankVolumeHistoryService.getStatistics(result.data);

        setData(normalizedData);
        setStatistics(stats);

        notify(`Successfully loaded ${normalizedData.length} records`, 'success');
        console.log('✅ Data loaded:', { recordCount: normalizedData.length, statistics: stats });
      } else {
        notify(`Error: ${result.error}`, 'error');
        setData([]);
        setStatistics({});
      }

    } catch (error) {
      console.error('❌ Error fetching data:', error);
      notify('Failed to fetch data', 'error');
      setData([]);
      setStatistics({});
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on component mount with your example parameters
  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getChangeReasonText = (value) => {
    const reasons = {
      0: 'Opening Stock',
      1: 'Closing Stock',
      2: 'Delivery',
      3: 'Transfer In',
      4: 'Transfer Out',
      5: 'Adjustment',
      6: 'Dispensing'
    };
    return reasons[value] || `Unknown (${value})`;
  };

  return (
    <div className="tw-p-6 tw-bg-gray-50 tw-min-h-screen">
      <div className="tw-max-w-7xl tw-mx-auto">

        {/* Header */}
        <div className="tw-mb-6">
          <h1 className="tw-text-2xl tw-font-bold tw-text-gray-800 tw-mb-2">
            Tank Volume History API Demo
          </h1>
          <p className="tw-text-gray-600">
            Demonstrating the <code className="tw-bg-blue-100 tw-px-2 tw-py-1 tw-rounded tw-text-blue-800">/api/tankvolumehistory/filtered</code> endpoint
          </p>
        </div>

        {/* API Parameters Panel */}
        <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-6 tw-mb-6">
          <h2 className="tw-text-lg tw-font-semibold tw-mb-4">API Parameters</h2>

          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-5 tw-gap-4 tw-mb-4">
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                Site ID
              </label>
              <SelectBox
                dataSource={siteOptions}
                value={siteId}
                onValueChanged={(e) => setSiteId(e.value)}
                displayExpr="name"
                valueExpr="id"
                placeholder="Select Site"
              />
            </div>

            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                Start Date
              </label>
              <DateBox
                value={startDate}
                onValueChanged={(e) => setStartDate(e.value)}
                type="date"
                displayFormat="yyyy-MM-dd"
              />
            </div>

            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                End Date
              </label>
              <DateBox
                value={endDate}
                onValueChanged={(e) => setEndDate(e.value)}
                type="date"
                displayFormat="yyyy-MM-dd"
              />
            </div>

            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                Include Vehicle Names
              </label>
              <SelectBox
                items={[
                  { id: true, text: 'Yes' },
                  { id: false, text: 'No' }
                ]}
                value={includeVehicleNames}
                onValueChanged={(e) => setIncludeVehicleNames(e.value)}
                valueExpr="id"
                displayExpr="text"
              />
            </div>

            <div className="tw-flex tw-items-end">
              <Button
                text="Fetch Data"
                icon="fa-light fa-download"
                onClick={fetchData}
                disabled={loading}
                type="default"
                stylingMode="contained"
                width="100%"
              />
            </div>
          </div>

          {/* API URL Display */}
          <div className="tw-bg-gray-50 tw-p-3 tw-rounded tw-border">
            <div className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">Current API Call:</div>
            <code className="tw-text-xs tw-text-blue-600 tw-break-all">
              {lastApiCall || 'No API call made yet'}
            </code>
          </div>
        </div>

        {/* Statistics Panel */}
        <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-6 tw-mb-6">
          <h2 className="tw-text-lg tw-font-semibold tw-mb-4">Statistics</h2>

          <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-4">
            <div className="tw-bg-blue-50 tw-p-4 tw-rounded-lg tw-border tw-border-blue-200">
              <div className="tw-text-blue-600 tw-text-sm tw-font-medium">Total Records</div>
              <div className="tw-text-2xl tw-font-bold tw-text-blue-800">
                {statistics.totalRecords || 0}
              </div>
            </div>

            <div className="tw-bg-green-50 tw-p-4 tw-rounded-lg tw-border tw-border-green-200">
              <div className="tw-text-green-600 tw-text-sm tw-font-medium">With Vehicles</div>
              <div className="tw-text-2xl tw-font-bold tw-text-green-800">
                {statistics.recordsWithVehicles || 0}
              </div>
            </div>

            <div className="tw-bg-orange-50 tw-p-4 tw-rounded-lg tw-border tw-border-orange-200">
              <div className="tw-text-orange-600 tw-text-sm tw-font-medium">Dispensing</div>
              <div className="tw-text-2xl tw-font-bold tw-text-orange-800">
                {statistics.dispensingRecords || 0}
              </div>
            </div>

            <div className="tw-bg-purple-50 tw-p-4 tw-rounded-lg tw-border tw-border-purple-200">
              <div className="tw-text-purple-600 tw-text-sm tw-font-medium">Total Volume Change</div>
              <div className="tw-text-2xl tw-font-bold tw-text-purple-800">
                {(statistics.totalVolumeChange || 0).toFixed(1)}L
              </div>
            </div>
          </div>
        </div>

        {/* Data Grid */}
        <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-6">
          <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
            <h2 className="tw-text-lg tw-font-semibold">Tank Volume History Data</h2>
            {loading && (
              <div className="tw-flex tw-items-center tw-text-blue-600">
                <LoadIndicator width="20px" height="20px" visible={true} />
                <span className="tw-ml-2 tw-text-sm">Loading...</span>
              </div>
            )}
          </div>

          {data.length === 0 && !loading ? (
            <div className="tw-text-center tw-py-12">
              <i className="fa-light fa-database tw-text-4xl tw-text-gray-300 tw-mb-4"></i>
              <p className="tw-text-gray-500 tw-text-lg">No data found</p>
              <p className="tw-text-gray-400 tw-text-sm">Try adjusting your parameters and fetch again</p>
            </div>
          ) : (
            <DataGrid
              dataSource={data}
              keyExpr="id"
              showBorders={true}
              showRowLines={true}
              rowAlternationEnabled={true}
              columnAutoWidth={true}
              height={500}
            >
              <SearchPanel visible={true} placeholder="Search records..." />
              <Paging enabled={true} pageSize={20} />

              <Column
                dataField="formattedTimestamp"
                caption="Timestamp"
                width={180}
                sortOrder="desc"
              />

              <Column
                dataField="tankName"
                caption="Tank"
                width={120}
              />

              <Column
                dataField="vehicleName"
                caption="Vehicle"
                width={140}
                cellRender={(cellData) => (
                  <span className={!cellData.value ? 'tw-text-gray-400 tw-italic' : 'tw-font-medium'}>
                    {cellData.value || 'N/A'}
                  </span>
                )}
              />

              <Column
                dataField="changeReason"
                caption="Change Reason"
                width={130}
                customizeText={(cellData) => getChangeReasonText(cellData.value)}
                cellRender={(cellData) => {
                  const isDispensing = cellData.value === 6;
                  return (
                    <span className={`tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-font-medium ${
                      isDispensing
                        ? 'tw-bg-red-100 tw-text-red-800'
                        : 'tw-bg-blue-100 tw-text-blue-800'
                    }`}>
                      {getChangeReasonText(cellData.value)}
                    </span>
                  );
                }}
              />

              <Column
                dataField="volumeChangeFormatted"
                caption="Volume Change"
                width={130}
                cellRender={(cellData) => {
                  const value = cellData.data.volumeChange || 0;
                  const isPositive = value > 0;
                  return (
                    <span className={isPositive ? 'tw-text-green-600 tw-font-semibold' : 'tw-text-red-600 tw-font-semibold'}>
                      {cellData.value}
                    </span>
                  );
                }}
              />

              <Column
                dataField="newVolume"
                caption="New Volume (L)"
                width={120}
                format="#,##0.00"
              />

              <Column
                dataField="recordedBy"
                caption="Recorded By"
                width={120}
              />

              <Summary>
                <TotalItem
                  column="volumeChange"
                  summaryType="sum"
                  displayFormat="Total Change: {0} L"
                  valueFormat="#,##0.00"
                />
                <TotalItem
                  column="id"
                  summaryType="count"
                  displayFormat="Total Records: {0}"
                />
              </Summary>
            </DataGrid>
          )}
        </div>

        {/* Quick Action Buttons */}
        <div className="tw-mt-6 tw-flex tw-gap-4">
          <Button
            text="Load Today's Site 22 Data"
            icon="fa-light fa-calendar-day"
            onClick={() => {
              setSiteId(22);
              setStartDate(new Date('2025-07-31'));
              setEndDate(new Date('2025-07-31'));
              setIncludeVehicleNames(true);
              setTimeout(fetchData, 100);
            }}
            type="default"
            stylingMode="outlined"
          />

          <Button
            text="Load All Sites Today"
            icon="fa-light fa-building"
            onClick={() => {
              setSiteId('all');
              setStartDate(new Date());
              setEndDate(new Date());
              setIncludeVehicleNames(true);
              setTimeout(fetchData, 100);
            }}
            type="default"
            stylingMode="outlined"
          />

          <Button
            text="Vehicle Transactions Only"
            icon="fa-light fa-truck"
            onClick={() => {
              // This would filter to show only records with vehicles
              // For now, just set parameters that are likely to have vehicle data
              setSiteId(22);
              setIncludeVehicleNames(true);
              setTimeout(fetchData, 100);
            }}
            type="default"
            stylingMode="outlined"
          />
        </div>
      </div>
    </div>
  );
};

export default TankVolumeHistoryDemo;
