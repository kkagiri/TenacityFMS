/**
 * Step3TankPreview.js
 * Step 3: Tank Volume Data Preview
 *
 * Purpose: Collect and display tank volume data for user review.
 * This data will be used in subsequent steps (Step 6 Review & Create).
 *
 * Shows selected tanks with their audit period data:
 * - Opening stock (at period start date)
 * - Closing stock (at period end date)
 * - Total deliveries
 * - Total dispensed
 * - Transfers in (from other tanks)
 * - Transfers out (to other tanks)
 *
 * Data comes from TankVolumeHistory via /fuelaudit/tank-preview endpoint
 */

import React, { useEffect, useCallback, useMemo, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataGrid, { Column, Summary, TotalItem } from 'devextreme-react/data-grid';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import { Button } from 'devextreme-react/button';

import {
  selectWizard,
  selectLoading,
  fetchTankVolumePreview,
  selectWizardTankPreview
} from '../../../../../redux/slices/fuelAuditSlice';

const Step3TankPreview = memo(() => {
  const dispatch = useDispatch();
  const wizard = useSelector(selectWizard);
  const loading = useSelector(selectLoading);
  const tankPreview = useSelector(selectWizardTankPreview);

  // Load tank preview data when step is reached
  const loadPreviewData = useCallback(() => {
    if (wizard.selectedTankIds?.length > 0 && wizard.periodStart && wizard.periodEnd) {
      dispatch(fetchTankVolumePreview({
        tankIds: wizard.selectedTankIds,
        startDate: wizard.periodStart,
        endDate: wizard.periodEnd,
        siteId: wizard.siteId
      }));
    }
  }, [dispatch, wizard.selectedTankIds, wizard.periodStart, wizard.periodEnd, wizard.siteId]);

  // Load on mount if we have required data
  useEffect(() => {
    if (wizard.selectedTankIds?.length > 0 && !tankPreview?.length) {
      loadPreviewData();
    }
  }, [loadPreviewData, wizard.selectedTankIds, tankPreview]);

  // Calculate summary totals
  const summaryTotals = useMemo(() => {
    if (!tankPreview || tankPreview.length === 0) {
      return {
        openingStock: 0,
        closingStock: 0,
        deliveries: 0,
        dispensed: 0,
        transfersIn: 0,
        transfersOut: 0,
        variance: 0,
        tankCount: 0
      };
    }

    return {
      openingStock: tankPreview.reduce((sum, t) => sum + (t.openingStock || 0), 0),
      closingStock: tankPreview.reduce((sum, t) => sum + (t.closingStock || 0), 0),
      deliveries: tankPreview.reduce((sum, t) => sum + (t.totalDeliveries || 0), 0),
      dispensed: tankPreview.reduce((sum, t) => sum + (t.totalDispensed || 0), 0),
      transfersIn: tankPreview.reduce((sum, t) => sum + (t.totalTransfersIn || 0), 0),
      transfersOut: tankPreview.reduce((sum, t) => sum + (t.totalTransfersOut || 0), 0),
      variance: tankPreview.reduce((sum, t) => sum + (t.variance || 0), 0),
      tankCount: tankPreview.length
    };
  }, [tankPreview]);

  // Render data source indicator
  const renderDataSource = (cellData) => {
    const source = cellData.value;
    const isManual = source === 'Manual';
    return (
      <span className={`tw-flex tw-items-center tw-gap-1 tw-text-xs ${isManual ? 'tw-text-green-600' : 'tw-text-yellow-600'}`}>
        <i className={`fa-light ${isManual ? 'fa-check-circle' : 'fa-calculator'}`}></i>
        {source}
      </span>
    );
  };

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  const isLoading = loading.tankPreview;
  const previewData = tankPreview || [];

  return (
    <div className="wizard-step tw-p-6">
      <h3 className="tw-text-lg tw-font-semibold tw-mb-2">
        <i className="fa-light fa-chart-bar tw-mr-2"></i>
        Tank Volume Preview
      </h3>
      <p className="tw-text-sm tw-text-gray-600 tw-mb-4">
        Review tank stock levels and transactions for the audit period.
        Opening and closing stocks are derived from TankVolumeHistory records.
      </p>

      {/* Period info header */}
      {wizard.periodStart && wizard.periodEnd && (
        <div className="tw-mb-4 tw-p-3 tw-bg-blue-50 tw-rounded-lg tw-border tw-border-blue-200 tw-flex tw-items-center tw-justify-between">
          <div className="tw-flex tw-items-center tw-gap-6">
            <div>
              <i className="fa-light fa-calendar tw-text-blue-600 tw-mr-2"></i>
              <span className="tw-text-sm tw-text-blue-800">
                {formatDate(wizard.periodStart)} — {formatDate(wizard.periodEnd)}
              </span>
            </div>
            <div>
              <i className="fa-light fa-database tw-text-blue-600 tw-mr-2"></i>
              <span className="tw-text-sm tw-text-blue-800">
                {wizard.selectedTankIds?.length || 0} tank(s) selected
              </span>
            </div>
          </div>
          <Button
            text="Refresh"
            icon="refresh"
            type="normal"
            stylingMode="text"
            onClick={loadPreviewData}
            disabled={isLoading}
          />
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="tw-flex tw-items-center tw-justify-center tw-py-12">
          <LoadIndicator />
          <span className="tw-ml-3 tw-text-gray-600">Loading tank volume data...</span>
        </div>
      )}

      {/* Tank preview data */}
      {!isLoading && previewData.length > 0 && (
        <>
          {/* Summary Cards - 6 columns */}
          <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-3 lg:tw-grid-cols-6 tw-gap-3 tw-mb-4">
            {/* Opening */}
            <div className="tw-bg-green-50 tw-p-3 tw-rounded-lg tw-border tw-border-green-200">
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-1">
                <i className="fa-light fa-sunrise tw-text-green-600 tw-text-lg"></i>
                <span className="tw-text-xs tw-text-green-600 tw-font-medium">Opening</span>
              </div>
              <p className="tw-text-xl tw-font-bold tw-text-green-700">
                {summaryTotals.openingStock.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="tw-text-xs tw-text-green-600">Liters</p>
            </div>

            {/* Deliveries */}
            <div className="tw-bg-blue-50 tw-p-3 tw-rounded-lg tw-border tw-border-blue-200">
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-1">
                <i className="fa-light fa-truck-ramp tw-text-blue-600 tw-text-lg"></i>
                <span className="tw-text-xs tw-text-blue-600 tw-font-medium">Deliveries</span>
              </div>
              <p className="tw-text-xl tw-font-bold tw-text-blue-700">
                +{summaryTotals.deliveries.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="tw-text-xs tw-text-blue-600">Received</p>
            </div>

            {/* Dispensed */}
            <div className="tw-bg-purple-50 tw-p-3 tw-rounded-lg tw-border tw-border-purple-200">
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-1">
                <i className="fa-light fa-gas-pump tw-text-purple-600 tw-text-lg"></i>
                <span className="tw-text-xs tw-text-purple-600 tw-font-medium">Dispensed</span>
              </div>
              <p className="tw-text-xl tw-font-bold tw-text-purple-700">
                -{summaryTotals.dispensed.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="tw-text-xs tw-text-purple-600">Issued</p>
            </div>

            {/* Transfer In */}
            <div className="tw-bg-cyan-50 tw-p-3 tw-rounded-lg tw-border tw-border-cyan-200">
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-1">
                <i className="fa-light fa-arrow-right-to-arc tw-text-cyan-600 tw-text-lg"></i>
                <span className="tw-text-xs tw-text-cyan-600 tw-font-medium">Transfer In</span>
              </div>
              <p className="tw-text-xl tw-font-bold tw-text-cyan-700">
                +{summaryTotals.transfersIn.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="tw-text-xs tw-text-cyan-600">From tanks</p>
            </div>

            {/* Transfer Out */}
            <div className="tw-bg-pink-50 tw-p-3 tw-rounded-lg tw-border tw-border-pink-200">
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-1">
                <i className="fa-light fa-arrow-right-from-arc tw-text-pink-600 tw-text-lg"></i>
                <span className="tw-text-xs tw-text-pink-600 tw-font-medium">Transfer Out</span>
              </div>
              <p className="tw-text-xl tw-font-bold tw-text-pink-700">
                -{summaryTotals.transfersOut.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="tw-text-xs tw-text-pink-600">To tanks</p>
            </div>

            {/* Closing */}
            <div className="tw-bg-orange-50 tw-p-3 tw-rounded-lg tw-border tw-border-orange-200">
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-1">
                <i className="fa-light fa-sunset tw-text-orange-600 tw-text-lg"></i>
                <span className="tw-text-xs tw-text-orange-600 tw-font-medium">Closing</span>
              </div>
              <p className="tw-text-xl tw-font-bold tw-text-orange-700">
                {summaryTotals.closingStock.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="tw-text-xs tw-text-orange-600">Liters</p>
            </div>
          </div>

          {/* Per-tank DataGrid */}
          <DataGrid
            dataSource={previewData}
            keyExpr="tankId"
            showBorders={true}
            showRowLines={true}
            columnAutoWidth={true}
            rowAlternationEnabled={true}
            height={400}
            wordWrapEnabled={true}
          >
            <Column dataField="tankName" caption="Tank" width={150} fixed={true} />

            {/* Opening Stock with date indicator */}
            <Column
              dataField="openingStock"
              caption={`Opening (L)\n${formatDate(wizard.periodStart)}`}
              width={130}
              dataType="number"
              format="#,##0.0"
              alignment="right"
              headerCellRender={() => (
                <div className="tw-text-center">
                  <div className="tw-font-semibold">Opening (L)</div>
                  <div className="tw-text-xs tw-text-gray-500">{formatDate(wizard.periodStart)}</div>
                </div>
              )}
            />

            <Column
              dataField="openingDataSource"
              caption="Source"
              width={90}
              cellRender={renderDataSource}
              alignment="center"
            />

            {/* Deliveries */}
            <Column
              dataField="totalDeliveries"
              caption="Deliveries (L)"
              width={120}
              dataType="number"
              format="#,##0.0"
              alignment="right"
              cellRender={(cellData) => (
                <span className="tw-text-blue-600 tw-font-medium">
                  +{(cellData.value || 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
              )}
            />

            {/* Dispensed */}
            <Column
              dataField="totalDispensed"
              caption="Dispensed (L)"
              width={120}
              dataType="number"
              format="#,##0.0"
              alignment="right"
              cellRender={(cellData) => (
                <span className="tw-text-purple-600 tw-font-medium">
                  -{(cellData.value || 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
              )}
            />

            {/* Transfers In */}
            <Column
              dataField="totalTransfersIn"
              caption="Transfer In (L)"
              width={120}
              dataType="number"
              format="#,##0.0"
              alignment="right"
              cellRender={(cellData) => {
                const value = cellData.value || 0;
                return value > 0 ? (
                  <span className="tw-text-cyan-600 tw-font-medium">
                    +{value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </span>
                ) : (
                  <span className="tw-text-gray-400">0.0</span>
                );
              }}
            />

            {/* Transfers Out */}
            <Column
              dataField="totalTransfersOut"
              caption="Transfer Out (L)"
              width={130}
              dataType="number"
              format="#,##0.0"
              alignment="right"
              cellRender={(cellData) => {
                const value = cellData.value || 0;
                return value > 0 ? (
                  <span className="tw-text-pink-600 tw-font-medium">
                    -{value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </span>
                ) : (
                  <span className="tw-text-gray-400">0.0</span>
                );
              }}
            />

            {/* Closing Stock with date indicator */}
            <Column
              dataField="closingStock"
              caption={`Closing (L)\n${formatDate(wizard.periodEnd)}`}
              width={130}
              dataType="number"
              format="#,##0.0"
              alignment="right"
              headerCellRender={() => (
                <div className="tw-text-center">
                  <div className="tw-font-semibold">Closing (L)</div>
                  <div className="tw-text-xs tw-text-gray-500">{formatDate(wizard.periodEnd)}</div>
                </div>
              )}
            />

            <Summary>
              <TotalItem
                column="tankName"
                summaryType="count"
                displayFormat="Total: {0} tanks"
              />
              <TotalItem
                column="openingStock"
                summaryType="sum"
                valueFormat="#,##0.0"
                displayFormat="{0} L"
              />
              <TotalItem
                column="totalDeliveries"
                summaryType="sum"
                valueFormat="#,##0.0"
                displayFormat="+{0} L"
              />
              <TotalItem
                column="totalDispensed"
                summaryType="sum"
                valueFormat="#,##0.0"
                displayFormat="-{0} L"
              />
              <TotalItem
                column="totalTransfersIn"
                summaryType="sum"
                valueFormat="#,##0.0"
                displayFormat="+{0} L"
              />
              <TotalItem
                column="totalTransfersOut"
                summaryType="sum"
                valueFormat="#,##0.0"
                displayFormat="-{0} L"
              />
              <TotalItem
                column="closingStock"
                summaryType="sum"
                valueFormat="#,##0.0"
                displayFormat="{0} L"
              />
            </Summary>
          </DataGrid>

          {/* Info note */}
          <div className="tw-mt-4 tw-p-3 tw-bg-gray-100 tw-rounded-lg">
            <div className="tw-flex tw-items-start tw-gap-2">
              <i className="fa-light fa-info-circle tw-text-blue-500 tw-mt-0.5"></i>
              <div className="tw-text-sm tw-text-gray-600">
                <p className="tw-mb-2">
                  <strong>Data Collection:</strong> This step collects tank volume data that will be used for the fuel audit review in Step 6.
                </p>
                <p className="tw-mb-1">
                  <strong>Opening/Closing:</strong> "Manual" indicates explicit stock readings. "Calculated" means derived from the most recent transaction before the period boundary.
                </p>
                <p>
                  <strong>Transfers:</strong> Transfer In shows fuel received from other tanks. Transfer Out shows fuel sent to other tanks.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* No data available */}
      {!isLoading && previewData.length === 0 && wizard.selectedTankIds?.length > 0 && (
        <div className="tw-text-center tw-py-10 tw-bg-yellow-50 tw-rounded-lg tw-border tw-border-yellow-200">
          <i className="fa-light fa-database tw-text-4xl tw-text-yellow-500 tw-mb-3"></i>
          <p className="tw-text-gray-700 tw-font-medium">No volume history data found</p>
          <p className="tw-text-sm tw-text-gray-500 tw-mt-2">
            No TankVolumeHistory records exist for the selected tanks during this period.
          </p>
          <Button
            text="Refresh Data"
            icon="refresh"
            type="default"
            className="tw-mt-4"
            onClick={loadPreviewData}
          />
        </div>
      )}

      {/* No tanks selected */}
      {!wizard.selectedTankIds?.length && (
        <div className="tw-text-center tw-py-10 tw-bg-gray-50 tw-rounded-lg">
          <i className="fa-light fa-database tw-text-4xl tw-text-gray-400 tw-mb-3"></i>
          <p className="tw-text-gray-600">Please select tanks in Step 2 first.</p>
        </div>
      )}
    </div>
  );
}
);

Step3TankPreview.displayName = 'Step3TankPreview';

export default Step3TankPreview;
