import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { DataGrid, Column, Paging, Pager, SearchPanel, Export } from 'devextreme-react/data-grid';
import { DateBox } from 'devextreme-react/date-box';
import { Button } from 'devextreme-react/button';
import { Chart, Series, CommonSeriesSettings, Legend, ValueAxis, ArgumentAxis, Label, Tooltip } from 'devextreme-react/chart';
import notify from 'devextreme/ui/notify';
import { fetchTankVolumeHistory } from '../../../redux/actions/tankActions';

const TankHistory = ({ tankId }) => {
  const dispatch = useDispatch();
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)); // 7 days ago
  const [endDate, setEndDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'chart'

  const fetchHistory = async () => {
    if (!tankId) return;

    setLoading(true);
    try {
      const result = await dispatch(fetchTankVolumeHistory(tankId, startDate, endDate));
      if (result.success) {
        setHistoryData(result.data || []);
      } else if (result.data) {
        // Handle direct array response
        setHistoryData(result.data);
      } else if (Array.isArray(result)) {
        // Handle if result is directly an array
        setHistoryData(result);
      } else {
        notify(result.message || 'Error fetching history', 'error');
      }
    } catch (error) {
      notify('Error fetching tank history', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [tankId]);

  const handleDateChange = () => {
    if (startDate > endDate) {
      notify('Start date must be before end date', 'warning');
      return;
    }
    fetchHistory();
  };

  const getChangeReasonText = (reason) => {
    const reasons = {
      0: 'Opening Stock',
      1: 'Manual Adjustment',
      2: 'Delivery',
      3: 'Transfer In',
      4: 'Transfer Out',
      5: 'Consumption',
      6: 'Dispense',
      7: 'Other'
    };
    return reasons[reason] || 'Unknown';
  };

  const columns = (
    <>
      <Column
        dataField="timestamp"
        caption="Date/Time"
        dataType="datetime"
        format="yyyy-MM-dd HH:mm:ss"
        sortOrder="desc"
        width={180}
      />
      <Column
        dataField="newVolume"
        caption="Volume (L)"
        dataType="number"
        format="#,##0.00"
        width={120}
      />
      <Column
        dataField="volumeChange"
        caption="Change (L)"
        dataType="number"
        format="#,##0.00"
        width={120}
        cellRender={(data) => {
          const value = data.value || 0;
          const color = value > 0 ? 'tw-text-green-600' : value < 0 ? 'tw-text-red-600' : '';
          return <span className={`tw-font-semibold ${color}`}>{value > 0 ? '+' : ''}{value.toFixed(2)}</span>;
        }}
      />
      <Column
        dataField="changeReason"
        caption="Type"
        width={150}
        cellRender={(data) => {
          return <span className="tw-font-medium">{getChangeReasonText(data.value)}</span>;
        }}
      />
      <Column
        dataField="referenceType"
        caption="Reference"
        width={120}
      />
      <Column
        dataField="vehicleName"
        caption="Vehicle"
        width={150}
        cellRender={(data) => {
          return <span>{data.value || '-'}</span>;
        }}
      />
    </>
  );

  return (
    <div className="tank-history tw-p-4">
      <div className="tw-mb-4 tw-space-y-4">
        <div className="tw-flex tw-items-center tw-gap-4 tw-flex-wrap">
          <div className="tw-flex tw-items-center tw-gap-2">
            <label className="tw-text-sm tw-font-medium tw-text-gray-700">From:</label>
            <DateBox
              value={startDate}
              onValueChanged={(e) => setStartDate(e.value)}
              type="datetime"
              width={200}
              displayFormat="dd/MM/yyyy HH:mm"
            />
          </div>
          <div className="tw-flex tw-items-center tw-gap-2">
            <label className="tw-text-sm tw-font-medium tw-text-gray-700">To:</label>
            <DateBox
              value={endDate}
              onValueChanged={(e) => setEndDate(e.value)}
              type="datetime"
              width={200}
              displayFormat="dd/MM/yyyy HH:mm"
            />
          </div>
          <Button
            text="Apply"
            icon="fa-light fa-check"
            onClick={handleDateChange}
            type="default"
            stylingMode="contained"
          />
        </div>

        <div className="tw-flex tw-items-center tw-justify-between">
          <div className="tw-flex tw-gap-2">
            <Button
              text="Today"
              onClick={() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                setStartDate(today);
                setEndDate(new Date());
              }}
              type="normal"
            />
            <Button
              text="Last 7 Days"
              onClick={() => {
                setStartDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
                setEndDate(new Date());
              }}
              type="normal"
            />
            <Button
              text="Last 30 Days"
              onClick={() => {
                setStartDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
                setEndDate(new Date());
              }}
              type="normal"
            />
          </div>

          <div className="tw-flex tw-gap-2">
            <Button
              text="Table View"
              icon="fa-light fa-table"
              onClick={() => setViewMode('table')}
              type={viewMode === 'table' ? 'default' : 'normal'}
            />
            <Button
              text="Chart View"
              icon="fa-light fa-chart-line"
              onClick={() => setViewMode('chart')}
              type={viewMode === 'chart' ? 'default' : 'normal'}
            />
          </div>
        </div>
      </div>

      {viewMode === 'table' ? (
        <DataGrid
          dataSource={historyData}
          showBorders={true}
          columnAutoWidth={true}
          height={400}
          showRowLines={true}
          hoverStateEnabled={true}
        >
          <SearchPanel visible={true} placeholder="Search history..." />
          <Export enabled={true} fileName={`tank_history_${tankId}`} />
          <Paging defaultPageSize={20} />
          <Pager showPageSizeSelector={true} allowedPageSizes={[10, 20, 50, 100]} showInfo={true} />
          {columns}
        </DataGrid>
      ) : (
        <Chart
          dataSource={historyData}
          height={400}
          title="Tank Volume Over Time"
        >
          <CommonSeriesSettings argumentField="timestamp" type="line" />
          <Series
            valueField="newVolume"
            name="Tank Volume"
            color="#3b82f6"
            point={{ visible: true, size: 6 }}
          />
          <ValueAxis>
            <Label format="#,##0 L" />
          </ValueAxis>
          <ArgumentAxis>
            <Label format="shortDateShortTime" rotationAngle={45} />
          </ArgumentAxis>
          <Legend visible={true} />
          <Tooltip enabled={true} customizeTooltip={(arg) => {
            return {
              text: `Volume: ${arg.value.toFixed(2)} L<br/>Date: ${new Date(arg.argument).toLocaleString()}`
            };
          }} />
        </Chart>
      )}
    </div>
  );
};

export default TankHistory;