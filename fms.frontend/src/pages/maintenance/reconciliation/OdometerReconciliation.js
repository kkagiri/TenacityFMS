import React, { useState, useEffect, useCallback } from 'react';
import { DataGrid } from 'devextreme-react';
import {
  Column,
  Paging,
  SearchPanel,
  HeaderFilter,
  FilterRow,
  Scrolling,
  Selection,
  Toolbar,
  Item,
} from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { CheckBox } from 'devextreme-react/check-box';
import { Popup } from 'devextreme-react/popup';
import { ProgressBar } from 'devextreme-react/progress-bar';
import notify from 'devextreme/ui/notify';
import odometerSyncApi, {
  getAllVehicleOdometerStatus,
  syncOdometerFromGPS,
  syncOdometerToGPS,
  batchSyncFromGPS,
  getOdometerSourceLabel,
  getOdometerSourceIcon,
  OdometerSource,
} from '../../../api/odometerSyncApi';

/**
 * Odometer Reconciliation Component
 * Compare GPS odometer readings with database values
 * Allow bulk updates from GPS to Database
 */
const OdometerReconciliation = () => {
  const [comparisons, setComparisons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [onlyDiscrepancies, setOnlyDiscrepancies] = useState(true);

  // Bulk update state
  const [updatePopupVisible, setUpdatePopupVisible] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState({
    total: 0,
    processed: 0,
    success: 0,
    failed: 0,
  });

  const fetchComparisons = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllVehicleOdometerStatus(onlyDiscrepancies);

      if (response.isSuccess) {
        // Transform data to match the grid's expected format
        const transformedData = (response.data || []).map((item) => ({
          vehicleId: item.vehicleId,
          hyoungNo: item.hyoungNo,
          numberPlate: item.numberPlate,
          averageKmL: item.averageKmL,
          unit: item.unit,
          hasGpsMapping: item.hasGPSMapping,
          gpsUserId: item.gpsUserId,
          gpsAccumulatorId: item.gpsAccumulatorId,
          gpsOdometer: item.gpsReading ? item.gpsReading / (item.averageKmL ? 1000 : 1) : null, // Convert meters to km
          gpsTimestamp: item.gpsReadingTimestamp,
          databaseOdometer: item.storedPhysicalReading ? parseFloat(item.storedPhysicalReading) : null,
          fuelingOdometer: item.fuelingReading,
          fuelingSource: item.fuelingSource,
          fuelingTimestamp: item.fuelingTimestamp,
          recommendedReading: item.recommendedReading,
          recommendedSource: item.recommendedSource,
          recommendedTimestamp: item.recommendedTimestamp,
          syncNeeded: item.syncNeeded,
          discrepancy: item.readingDifference,
          hasSignificantDiscrepancy: item.syncNeeded,
          discrepancyPercentage: item.fuelingReading && item.readingDifference
            ? (item.readingDifference / item.fuelingReading) * 100
            : null,
        }));

        setComparisons(transformedData);
        notify(
          `Loaded ${transformedData.length} vehicles`,
          'success',
          2000
        );
      } else {
        notify(response.message || 'Failed to load comparisons', 'error', 3000);
      }
    } catch (error) {
      console.error('Error fetching odometer comparisons:', error);
      notify('Error loading odometer comparisons', 'error', 3000);
    } finally {
      setLoading(false);
    }
  }, [onlyDiscrepancies]);

  useEffect(() => {
    fetchComparisons();
  }, [fetchComparisons]);

  const handleBulkUpdate = async () => {
    if (selectedVehicles.length === 0) {
      notify('Please select vehicles to update', 'warning', 2000);
      return;
    }

    // Filter vehicles that need sync and have GPS data
    const validVehicles = selectedVehicles.filter(v => v.hasGpsMapping && v.gpsOdometer != null);

    if (validVehicles.length === 0) {
      notify('Selected vehicles have no GPS odometer data', 'warning', 3000);
      return;
    }

    setUpdateProgress({
      total: validVehicles.length,
      processed: 0,
      success: 0,
      failed: 0,
    });
    setUpdatePopupVisible(true);
    setUpdating(true);

    let successCount = 0;
    let failCount = 0;

    try {
      // Use batch sync API
      const response = await batchSyncFromGPS(true);

      if (response.isSuccess && response.data) {
        const result = response.data;
        successCount = result.successCount || 0;
        failCount = result.failedCount || 0;

        setUpdateProgress({
          total: result.totalVehicles || validVehicles.length,
          processed: successCount + failCount,
          success: successCount,
          failed: failCount,
        });

        notify(
          `Updated ${successCount} vehicles successfully`,
          'success',
          3000
        );

        // Refresh data
        await fetchComparisons();
        setSelectedVehicles([]);
      } else {
        notify(response.message || 'Bulk update failed', 'error', 3000);
      }
    } catch (error) {
      console.error('Error during bulk update:', error);
      notify('Error updating vehicle odometers', 'error', 3000);
    } finally {
      setUpdating(false);
    }
  };

  // Handle single vehicle sync
  const handleSingleSync = async (vehicleId, direction = 'from-gps') => {
    try {
      let response;
      if (direction === 'from-gps') {
        response = await syncOdometerFromGPS(vehicleId);
      } else {
        response = await syncOdometerToGPS(vehicleId);
      }

      if (response.isSuccess && response.data?.success) {
        notify(response.data.message || 'Sync completed', 'success', 2000);
        await fetchComparisons();
      } else {
        notify(response.message || response.data?.message || 'Sync failed', 'error', 3000);
      }
    } catch (error) {
      console.error('Error syncing vehicle:', error);
      notify('Error syncing vehicle odometer', 'error', 3000);
    }
  };

  const renderDiscrepancyCell = (data) => {
    const discrepancy = data.value;
    if (discrepancy == null) {
      return <span className="tw-text-gray-400">-</span>;
    }

    const isSignificant = data.data.hasSignificantDiscrepancy;
    const colorClass = isSignificant
      ? 'tw-text-red-600 tw-font-semibold'
      : 'tw-text-gray-700';

    return (
      <div className={`tw-flex tw-items-center tw-gap-2 ${colorClass}`}>
        {isSignificant && <i className="fa-light fa-exclamation-triangle"></i>}
        <span>{discrepancy.toFixed(1)} km</span>
      </div>
    );
  };

  const renderGpsOdometerCell = (data) => {
    const value = data.value;
    if (value == null) {
      return <span className="tw-text-gray-400">No GPS data</span>;
    }

    return (
      <div className="tw-flex tw-items-center tw-gap-1">
        <i className="fa-light fa-satellite-dish tw-text-blue-600"></i>
        <span className="tw-font-mono">{value.toLocaleString()} {data.data.gpsUnit || 'km'}</span>
      </div>
    );
  };

  const renderDatabaseOdometerCell = (data) => {
    const value = data.value;
    if (value == null) {
      return <span className="tw-text-gray-400">Not set</span>;
    }

    return (
      <span className="tw-font-mono">{value.toLocaleString()} km</span>
    );
  };

  const renderMappingStatusCell = (data) => {
    const hasMapping = data.data.hasGpsMapping;

    if (!hasMapping) {
      return (
        <span className="tw-text-gray-400 tw-text-sm">
          <i className="fa-light fa-circle-xmark tw-mr-1"></i>
          No GPS
        </span>
      );
    }

    return (
      <div className="tw-text-sm">
        <div className="tw-text-green-600">
          <i className="fa-light fa-check-circle tw-mr-1"></i>
          {data.data.providerName}
        </div>
        <div className="tw-text-gray-500 tw-text-xs tw-font-mono">
          {data.data.externalDeviceId}
        </div>
      </div>
    );
  };

  const renderTimestampCell = (data) => {
    const timestamp = data.value;
    if (!timestamp) {
      return <span className="tw-text-gray-400">-</span>;
    }

    const date = new Date(timestamp);
    const now = new Date();
    const hoursDiff = (now - date) / (1000 * 60 * 60);

    const isStale = hoursDiff > 24;
    const colorClass = isStale ? 'tw-text-orange-600' : 'tw-text-gray-700';

    return (
      <div className={`tw-text-sm ${colorClass}`}>
        <div>{date.toLocaleDateString()}</div>
        <div className="tw-text-xs">{date.toLocaleTimeString()}</div>
        {isStale && (
          <div className="tw-text-xs">
            <i className="fa-light fa-clock tw-mr-1"></i>
            {Math.round(hoursDiff)}h ago
          </div>
        )}
      </div>
    );
  };

  const statistics = {
    total: comparisons.length,
    withGps: comparisons.filter(c => c.hasGpsMapping).length,
    withDiscrepancies: comparisons.filter(c => c.hasSignificantDiscrepancy).length,
    avgDiscrepancy: comparisons.length > 0
      ? comparisons.reduce((sum, c) => sum + (c.discrepancy || 0), 0) / comparisons.length
      : 0,
  };

  return (
    <div className="tw-p-6">
      <div className="tw-bg-white tw-rounded-lg tw-shadow">
        {/* Header */}
        <div className="tw-p-6 tw-border-b tw-border-gray-200">
          <div className="tw-flex tw-justify-between tw-items-start">
            <div>
              <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">
                Odometer Reconciliation
              </h2>
              <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
                Compare GPS odometer readings with database values and bulk update
              </p>
            </div>
            <div className="tw-flex tw-gap-2">
              <Button
                icon="fa-light fa-refresh"
                text="Refresh"
                onClick={fetchComparisons}
                disabled={loading}
              />
              <Button
                icon="fa-light fa-cloud-arrow-down"
                text={`Update Selected (${selectedVehicles.length})`}
                type="success"
                onClick={handleBulkUpdate}
                disabled={selectedVehicles.length === 0 || loading}
              />
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-4 tw-gap-4 tw-mt-4">
            <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded tw-p-3">
              <div className="tw-text-xs tw-text-blue-600 tw-mb-1">Total Vehicles</div>
              <div className="tw-text-2xl tw-font-bold tw-text-blue-700">
                {statistics.total}
              </div>
            </div>
            <div className="tw-bg-green-50 tw-border tw-border-green-200 tw-rounded tw-p-3">
              <div className="tw-text-xs tw-text-green-600 tw-mb-1">With GPS Mapping</div>
              <div className="tw-text-2xl tw-font-bold tw-text-green-700">
                {statistics.withGps}
              </div>
            </div>
            <div className="tw-bg-orange-50 tw-border tw-border-orange-200 tw-rounded tw-p-3">
              <div className="tw-text-xs tw-text-orange-600 tw-mb-1">With Discrepancies</div>
              <div className="tw-text-2xl tw-font-bold tw-text-orange-700">
                {statistics.withDiscrepancies}
              </div>
            </div>
            <div className="tw-bg-purple-50 tw-border tw-border-purple-200 tw-rounded tw-p-3">
              <div className="tw-text-xs tw-text-purple-600 tw-mb-1">Avg Discrepancy</div>
              <div className="tw-text-2xl tw-font-bold tw-text-purple-700">
                {statistics.avgDiscrepancy.toFixed(0)} km
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="tw-flex tw-gap-4 tw-mt-4 tw-items-center">
            <CheckBox
              text="Only show vehicles needing sync"
              value={onlyDiscrepancies}
              onValueChanged={(e) => setOnlyDiscrepancies(e.value)}
            />
            <span className="tw-text-sm tw-text-gray-500">
              <i className="fa-light fa-info-circle tw-mr-1"></i>
              Data synced from GPS and fueling records
            </span>
          </div>
        </div>

        {/* Data Grid */}
        <div className="tw-p-6">
          <DataGrid
            dataSource={comparisons}
            keyExpr="vehicleId"
            showBorders={true}
            rowAlternationEnabled={true}
            hoverStateEnabled={true}
            selectedRowKeys={selectedVehicles.map(v => v.vehicleId)}
            onSelectionChanged={(e) => setSelectedVehicles(e.selectedRowsData)}
          >
            <Selection mode="multiple" showCheckBoxesMode="always" />
            <SearchPanel visible={true} />
            <HeaderFilter visible={true} />
            <FilterRow visible={true} />
            <Scrolling mode="virtual" />
            <Paging enabled={false} />

            <Column dataField="vehicleId" caption="ID" width={80} />
            <Column dataField="hyoungNo" caption="Vehicle" width={120} />
            <Column dataField="numberPlate" caption="Plate" width={100} />

            <Column
              caption="GPS Mapping"
              cellRender={renderMappingStatusCell}
              width={150}
            />

            <Column
              dataField="gpsOdometer"
              caption="GPS Odometer"
              cellRender={renderGpsOdometerCell}
              width={160}
            />

            <Column
              dataField="gpsTimestamp"
              caption="GPS Updated"
              cellRender={renderTimestampCell}
              width={140}
            />

            <Column
              dataField="databaseOdometer"
              caption="DB Odometer"
              cellRender={renderDatabaseOdometerCell}
              width={140}
            />

            <Column
              dataField="fuelingOdometer"
              caption="Fueling Reading"
              width={150}
              cellRender={(data) => {
                const value = data.value;
                const source = data.data.fuelingSource;
                if (value == null) {
                  return <span className="tw-text-gray-400">No data</span>;
                }
                return (
                  <div className="tw-flex tw-items-center tw-gap-1">
                    <i className="fa-light fa-gas-pump tw-text-amber-600"></i>
                    <span className="tw-font-mono">{value.toLocaleString()} {data.data.gpsUnit || 'km'}</span>
                    {source && <span className="tw-text-xs tw-text-gray-500">({source})</span>}
                  </div>
                );
              }}
            />

            <Column
              dataField="discrepancy"
              caption="Discrepancy"
              cellRender={renderDiscrepancyCell}
              width={140}
              sortOrder="desc"
            />

            <Column
              dataField="recommendedSource"
              caption="Recommended"
              width={130}
              cellRender={(data) => {
                const source = data.value;
                if (!source) return <span className="tw-text-gray-400">-</span>;

                const sourceColors = {
                  'GPS': 'tw-text-blue-600 tw-bg-blue-50',
                  'Fueling': 'tw-text-amber-600 tw-bg-amber-50',
                  'Database': 'tw-text-green-600 tw-bg-green-50'
                };
                const colorClass = sourceColors[source] || 'tw-text-gray-600 tw-bg-gray-50';

                return (
                  <span className={`tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-font-medium ${colorClass}`}>
                    {source}
                  </span>
                );
              }}
            />

            <Column
              caption="Actions"
              width={120}
              cellRender={(data) => {
                const row = data.data;
                if (!row.hasGpsMapping) {
                  return <span className="tw-text-gray-400 tw-text-xs">No GPS</span>;
                }
                return (
                  <div className="tw-flex tw-gap-1">
                    <button
                      className="tw-px-2 tw-py-1 tw-text-xs tw-bg-blue-100 tw-text-blue-700 tw-rounded hover:tw-bg-blue-200"
                      onClick={() => handleSingleSync(row.vehicleId, 'from-gps')}
                      title="Sync from GPS to Database"
                    >
                      <i className="fa-light fa-cloud-arrow-down"></i>
                    </button>
                    <button
                      className="tw-px-2 tw-py-1 tw-text-xs tw-bg-green-100 tw-text-green-700 tw-rounded hover:tw-bg-green-200"
                      onClick={() => handleSingleSync(row.vehicleId, 'to-gps')}
                      title="Sync from Database to GPS"
                    >
                      <i className="fa-light fa-cloud-arrow-up"></i>
                    </button>
                  </div>
                );
              }}
            />
          </DataGrid>
        </div>
      </div>

      {/* Bulk Update Progress Popup */}
      <Popup
        visible={updatePopupVisible}
        onHiding={() => setUpdatePopupVisible(false)}
        dragEnabled={false}
        closeOnOutsideClick={false}
        showCloseButton={!updating}
        showTitle={true}
        title="Updating Vehicle Odometers"
        width={500}
        height="auto"
      >
        <div className="tw-p-6">
          <div className="tw-mb-4">
            <div className="tw-flex tw-justify-between tw-items-center tw-mb-2">
              <span className="tw-text-sm tw-font-medium tw-text-gray-700">
                Progress: {updateProgress.processed} / {updateProgress.total}
              </span>
              <span className="tw-text-sm tw-font-semibold tw-text-blue-600">
                {updateProgress.total > 0
                  ? Math.round((updateProgress.processed / updateProgress.total) * 100)
                  : 0}
                %
              </span>
            </div>

            <ProgressBar
              min={0}
              max={updateProgress.total}
              value={updateProgress.processed}
              showStatus={false}
            />
          </div>

          <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-mb-4">
            <div className="tw-bg-green-50 tw-border tw-border-green-200 tw-rounded tw-p-3">
              <div className="tw-text-xs tw-text-green-600 tw-mb-1">Successful</div>
              <div className="tw-text-2xl tw-font-bold tw-text-green-700">
                {updateProgress.success}
              </div>
            </div>

            <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded tw-p-3">
              <div className="tw-text-xs tw-text-red-600 tw-mb-1">Failed</div>
              <div className="tw-text-2xl tw-font-bold tw-text-red-700">
                {updateProgress.failed}
              </div>
            </div>
          </div>

          {!updating && updateProgress.processed === updateProgress.total && (
            <div className="tw-bg-green-50 tw-border tw-border-green-200 tw-rounded tw-p-3 tw-mb-4">
              <div className="tw-flex tw-items-center tw-gap-2">
                <i className="fa-light fa-check-circle tw-text-green-600"></i>
                <span className="tw-text-sm tw-text-green-800 tw-font-medium">
                  Update completed successfully!
                </span>
              </div>
            </div>
          )}

          {!updating && (
            <div className="tw-flex tw-justify-end tw-mt-4">
              <Button
                stylingMode="contained"
                text="Close"
                onClick={() => setUpdatePopupVisible(false)}
              />
            </div>
          )}
        </div>
      </Popup>
    </div>
  );
};

export default OdometerReconciliation;
