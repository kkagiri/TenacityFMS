import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DateBox, SelectBox, Button, LoadIndicator } from 'devextreme-react';
import notify from 'devextreme/ui/notify';
import {
  checkSingleTankDate,
  fixSingleDate,
  clearSingleCheckResult,
  clearSingleFixResult,
  selectSingleCheckResult,
  selectSingleFixResult,
  selectLoading,
  selectError
} from '../../redux/slices/reconciliationSlice';
import { usePermissions } from '../../hooks/usePermissions';
import DiscrepancyTable from './components/DiscrepancyTable';
import ResultsCard from './components/ResultsCard';

/**
 * Manual Reconciliation Panel
 * Allows checking and fixing single tank-date reconciliation
 */
const ManualReconciliationPanel = () => {
  const dispatch = useDispatch();
  const { hasPermission } = usePermissions();
  const [tankId, setTankId] = useState(null);
  const [date, setDate] = useState(new Date());

  // Get tanks from Redux store
  const tanks = useSelector((state) => state.tank.tanks || []);
  const tanksLoading = useSelector((state) => state.tank.loading);

  const checkResult = useSelector(selectSingleCheckResult);
  const fixResult = useSelector(selectSingleFixResult);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);

  const canRead = hasPermission('_Read_TankStock');
  const canUpdate = hasPermission('_Update_TankStock');

  // Transform tanks for SelectBox
  const tanksDataSource = tanks.map(tank => ({
    id: tank.id,
    name: tank.name
  }));

  const handleCheckClick = async () => {
    if (!tankId) {
      notify('Please select a tank', 'warning', 3000);
      return;
    }

    if (!date) {
      notify('Please select a date', 'warning', 3000);
      return;
    }

    dispatch(clearSingleCheckResult());
    dispatch(clearSingleFixResult());

    const formattedDate = date.toISOString().split('T')[0];

    try {
      await dispatch(checkSingleTankDate({ tankId, date: formattedDate })).unwrap();
      notify('Reconciliation check completed', 'success', 3000);
    } catch (err) {
      notify(`Error: ${err.message || 'Failed to check reconciliation'}`, 'error', 5000);
    }
  };

  const handleFixClick = async () => {
    if (!checkResult || !checkResult.data) {
      notify('Please run a check first', 'warning', 3000);
      return;
    }

    if (checkResult.data.discrepanciesFound === 0) {
      notify('No discrepancies to fix', 'info', 3000);
      return;
    }

    try {
      await dispatch(fixSingleDate(checkResult.data)).unwrap();
      notify('Discrepancies fixed successfully', 'success', 3000);

      // Recheck after fix
      setTimeout(() => {
        handleCheckClick();
      }, 1000);
    } catch (err) {
      notify(`Error: ${err.message || 'Failed to fix discrepancies'}`, 'error', 5000);
    }
  };

  const handleClearResults = () => {
    dispatch(clearSingleCheckResult());
    dispatch(clearSingleFixResult());
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

  const hasDiscrepancies = checkResult?.data?.discrepanciesFound > 0;
  const selectedTank = tanksDataSource.find(t => t.id === tankId);

  return (
    <div className="tw-space-y-6">
      {/* Selection Form */}
      <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-6">
        <h3 className="tw-text-lg tw-font-semibold tw-mb-4 tw-flex tw-items-center tw-gap-2">
          <i className="fa-light fa-sliders tw-text-blue-500"></i>
          Selection Criteria
        </h3>

        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4 tw-mb-6">
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
              <i className="fa-light fa-calendar tw-mr-1"></i>
              Date
            </label>
            <DateBox
              value={date}
              onValueChanged={(e) => setDate(e.value)}
              displayFormat="dd/MM/yyyy"
              max={new Date()}
              showClearButton={true}
            />
          </div>
        </div>

        <div className="tw-flex tw-flex-wrap tw-gap-3">
          <Button
            text="Check for Discrepancies"
            icon="fa-light fa-magnifying-glass"
            type="default"
            stylingMode="contained"
            onClick={handleCheckClick}
            disabled={loading.singleCheck || !tankId || !date}
          >
            {loading.singleCheck && <LoadIndicator className="tw-mr-2" width={20} height={20} />}
          </Button>

          {hasDiscrepancies && canUpdate && (
            <Button
              text="Apply Fix"
              icon="fa-light fa-wrench"
              type="success"
              stylingMode="contained"
              onClick={handleFixClick}
              disabled={loading.singleFix}
            >
              {loading.singleFix && <LoadIndicator className="tw-mr-2" width={20} height={20} />}
            </Button>
          )}

          {(checkResult || fixResult) && (
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

      {/* Check Result */}
      {checkResult && !fixResult && (
        <div className="tw-space-y-4">
          <ResultsCard result={checkResult} type="check" />

          {checkResult.data?.discrepancies?.length > 0 && (
            <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-6">
              <h3 className="tw-text-lg tw-font-semibold tw-mb-4 tw-flex tw-items-center tw-gap-2">
                <i className="fa-light fa-list-check tw-text-orange-500"></i>
                Discrepancy Details
              </h3>
              <DiscrepancyTable
                discrepancies={checkResult.data.discrepancies}
                tankName={selectedTank?.name}
              />
            </div>
          )}
        </div>
      )}

      {/* Fix Result */}
      {fixResult && (
        <div className="tw-space-y-4">
          <ResultsCard result={fixResult} type="fix" />

          {checkResult?.data?.discrepancies?.length > 0 && (
            <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-6">
              <h3 className="tw-text-lg tw-font-semibold tw-mb-4 tw-flex tw-items-center tw-gap-2">
                <i className="fa-light fa-clock-rotate-left tw-text-blue-500"></i>
                Before Fix (Reference)
              </h3>
              <DiscrepancyTable
                discrepancies={checkResult.data.discrepancies}
                tankName={selectedTank?.name}
              />
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {(error.singleCheck || error.singleFix) && (
        <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg tw-p-4">
          <div className="tw-flex tw-items-start tw-gap-3">
            <i className="fa-light fa-circle-exclamation tw-text-2xl tw-text-red-600"></i>
            <div>
              <h4 className="tw-font-semibold tw-text-red-900 tw-mb-1">Error</h4>
              <p className="tw-text-red-700 tw-text-sm">
                {error.singleCheck?.message || error.singleFix?.message || 'An error occurred'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Panel */}
      {!checkResult && !fixResult && (
        <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-6">
          <div className="tw-flex tw-items-start tw-gap-3">
            <i className="fa-light fa-circle-info tw-text-2xl tw-text-blue-600"></i>
            <div>
              <h4 className="tw-font-semibold tw-text-blue-900 tw-mb-2">How it works</h4>
              <ul className="tw-text-sm tw-text-blue-800 tw-space-y-1 tw-list-disc tw-list-inside">
                <li>Select a tank and date to check for discrepancies</li>
                <li>The system compares Tank Stock (source of truth) with Volume History</li>
                <li>Any differences in Opening Stock, Closing Stock, Deliveries, Transfers will be shown</li>
                <li>Click "Apply Fix" to update Volume History to match Tank Stock values</li>
                <li>All changes are logged with user and timestamp for audit purposes</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualReconciliationPanel;
