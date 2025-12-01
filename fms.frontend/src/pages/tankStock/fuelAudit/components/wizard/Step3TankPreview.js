/**
 * Step3TankPreview.js
 * Step 3: Tank Volume Data Preview
 *
  * Shows selected tanks with their audit period data:
 * - Opening stock (at period start)
 * - Closing stock (at period end)
 * - Total deliveries
 * - Total dispensed
 * - Transfers in/out
 * - Expected closing vs actual closing (variance)
 *
 * Data comes from TankVolumeHistory via /fuelaudit/tank-preview endpoint
 */

import React, { useEffect, useCallback, useMemo } from 'react';
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

const Step3TankPreview = () => {
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

  // Render fuel type with color coding
  const renderFuelType = (cellData) => {
    const fuelType = cellData.data.fuelGradeName || 'Unknown';
    const colorMap = {
      'Diesel': 'tw-bg-yellow-100 tw-text-yellow-800',
      'Petrol': 'tw-bg-blue-100 tw-text-blue-800',
      'AGO': 'tw-bg-orange-100 tw-text-orange-800',
      'PMS': 'tw-bg-purple-100 tw-text-purple-800'
    };
    const colorClass = colorMap[fuelType] || 'tw-bg-gray-100 tw-text-gray-800';

    return (
      <span className={`tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-font-medium ${colorClass}`}>
        {fuelType}
      </span>
    );
  };

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

  // Render variance with color coding
  const renderVariance = (cellData) => {
    const variance = cellData.data.variance || 0;
    const variancePercent = cellData.data.variancePercent || 0;

    let colorClass = 'tw-text-green-600';
    if (Math.abs(variancePercent) > 5) {
      colorClass = 'tw-text-red-600';
    } else if (Math.abs(variancePercent) > 2) {
      colorClass = 'tw-text-yellow-600';
    }

    return (
      <div className={`tw-text-right ${colorClass}`}>
        <span className="tw-font-medium">{variance.toFixed(1)} L</span>
        <span className="tw-text-xs tw-ml-1">({variancePercent.toFixed(1)}%)</span>
      </div>
    );
  };

  // Render confidence indicator
  const renderConfidence = (cellData) => {
    const confidence = cellData.value || 'Low';
    const colors = {
      'High': 'tw-bg-green-100 tw-text-green-700',
      'Medium': 'tw-bg-yellow-100 tw-text-yellow-700',
      'Low': 'tw-bg-red-100 tw-text-red-700'
    };
    const icons = {
      'High': 'fa-shield-check',
      'Medium': 'fa-shield-halved',
      'Low': 'fa-shield-exclamation'
    };

    return (
      <span className={`tw-px-2 tw-py-0.5 tw-rounded tw-text-xs tw-font-medium tw-flex tw-items-center tw-gap-1 ${colors[confidence]}`}>
        <i className={`fa-light ${icons[confidence]}`}></i>
        {confidence}
      </span>
    );
  };

  // Render fill percentage with visual bar
  const renderFillPercentage = (cellData) => {
    const percentage = cellData.value || 0;

    let bgColor = 'tw-bg-green-500';
    if (percentage < 20) bgColor = 'tw-bg-red-500';
    else if (percentage < 40) bgColor = 'tw-bg-yellow-500';

    return (
      <div className="tw-flex tw-items-center tw-gap-2">
        <div className="tw-w-16 tw-h-2 tw-bg-gray-200 tw-rounded-full tw-overflow-hidden">
          <div
            className={`tw-h-full ${bgColor} tw-transition-all`}
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>
        <span className="tw-text-xs tw-text-gray-600">{percentage.toFixed(0)}%</span>
      </div>
    );
  };

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
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
          {/* Summary Cards */}
          <div className="tw-grid tw-grid-cols-4 tw-gap-4 tw-mb-4">
            <div className="tw-bg-green-50 tw-p-4 tw-rounded-lg tw-border tw-border-green-200">
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
                <i className="fa-light fa-sunrise tw-text-green-600 tw-text-xl"></i>
                <span className="tw-text-xs tw-text-green-600 tw-font-medium">Opening</span>
              </div>
              <p className="tw-text-2xl tw-font-bold tw-text-green-700">
                {summaryTotals.openingStock.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="tw-text-xs tw-text-green-600">Liters</p>
            </div>

            <div className="tw-bg-orange-50 tw-p-4 tw-rounded-lg tw-border tw-border-orange-200">
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
                <i className="fa-light fa-sunset tw-text-orange-600 tw-text-xl"></i>
                <span className="tw-text-xs tw-text-orange-600 tw-font-medium">Closing</span>
              </div>
              <p className="tw-text-2xl tw-font-bold tw-text-orange-700">
                {summaryTotals.closingStock.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="tw-text-xs tw-text-orange-600">Liters</p>
            </div>

            <div className="tw-bg-blue-50 tw-p-4 tw-rounded-lg tw-border tw-border-blue-200">
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
                <i className="fa-light fa-truck-ramp tw-text-blue-600 tw-text-xl"></i>
                <span className="tw-text-xs tw-text-blue-600 tw-font-medium">Deliveries</span>
              </div>
              <p className="tw-text-2xl tw-font-bold tw-text-blue-700">
                +{summaryTotals.deliveries.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="tw-text-xs tw-text-blue-600">Liters received</p>
            </div>

            <div className="tw-bg-purple-50 tw-p-4 tw-rounded-lg tw-border tw-border-purple-200">
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
                <i className="fa-light fa-gas-pump tw-text-purple-600 tw-text-xl"></i>
                <span className="tw-text-xs tw-text-purple-600 tw-font-medium">Dispensed</span>
              </div>
              <p className="tw-text-2xl tw-font-bold tw-text-purple-700">
                -{summaryTotals.dispensed.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="tw-text-xs tw-text-purple-600">Liters issued</p>
            </div>
          </div>

          {/* Transfers summary (if any) */}
          {(summaryTotals.transfersIn > 0 || summaryTotals.transfersOut > 0) && (
            <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-mb-4">
              <div className="tw-bg-cyan-50 tw-p-3 tw-rounded-lg tw-border tw-border-cyan-200 tw-flex tw-items-center tw-justify-between">
                <div className="tw-flex tw-items-center tw-gap-2">
                  <i className="fa-light fa-arrow-right-to-arc tw-text-cyan-600"></i>
                  <span className="tw-text-sm tw-text-cyan-700">Transfers In</span>
                </div>
                <span className="tw-font-bold tw-text-cyan-700">
                  +{summaryTotals.transfersIn.toLocaleString(undefined, { maximumFractionDigits: 0 })} L
                </span>
              </div>
              <div className="tw-bg-pink-50 tw-p-3 tw-rounded-lg tw-border tw-border-pink-200 tw-flex tw-items-center tw-justify-between">
                <div className="tw-flex tw-items-center tw-gap-2">
                  <i className="fa-light fa-arrow-right-from-arc tw-text-pink-600"></i>
                  <span className="tw-text-sm tw-text-pink-700">Transfers Out</span>
                </div>
                <span className="tw-font-bold tw-text-pink-700">
                  -{summaryTotals.transfersOut.toLocaleString(undefined, { maximumFractionDigits: 0 })} L
                </span>
              </div>
            </div>
          )}

          {/* Per-tank DataGrid */}
          <DataGrid
            dataSource={previewData}
            keyExpr="tankId"
            showBorders={true}
            columnAutoWidth={true}
            rowAlternationEnabled={true}
            height={350}
            wordWrapEnabled={true}
          >
            <Column dataField="tankName" caption="Tank" width={150} />
            <Column
              dataField="fuelGradeName"
              caption="Fuel"
              width={80}
              cellRender={renderFuelType}
              alignment="center"
            />
            <Column
              dataField="openingStock"
              caption="Opening (L)"
              width={110}
              dataType="number"
              format="#,##0.0"
              alignment="right"
            />
            <Column
              dataField="openingDataSource"
              caption="Source"
              width={80}
              cellRender={renderDataSource}
              alignment="center"
            />
            <Column
              dataField="totalDeliveries"
              caption="Deliveries (L)"
              width={110}
              dataType="number"
              format="+#,##0.0;-#,##0.0"
              alignment="right"
              cellRender={(cellData) => (
                <span className="tw-text-blue-600">
                  +{(cellData.value || 0).toFixed(1)}
                </span>
              )}
            />
            <Column
              dataField="totalDispensed"
              caption="Dispensed (L)"
              width={110}
              dataType="number"
              format="#,##0.0"
              alignment="right"
              cellRender={(cellData) => (
                <span className="tw-text-purple-600">
                  -{(cellData.value || 0).toFixed(1)}
                </span>
              )}
            />
            <Column
              dataField="closingStock"
              caption="Closing (L)"
              width={110}
              dataType="number"
              format="#,##0.0"
              alignment="right"
            />
            <Column
              caption="Variance"
              width={120}
              cellRender={renderVariance}
              alignment="right"
            />
            <Column
              dataField="fillPercentage"
              caption="Fill %"
              width={120}
              cellRender={renderFillPercentage}
              alignment="center"
            />
            <Column
              dataField="dataConfidence"
              caption="Confidence"
              width={100}
              cellRender={renderConfidence}
              alignment="center"
            />

            <Summary>
              <TotalItem
                column="openingStock"
                summaryType="sum"
                displayFormat="Total: {0:n0} L"
              />
              <TotalItem
                column="totalDeliveries"
                summaryType="sum"
                displayFormat="+{0:n0} L"
              />
              <TotalItem
                column="totalDispensed"
                summaryType="sum"
                displayFormat="-{0:n0} L"
              />
              <TotalItem
                column="closingStock"
                summaryType="sum"
                displayFormat="Total: {0:n0} L"
              />
            </Summary>
          </DataGrid>

          {/* Variance alert if significant */}
          {Math.abs(summaryTotals.variance) > 0 && (
            <div className={`tw-mt-4 tw-p-3 tw-rounded-lg tw-border tw-flex tw-items-center tw-gap-3 ${
              Math.abs(summaryTotals.variance / summaryTotals.closingStock * 100) > 5
                ? 'tw-bg-red-50 tw-border-red-200'
                : 'tw-bg-yellow-50 tw-border-yellow-200'
            }`}>
              <i className={`fa-light fa-triangle-exclamation tw-text-xl ${
                Math.abs(summaryTotals.variance / summaryTotals.closingStock * 100) > 5
                  ? 'tw-text-red-500'
                  : 'tw-text-yellow-500'
              }`}></i>
              <div>
                <p className="tw-font-medium tw-text-gray-800">
                  Total Variance: {summaryTotals.variance.toFixed(1)} L
                </p>
                <p className="tw-text-sm tw-text-gray-600">
                  Review individual tank variances before proceeding.
                </p>
              </div>
            </div>
          )}

          {/* Info note */}
          <div className="tw-mt-4 tw-p-3 tw-bg-gray-100 tw-rounded-lg">
            <p className="tw-text-sm tw-text-gray-600">
              <i className="fa-light fa-info-circle tw-mr-2"></i>
              <strong>Opening/Closing:</strong> "Manual" indicates explicit stock readings. "Calculated" means
              derived from the most recent transaction before the period boundary.
            </p>
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
};

export default Step3TankPreview;
