import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DateBox, SelectBox, Button, LoadIndicator, Switch, ProgressBar } from 'devextreme-react';
import { DataGrid, Column, Paging, Pager } from 'devextreme-react/data-grid';
import notify from 'devextreme/ui/notify';
import {
  checkDateRange,
  fixDateRange,
  clearBatchCheckResult,
  clearBatchFixResult,
  selectBatchCheckResult,
  selectBatchFixResult,
  selectLoading,
  selectError
} from '../../redux/slices/reconciliationSlice';
import { usePermissions } from '../../hooks/usePermissions';

/**
 * Batch Reconciliation Tool
 * Allows batch processing of reconciliation for date ranges
 */
const BatchReconciliationTool = () => {
  const dispatch = useDispatch();
  const { hasPermission } = usePermissions();
  const [tankId, setTankId] = useState(null);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)); // Last 7 days
  const [endDate, setEndDate] = useState(new Date());
  const [autoFix, setAutoFix] = useState(false);

  // Get tanks from Redux store
  const tanks = useSelector((state) => state.tank.tanks || []);
  const tanksLoading = useSelector((state) => state.tank.loading);

  const checkResult = useSelector(selectBatchCheckResult);
  const fixResult = useSelector(selectBatchFixResult);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);

  const canRead = hasPermission('_Read_tankStock');
  const canUpdate = hasPermission('_Update_tankStock');

  // Transform tanks for SelectBox
  const tanksDataSource = tanks.map(tank => ({
    id: tank.id,
    name: tank.name
  }));

  const handleProcessClick = async () => {
    if (!tankId) {
      notify('Please select a tank', 'warning', 3000);
      return;
    }

    if (!startDate || !endDate) {
      notify('Please select date range', 'warning', 3000);
      return;
    }

    if (startDate > endDate) {
      notify('Start date must be before end date', 'warning', 3000);
      return;
    }

    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    if (daysDiff > 90) {
      notify('Date range cannot exceed 90 days', 'warning', 3000);
      return;
    }

    dispatch(clearBatchCheckResult());
    dispatch(clearBatchFixResult());

    const formattedStart = startDate.toISOString().split('T')[0];
    const formattedEnd = endDate.toISOString().split('T')[0];

    try {
      if (autoFix) {
        await dispatch(fixDateRange({
          tankId,
          startDate: formattedStart,
          endDate: formattedEnd
        })).unwrap();
        notify('Batch reconciliation with auto-fix completed', 'success', 3000);
      } else {
        await dispatch(checkDateRange({
          tankId,
          startDate: formattedStart,
          endDate: formattedEnd
        })).unwrap();
        notify('Batch check completed', 'success', 3000);
      }
    } catch (err) {
      notify(`Error: ${err.message || 'Failed to process batch reconciliation'}`, 'error', 5000);
    }
  };

  const handleClearResults = () => {
    dispatch(clearBatchCheckResult());
    dispatch(clearBatchFixResult());
  };

  if (!canRead) {
    return (
      <div className="tw-text-center tw-py-12">
        <i className="fa-light fa-lock tw-text-6xl tw-text-gray-400 tw-mb-4"></i>
        <p className="tw-text-lg tw-text-gray-600">
          You don't have permission to access reconciliation data
        </p>
      </div>
    );
  }

  const isProcessing = loading.batchCheck || loading.batchFix;
  const result = fixResult || checkResult;
  const selectedTank = tanksDataSource.find(t => t.id === tankId);
  const daysDiff = startDate && endDate ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1 : 0;

  // Calculate progress for visual feedback
  const progressPercent = result?.data
    ? (result.data.totalDaysProcessed / daysDiff * 100)
    : 0;

  return (
    <div className="tw-space-y-6">
      {/* Selection Form */}
      <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-6">
        <h3 className="tw-text-lg tw-font-semibold tw-mb-4 tw-flex tw-items-center tw-gap-2">
          <i className="fa-light fa-sliders tw-text-purple-500"></i>
          Batch Configuration
        </h3>

        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4 tw-mb-6">
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              <i className="fa-light fa-gas-pump tw-mr-1"></i>
              Tank
            </label>
            <SelectBox
              dataSource={tanksDataSource}
              displayExpr="name"
              valueExpr="id"
              placeholder="Select a tank..."
              value={tankId}
              onValueChanged={(e) => setTankId(e.value)}
              searchEnabled={true}
              showClearButton={true}
              disabled={tanksLoading}
            />
            {tanksLoading && (
              <div className="tw-text-xs tw-text-gray-500 tw-mt-1">
                Loading tanks...
              </div>
            )}
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              <i className="fa-light fa-calendar-arrow-down tw-mr-1"></i>
              Start Date
            </label>
            <DateBox
              value={startDate}
              onValueChanged={(e) => setStartDate(e.value)}
              displayFormat="dd/MM/yyyy"
              max={endDate || new Date()}
              showClearButton={true}
            />
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              <i className="fa-light fa-calendar-arrow-up tw-mr-1"></i>
              End Date
            </label>
            <DateBox
              value={endDate}
              onValueChanged={(e) => setEndDate(e.value)}
              displayFormat="dd/MM/yyyy"
              min={startDate}
              max={new Date()}
              showClearButton={true}
            />
          </div>
        </div>

        {/* Date Range Info */}
        {daysDiff > 0 && (
          <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded tw-p-3 tw-mb-4">
            <div className="tw-flex tw-items-center tw-justify-between tw-text-sm">
              <span className="tw-text-blue-900">
                <i className="fa-light fa-calendar-days tw-mr-2"></i>
                {daysDiff} day{daysDiff > 1 ? 's' : ''} will be processed
              </span>
              {daysDiff > 30 && (
                <span className="tw-text-orange-700 tw-font-medium">
                  <i className="fa-light fa-triangle-exclamation tw-mr-1"></i>
                  Large date range - may take longer
                </span>
              )}
            </div>
          </div>
        )}

        {/* Auto-fix Toggle */}
        {canUpdate && (
          <div className="tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded tw-p-4 tw-mb-6">
            <div className="tw-flex tw-items-start tw-justify-between">
              <div className="tw-flex-1">
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                  <i className="fa-light fa-wand-magic-sparkles tw-mr-2 tw-text-purple-500"></i>
                  Auto-Fix Mode
                </label>
                <p className="tw-text-xs tw-text-gray-600">
                  Automatically fix all discrepancies found during the batch process
                </p>
              </div>
              <Switch
                value={autoFix}
                onValueChanged={(e) => setAutoFix(e.value)}
                disabled={isProcessing}
              />
            </div>
            {autoFix && (
              <div className="tw-mt-3 tw-text-xs tw-text-orange-600 tw-bg-orange-50 tw-border tw-border-orange-200 tw-rounded tw-p-2">
                <i className="fa-light fa-circle-info tw-mr-1"></i>
                All discrepancies will be automatically fixed. Volume History will be updated to match Tank Stock.
              </div>
            )}
          </div>
        )}

        <div className="tw-flex tw-flex-wrap tw-gap-3">
          <Button
            text={autoFix ? "Process with Auto-Fix" : "Check Only"}
            icon={autoFix ? "fa-light fa-wand-magic-sparkles" : "fa-light fa-magnifying-glass"}
            type={autoFix ? "success" : "default"}
            stylingMode="contained"
            onClick={handleProcessClick}
            disabled={isProcessing || !tankId || !startDate || !endDate}
          >
            {isProcessing && <LoadIndicator className="tw-mr-2" width={20} height={20} />}
          </Button>

          {result && (
            <Button
              text="Clear Results"
              icon="fa-light fa-broom"
              type="normal"
              stylingMode="outlined"
              onClick={handleClearResults}
            />
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {isProcessing && (
        <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-6">
          <div className="tw-flex tw-items-center tw-gap-3 tw-mb-4">
            <LoadIndicator width={32} height={32} />
            <div>
              <h3 className="tw-font-semibold">Processing...</h3>
              <p className="tw-text-sm tw-text-gray-600">
                Reconciling {selectedTank?.name} from {startDate?.toLocaleDateString()} to {endDate?.toLocaleDateString()}
              </p>
            </div>
          </div>
          <ProgressBar value={progressPercent} showStatus={true} />
        </div>
      )}

      {/* Results */}
      {result && !isProcessing && (
        <div className="tw-space-y-4">
          {/* Summary Card */}
          <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-6">
            <h3 className="tw-text-lg tw-font-semibold tw-mb-4 tw-flex tw-items-center tw-gap-2">
              <i className="fa-light fa-chart-bar tw-text-purple-500"></i>
              Reconciliation Summary
            </h3>
            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-4 tw-gap-4">
              <div className="tw-bg-blue-50 tw-p-4 tw-rounded-lg">
                <div className="tw-text-sm tw-text-gray-600 tw-mb-1">Total Days</div>
                <div className="tw-text-2xl tw-font-bold tw-text-blue-600">{result.totalDaysProcessed || 0}</div>
              </div>
              <div className="tw-bg-yellow-50 tw-p-4 tw-rounded-lg">
                <div className="tw-text-sm tw-text-gray-600 tw-mb-1">Days with Issues</div>
                <div className="tw-text-2xl tw-font-bold tw-text-yellow-600">{result.daysWithDiscrepancies || 0}</div>
              </div>
              <div className="tw-bg-red-50 tw-p-4 tw-rounded-lg">
                <div className="tw-text-sm tw-text-gray-600 tw-mb-1">Total Discrepancies</div>
                <div className="tw-text-2xl tw-font-bold tw-text-red-600">{result.totalDiscrepancies || 0}</div>
              </div>
              <div className="tw-bg-green-50 tw-p-4 tw-rounded-lg">
                <div className="tw-text-sm tw-text-gray-600 tw-mb-1">Records Fixed</div>
                <div className="tw-text-2xl tw-font-bold tw-text-green-600">{result.totalRecordsFixed || 0}</div>
              </div>
            </div>
            <div className="tw-mt-4 tw-p-4 tw-bg-gray-50 tw-rounded-lg">
              <div className="tw-flex tw-items-center tw-gap-2">
                <i className={`fa-light ${result.status === 'RECONCILED' ? 'fa-circle-check tw-text-green-600' : 'fa-circle-info tw-text-blue-600'} tw-text-xl`}></i>
                <div>
                  <div className="tw-font-semibold tw-text-gray-900">Status: {result.status}</div>
                  <div className="tw-text-sm tw-text-gray-600">{result.message}</div>
                </div>
              </div>
            </div>
          </div>

          {result.results?.length > 0 && (
            <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-6">
              <h3 className="tw-text-lg tw-font-semibold tw-mb-4 tw-flex tw-items-center tw-gap-2">
                <i className="fa-light fa-table tw-text-purple-500"></i>
                Daily Results ({result.results.length} days)
              </h3>

              <DataGrid
                dataSource={result.results}
                showBorders={true}
                showRowLines={true}
                rowAlternationEnabled={true}
                hoverStateEnabled={true}
                columnAutoWidth={true}
              >
                <Paging enabled={true} defaultPageSize={10} />
                <Pager
                  showPageSizeSelector={true}
                  allowedPageSizes={[10, 20, 50]}
                  showInfo={true}
                />

                <Column
                  dataField="reconciliationDate"
                  caption="Date"
                  dataType="date"
                  format="dd/MM/yyyy"
                />
                <Column
                  dataField="status"
                  caption="Status"
                  alignment="center"
                  cellRender={(data) => {
                    const status = data.value;
                    let color = 'tw-text-gray-600';
                    let icon = 'fa-circle-info';
                    if (status === 'RECONCILED') {
                      color = 'tw-text-green-600';
                      icon = 'fa-circle-check';
                    } else if (status === 'NO_TANKSTOCK') {
                      color = 'tw-text-yellow-600';
                      icon = 'fa-circle-exclamation';
                    } else if (status === 'DISCREPANCY') {
                      color = 'tw-text-red-600';
                      icon = 'fa-circle-xmark';
                    }
                    return (
                      <span className={`${color} tw-font-semibold tw-flex tw-items-center tw-gap-1`}>
                        <i className={`fa-light ${icon}`}></i>
                        {status}
                      </span>
                    );
                  }}
                />
                <Column
                  dataField="discrepanciesFound"
                  caption="Discrepancies"
                  alignment="center"
                  cellRender={(data) => {
                    const count = data.value;
                    if (count === 0) {
                      return <span className="tw-text-green-600 tw-font-semibold">✓ None</span>;
                    }
                    const color = count <= 3 ? 'tw-text-yellow-600' : 'tw-text-red-600';
                    return <span className={`${color} tw-font-semibold`}>{count}</span>;
                  }}
                />
                <Column
                  dataField="message"
                  caption="Message"
                  width={300}
                />
                <Column
                  dataField="volumeHistoryRecordCount"
                  caption="VH Records"
                  alignment="center"
                />
                <Column
                  dataField="duration"
                  caption="Duration"
                  alignment="center"
                  customizeText={(cellInfo) => {
                    if (!cellInfo.value) return '-';
                    // Parse duration format "00:00:01.1234567"
                    const parts = cellInfo.value.split(':');
                    if (parts.length === 3) {
                      const seconds = parseFloat(parts[2]);
                      return `${seconds.toFixed(2)}s`;
                    }
                    return cellInfo.value;
                  }}
                />
              </DataGrid>
            </div>
          )}

          {/* Fix Results Table */}
          {fixResult?.fixResults?.length > 0 && (
            <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-6">
              <h3 className="tw-text-lg tw-font-semibold tw-mb-4 tw-flex tw-items-center tw-gap-2">
                <i className="fa-light fa-check-double tw-text-green-500"></i>
                Fix Results
              </h3>

              <DataGrid
                dataSource={fixResult.fixResults}
                showBorders={true}
                showRowLines={true}
                rowAlternationEnabled={true}
                hoverStateEnabled={true}
                columnAutoWidth={true}
              >
                <Column
                  dataField="status"
                  caption="Status"
                  alignment="center"
                  cellRender={(data) => {
                    const isSuccess = data.value === 'SUCCESS';
                    return (
                      <span className={isSuccess ? 'tw-text-green-600' : 'tw-text-red-600'}>
                        <i className={`fa-light ${isSuccess ? 'fa-circle-check' : 'fa-circle-xmark'} tw-mr-1`}></i>
                        {data.value}
                      </span>
                    );
                  }}
                />
                <Column dataField="recordsFixed" caption="Records Fixed" alignment="center" />
                <Column dataField="message" caption="Message" />
                <Column
                  dataField="fixedAt"
                  caption="Fixed At"
                  dataType="datetime"
                  format="dd/MM/yyyy HH:mm"
                />
              </DataGrid>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {(error.batchCheck || error.batchFix) && (
        <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg tw-p-4">
          <div className="tw-flex tw-items-start tw-gap-3">
            <i className="fa-light fa-circle-exclamation tw-text-2xl tw-text-red-600"></i>
            <div>
              <h4 className="tw-font-semibold tw-text-red-900 tw-mb-1">Error</h4>
              <p className="tw-text-red-700 tw-text-sm">
                {error.batchCheck?.message || error.batchFix?.message || 'An error occurred'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Panel */}
      {!result && !isProcessing && (
        <div className="tw-bg-purple-50 tw-border tw-border-purple-200 tw-rounded-lg tw-p-6">
          <div className="tw-flex tw-items-start tw-gap-3">
            <i className="fa-light fa-circle-info tw-text-2xl tw-text-purple-600"></i>
            <div>
              <h4 className="tw-font-semibold tw-text-purple-900 tw-mb-2">Batch Processing Tips</h4>
              <ul className="tw-text-sm tw-text-purple-800 tw-space-y-1 tw-list-disc tw-list-inside">
                <li>Select a date range up to 90 days</li>
                <li>Use "Check Only" mode to review discrepancies before fixing</li>
                <li>Enable "Auto-Fix" to automatically correct all discrepancies found</li>
                <li>Larger date ranges may take longer to process</li>
                <li>All fixes are logged and can be audited</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchReconciliationTool;
