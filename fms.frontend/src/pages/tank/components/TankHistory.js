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

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const columns = (
    <>
      <Column
        dataField="timestamp"
        caption="Date/Time"
        dataType="datetime"
        format="yyyy-MM-dd HH:mm:ss"
        sortOrder="desc"
      />
      <Column
        dataField="volume"
        caption="Volume (L)"
        dataType="number"
        format="#,##0.00"
      />
      <Column
        dataField="changeAmount"
        caption="Change (L)"
        dataType="number"
        format="#,##0.00"
        cellRender={(data) => {
          const value = data.value || 0;
          const color = value > 0 ? 'tw-text-green-600' : value < 0 ? 'tw-text-red-600' : '';
          return <span className={color}>{value > 0 ? '+' : ''}{value.toFixed(2)}</span>;
        }}
      />
      <Column
        dataField="changeType"
        caption="Type"
      />
      <Column
        dataField="description"
        caption="Description"
      />
    </>
  );

  return (
    <div className="tank-history tw-p-4">
      <div className="tw-mb-4 tw-flex tw-items-center tw-gap-4 tw-flex-wrap">
        <div className="tw-flex tw-items-center tw-gap-2">
          <label className="tw-text-sm tw-font-medium">From:</label>
          <DateBox
            value={startDate}
            onValueChanged={(e) => setStartDate(e.value)}
            type="datetime"
            width={200}
          />
        </div>
        <div className="tw-flex tw-items-center tw-gap-2">
          <label className="tw-text-sm tw-font-medium">To:</label>
          <DateBox
            value={endDate}
            onValueChanged={(e) => setEndDate(e.value)}
            type="datetime"
            width={200}
          />
        </div>
        <Button
          text="Refresh"
          icon="refresh"
          onClick={handleDateChange}
          type="default"
        />
        <div className="tw-ml-auto tw-flex tw-gap-2">
          <Button
            text="Table View"
            icon="fas fa-table"
            onClick={() => setViewMode('table')}
            type={viewMode === 'table' ? 'default' : 'normal'}
          />
          <Button
            text="Chart View"
            icon="fas fa-chart-line"
            onClick={() => setViewMode('chart')}
            type={viewMode === 'chart' ? 'default' : 'normal'}
          />
        </div>
      </div>

      {viewMode === 'table' ? (
        <DataGrid
          dataSource={historyData}
          showBorders={true}
          columnAutoWidth={true}
          height={400}
        >
          <SearchPanel visible={true} />
          <Export enabled={true} />
          <Paging defaultPageSize={20} />
          <Pager showPageSizeSelector={true} allowedPageSizes={[10, 20, 50]} />
          {columns}
        </DataGrid>
      ) : (
        <Chart
          dataSource={historyData}
          height={400}
        >
          <CommonSeriesSettings argumentField="timestamp" type="line" />
          <Series
            valueField="volume"
            name="Tank Volume"
            color="#1f77b4"
          />
          <ValueAxis>
            <Label format="#,##0 L" />
          </ValueAxis>
          <ArgumentAxis>
            <Label format="shortDateShortTime" />
          </ArgumentAxis>
          <Legend visible={true} />
          <Tooltip enabled={true} />
        </Chart>
      )}
    </div>
  );
};

export default TankHistory;