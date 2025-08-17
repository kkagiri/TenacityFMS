import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DataGrid, Column, Paging, Pager, SearchPanel, Export, FilterRow, HeaderFilter, FilterPanel, Grouping, GroupPanel } from 'devextreme-react/data-grid';
import { DateBox } from 'devextreme-react/date-box';
import { Button } from 'devextreme-react/button';
import { Chart, Series, CommonSeriesSettings, Legend, ValueAxis, ArgumentAxis, Label, Tooltip } from 'devextreme-react/chart';
import notify from 'devextreme/ui/notify';
import { fetchTankVolumeHistoryFiltered } from '../../../redux/actions/tankVolumeHistoryActions';
import { fetchUsers } from '../../../redux/actions/userActions';
import { Workbook } from 'exceljs';
import saveAs from 'file-saver';
import { exportDataGrid } from 'devextreme/excel_exporter';
import './TankHistory.scss';

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

  const fetchHistory = useCallback(async () => {
    if (!tankId) {
      return;
    }

    setLoading(true);
    try {
      // Format dates for API
      const formattedStartDate = startDate.toISOString();
      const formattedEndDate = endDate.toISOString();

      // Use the filtered endpoint with tank-specific filters
      const result = await dispatch(fetchTankVolumeHistoryFiltered({
        tankId: tankId,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        includeVehicleNames: true,
        take: 500
      }));

      let data = [];
      if (result && Array.isArray(result)) {
        data = result;
      } else if (result && result.data && Array.isArray(result.data)) {
        data = result.data;
      } else if (result && result.success && result.data) {
        data = result.data;
      } else {
        notify(result?.message || 'Error fetching history', 'error');
      }

      // The filtered endpoint already returns normalized data
      // with proper field names (camelCase) including vehicleName, siteId, etc.
      console.log('🔍 Debug - Tank History Data Sample:', data?.slice(0, 2));
      setHistoryData(data || []);
    } catch (error) {
      console.error('Error fetching tank history:', error);
      notify('Error fetching tank history', 'error');
    } finally {
      setLoading(false);
    }
  }, [dispatch, tankId, startDate, endDate]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDateChange = useCallback(() => {
    if (startDate > endDate) {
      notify('Start date must be before end date', 'warning');
      return;
    }
    fetchHistory();
  }, [startDate, endDate, fetchHistory]);

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

  const customizeTooltip = (pointInfo) => {
    console.log('🔍 Tooltip Debug - pointInfo:', pointInfo);

    const { argument, value, point } = pointInfo;
    console.log('🔍 Tooltip Debug - point.data:', point?.data);

    if (!point || !point.data) {
      console.warn('⚠️ Tooltip Warning: No point data available');
      return {
        html: `<div style="padding: 10px; background: #ffffff; border: 1px solid #d1d5db;">
          <strong>Tank Volume:</strong> ${value?.toLocaleString() || 'N/A'} L<br/>
          <strong>Date:</strong> ${new Date(argument).toLocaleDateString()}
        </div>`
      };
    }

    const { changeReason, vehicleName, volumeChange, recordedByUserName, site, referenceType, referenceId } = point.data;
    const date = new Date(argument);
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    const formattedTime = date.toLocaleTimeString();

    // Reason names mapping
    const reasonNames = {
      0: 'Opening Stock',
      1: 'Closing Stock',
      2: 'Delivery',
      3: 'Transfer In',
      4: 'Transfer Out',
      5: 'Adjustment',
      6: 'Dispensing'
    };

    const changeReasonText = reasonNames[changeReason] || 'Unknown';
    const volumeChangeValue = volumeChange || 0;
    const changeSymbol = volumeChangeValue > 0 ? '+' : '';

    let tooltipHtml = `
      <div style="
        padding: 10px;
        background: #ffffff;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        font-family: Arial, sans-serif;
        font-size: 12px;
        line-height: 1.4;
        text-align: left;
        min-width: 200px;
      ">
        <div style="font-weight: bold; color: #1f2937; margin-bottom: 8px; text-align: center;">
          Tank Volume Details
        </div>

        <span><strong>Date:</strong> ${formattedDate}</span><br/>
        <span><strong>Time:</strong> ${formattedTime}</span><br/>
        <span><strong>Volume:</strong> ${value.toLocaleString()} L</span><br/>
        <span><strong>Change:</strong> ${changeSymbol}${volumeChangeValue.toFixed(2)} L</span><br/>
        <span><strong>Type:</strong> ${changeReasonText}</span>
    `;

    // Add vehicle name if it's a dispensing transaction
    if (changeReason === 6 && vehicleName && vehicleName !== 'N/A' && vehicleName.trim() !== '') {
      tooltipHtml += `<br/><span><strong>Vehicle:</strong> ${vehicleName}</span>`;
    }

    // Add site information
    if (site && site.trim() !== '') {
      tooltipHtml += `<br/><span><strong>Site:</strong> ${site}</span>`;
    }

    // Add user information
    let userName = '';
    if (recordedByUserName && recordedByUserName.trim() !== '') {
      userName = recordedByUserName;
    }

    if (userName) {
      tooltipHtml += `<br/><span><strong>Recorded By:</strong> ${userName}</span>`;
    }

    // Add reference information if available
    if (referenceType && referenceId) {
      tooltipHtml += `<br/><span><strong>Reference:</strong> ${referenceType} #${referenceId}</span>`;
    }

    tooltipHtml += '</div>';

    console.log('✅ Tooltip HTML generated successfully');
    return { html: tooltipHtml };
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
        dataField="recordedByUserName"
        caption="Recorded By"
        width={150}
        cellRender={(data) => {
          // Use recordedByUserName first, then fallback to user lookup
          if (data.value && data.value.trim() !== '') {
            return <span>{data.value}</span>;
          }

          // Fallback to user lookup if recordedByUserName is not available
          if (data.data && data.data.recordedBy) {
            const user = users?.find(u => u.id === data.data.recordedBy);
            const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : '-';
            return <span>{userName}</span>;
          }

          return <span>-</span>;
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
              tooltip={{
                enabled: true,
                format: "fixedPoint",
                precision: 2,
                container: "body" // Force tooltip to be appended to body
              }}
              onInitialized={(e) => {
                // Fix tooltip z-index after chart initialization
                setTimeout(() => {
                  const tooltips = document.querySelectorAll('.dx-chart-tooltip, .dx-tooltip, .dx-tooltip-wrapper, div[class*="tooltip"]');
                  tooltips.forEach(tooltip => {
                    tooltip.style.zIndex = '99999';
                    tooltip.style.position = 'fixed';
                  });
                }, 100);

                // Set up mutation observer to catch dynamically created tooltips
                const observer = new MutationObserver((mutations) => {
                  mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                      if (node.nodeType === 1) { // Element node
                        const tooltips = node.querySelectorAll?.('.dx-chart-tooltip, .dx-tooltip, .dx-tooltip-wrapper') || [];
                        tooltips.forEach(tooltip => {
                          tooltip.style.zIndex = '99999';
                          tooltip.style.position = 'fixed';
                        });

                        // Check if the node itself is a tooltip
                        if (node.classList && (node.classList.contains('dx-chart-tooltip') || node.classList.contains('dx-tooltip'))) {
                          node.style.zIndex = '99999';
                          node.style.position = 'fixed';
                        }
                      }
                    });
                  });
                });

                observer.observe(document.body, { childList: true, subtree: true });
              }}
            >
              <CommonSeriesSettings argumentField="timestamp" type="line" />
              <Series
                valueField="newVolume"
                name="Tank Volume"
                color="#3b82f6"
                point={{
                  visible: true,
                  size: 8,
                  symbol: 'circle',
                  color: '#1d4ed8',
                  border: {
                    visible: true,
                    width: 2,
                    color: '#ffffff'
                  }
                }}
                width={3}
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
                customizeTooltip={customizeTooltip}
                onTooltipShown={(e) => {
                  // Ensure tooltip has the highest z-index when shown
                  if (e.element) {
                    e.element.style.zIndex = '99999';
                    e.element.style.position = 'fixed';
                  }

                  // Also check for parent elements that might be tooltip containers
                  let parent = e.element?.parentElement;
                  while (parent && parent !== document.body) {
                    if (parent.classList && (parent.classList.contains('dx-tooltip') || parent.classList.contains('dx-chart-tooltip'))) {
                      parent.style.zIndex = '99999';
                      parent.style.position = 'fixed';
                    }
                    parent = parent.parentElement;
                  }

                  // Force immediate DOM update
                  setTimeout(() => {
                    const allTooltips = document.querySelectorAll('.dx-chart-tooltip, .dx-tooltip, div[class*="tooltip"]');
                    allTooltips.forEach(tooltip => {
                      tooltip.style.zIndex = '99999';
                      tooltip.style.position = 'fixed';
                    });
                  }, 0);
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