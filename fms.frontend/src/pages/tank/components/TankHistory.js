import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DataGrid, Column, Paging, Pager, SearchPanel, Export, FilterRow, HeaderFilter, FilterPanel, Grouping, GroupPanel } from 'devextreme-react/data-grid';
import { DateBox } from 'devextreme-react/date-box';
import { Button } from 'devextreme-react/button';
import { Chart, Series, CommonSeriesSettings, Legend, ValueAxis, ArgumentAxis, Label, Tooltip } from 'devextreme-react/chart';
import notify from 'devextreme/ui/notify';
import { fetchTankVolumeHistory } from '../../../redux/actions/tankActions';
import { fetchUsers } from '../../../redux/actions/userActions';
import { Workbook } from 'exceljs';
import saveAs from 'file-saver';
import { exportDataGrid } from 'devextreme/excel_exporter';

const TankHistory = ({ tankId }) => {
  const dispatch = useDispatch();
  const { users } = useSelector(state => state.user);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0); // Start of today
    return date;
  });
  const [endDate, setEndDate] = useState(new Date()); // Current time
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'chart'
  const dataGridRef = React.useRef(null);

  const VolumeChangeReasonEnum = [
    { id: 0, name: 'Opening Stock' },
    { id: 1, name: 'Closing Stock' },
    { id: 2, name: 'Delivery' },
    { id: 3, name: 'Transfer In' },
    { id: 4, name: 'Transfer Out' },
    { id: 5, name: 'Adjustment' },
    { id: 6, name: 'Dispensing' }
  ];

  useEffect(() => {
    // Fetch users for mapping recordedBy
    dispatch(fetchUsers());
  }, [dispatch]);

  const fetchHistory = async () => {
    if (!tankId) {
      return;
    }

    setLoading(true);
    try {
      const result = await dispatch(fetchTankVolumeHistory(tankId, startDate, endDate));
      let data = [];
      if (result.success) {
        data = result.data || [];
      } else if (result.data) {
        data = result.data;
      } else if (Array.isArray(result)) {
        data = result;
      } else {
        notify(result.message || 'Error fetching history', 'error');
      }
      // Map PascalCase to camelCase for frontend compatibility
      const mappedData = (data || []).map(item => ({
        ...item,
        timestamp: item.Timestamp || item.timestamp,
        newVolume: item.NewVolume ?? item.newVolume,
        volumeChange: item.VolumeChange ?? item.volumeChange,
        changeReason: item.ChangeReason ?? item.changeReason,
        referenceType: item.ReferenceType ?? item.referenceType,
        vehicleName: item.VehicleName ?? item.vehicleName,
        recordedBy: item.RecordedBy ?? item.recordedBy,
      }));
      setHistoryData(mappedData);
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

  const formatDateTime = (cellInfo) => {
    if (!cellInfo.value) return '-';
    const date = new Date(cellInfo.value);
    const utcDate = new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds()
      )
    );
    return utcDate.toLocaleString();
  };

  const changeReasonCellRender = (cellInfo) => {
    const reason = VolumeChangeReasonEnum.find(r => r.id === cellInfo.value);
    if (reason) {
      if (reason.name === 'Dispensing' && cellInfo.data.vehicleName) {
        return `${reason.name} - ${cellInfo.data.vehicleName}`;
      }
      return reason.name;
    }
    return cellInfo.value || '-';
  };

  const volumeChangeCellRender = (cellInfo) => {
    const value = cellInfo.value || 0;
    const formattedValue = value.toFixed(2);
    const isPositive = value > 0;
    const isNegative = value < 0;

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        color: isPositive ? '#10b981' : isNegative ? '#ef4444' : '#6b7280',
        fontWeight: '600'
      }}>
        {isPositive && <i className="fa-solid fa-arrow-up" style={{ marginRight: '4px', fontSize: '12px' }}></i>}
        {isNegative && <i className="fa-solid fa-arrow-down" style={{ marginRight: '4px', fontSize: '12px' }}></i>}
        {isPositive ? '+' : ''}{formattedValue} L
      </div>
    );
  };

  const onExporting = (e) => {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Tank History');

    exportDataGrid({
      component: dataGridRef.current.instance,
      worksheet: worksheet,
      autoFilterEnabled: true,
      customizeCell: ({ gridCell, excelCell }) => {
        if (gridCell.column.dataField === 'changeReason') {
          const reason = VolumeChangeReasonEnum.find(r => r.id === gridCell.value);
          if (reason) {
            excelCell.value = reason.name;
          }
        }
        if (gridCell.column.dataField === 'timestamp' && gridCell.value) {
          excelCell.value = new Date(gridCell.value).toLocaleString();
        }
      }
    }).then(() => {
      workbook.xlsx.writeBuffer().then((buffer) => {
        saveAs(new Blob([buffer], { type: 'application/octet-stream' }), `tank_history_${tankId}.xlsx`);
      });
    });
    e.cancel = true;
  };

  const columns = (
    <>
      <Column
        dataField="timestamp"
        caption="Date/Time"
        dataType="datetime"
        sortOrder="desc"
        width={180}
        cellRender={formatDateTime}
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
        width={140}
        cellRender={volumeChangeCellRender}
      />
      <Column
        dataField="changeReason"
        caption="Type"
        width={150}
        cellRender={changeReasonCellRender}
      />
      <Column
        dataField="vehicleName"
        caption="Vehicle"
        width={150}
        cellRender={(data) => {
          return <span>{data.value || '-'}</span>;
        }}
      />
      <Column
        dataField="recordedBy"
        caption="Recorded By"
        width={150}
        cellRender={(data) => {
          const user = users?.find(u => u.id === data.value);
          return <span>{user ? `${user.firstName} ${user.lastName}`.trim() || user.email : '-'}</span>;
        }}
      />
    </>
  );

  return (
    <div className="tank-history tw-p-4" style={{ minHeight: '500px', backgroundColor: '#f9fafb' }}>
      {loading && (
        <div className="tw-flex tw-items-center tw-justify-center tw-p-4">
          <div className="tw-text-center">
            <i className="fa-light fa-spinner fa-spin tw-text-4xl tw-text-blue-600"></i>
            <p className="tw-mt-2">Loading tank history...</p>
          </div>
        </div>
      )}
      {!loading && (
        <>
          <div className="tw-mb-4">
            <div className="tw-flex tw-items-center tw-gap-4 tw-flex-wrap tw-bg-white tw-p-3 tw-rounded-lg tw-shadow-sm">
              <div className="tw-flex tw-items-center tw-gap-2">
                <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-whitespace-nowrap">From:</label>
                <DateBox
                  value={startDate}
                  onValueChanged={(e) => setStartDate(e.value)}
                  type="datetime"
                  width={180}
                  displayFormat="MMM dd, yyyy HH:mm"
                />
              </div>
              <div className="tw-flex tw-items-center tw-gap-2">
                <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-whitespace-nowrap">To:</label>
                <DateBox
                  value={endDate}
                  onValueChanged={(e) => setEndDate(e.value)}
                  type="datetime"
                  width={180}
                  displayFormat="MMM dd, yyyy HH:mm"
                />
              </div>
              <Button
                text="Apply"
                icon="fa-light fa-check"
                onClick={handleDateChange}
                type="default"
                stylingMode="contained"
              />
              <div className="tw-border-l tw-pl-4 tw-ml-2 tw-flex tw-gap-2">
                <Button
                  text="Today"
                  onClick={() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    setStartDate(today);
                    setEndDate(new Date());
                    fetchHistory();
                  }}
                  type="normal"
                />
                <Button
                  text="Last 7 Days"
                  onClick={() => {
                    const end = new Date();
                    const start = new Date();
                    start.setDate(start.getDate() - 7);
                    start.setHours(0, 0, 0, 0);
                    setStartDate(start);
                    setEndDate(end);
                    fetchHistory();
                  }}
                  type="normal"
                />
                <Button
                  text="Last 30 Days"
                  onClick={() => {
                    const end = new Date();
                    const start = new Date();
                    start.setDate(start.getDate() - 30);
                    start.setHours(0, 0, 0, 0);
                    setStartDate(start);
                    setEndDate(end);
                    fetchHistory();
                  }}
                  type="normal"
                />
              </div>
            </div>

            <div className="tw-flex tw-justify-end tw-mt-3">
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
              ref={dataGridRef}
              dataSource={historyData}
              showBorders={true}
              columnAutoWidth={true}
              height="auto"
              showRowLines={true}
              hoverStateEnabled={true}
              noDataText="No tank history available"
              onExporting={onExporting}
              allowColumnResizing={true}
              showColumnHeaders={true}
            >
              <FilterPanel visible={true} />
              <GroupPanel visible={false} />
              <Grouping autoExpandAll={false} />
              <HeaderFilter visible={true} />
              <FilterRow visible={true} />
              <SearchPanel visible={true} placeholder="Search history..." />
              <Export enabled={true} />
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
                <Label
                  customizeText={(e) => {
                    const date = new Date(e.value);
                    return date.toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    });
                  }}
                  rotationAngle={45}
                />
              </ArgumentAxis>
              <Legend visible={true} />
              <Tooltip
                enabled={true}
                customizeTooltip={(arg) => {
                  const date = new Date(arg.argument);
                  return {
                    text: `Volume: ${arg.value.toFixed(2)} L<br/>Date: ${date.toLocaleDateString('en-GB')} ${date.toLocaleTimeString()}`
                  };
                }}
              />
            </Chart>
          )}
        </>
      )}
    </div>
  );
};

export default TankHistory;